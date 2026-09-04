#!/bin/bash
# Package the Marble preview app as a plain ZK web app WAR, so it can be dropped
# into a shared Tomcat for design review. See doc/preview-deployment.md.
#
#   ./scripts/build-preview-war.sh                                     # -> target/marble.war
#   WAR_NAME=marble-rc2 ./scripts/build-preview-war.sh                 # -> target/marble-rc2.war
#   ZK_VERSION=10.4.0-jakarta.FL.20260713-Eval ./scripts/build-preview-war.sh
#
# Locally the preview app runs as a Spring Boot main class (ThemePreviewApp).
# That class is deliberately left OUT of the WAR: a servlet container serves the
# very same ZUL pages through ZK's own DHtmlLayoutServlet, so the WAR needs no
# Spring at all - only the ZK jars, the theme jar and the preview view-models.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WAR_NAME="${WAR_NAME:-marble}"
# javax-servlet flavour of ZK 10.4.0 - the review server runs Tomcat 9 (Servlet 4.0).
# For a Tomcat 10/11 target use the jakarta flavour instead (see the header) and
# nothing else changes: the theme jar and the view-models touch no servlet API.
ZK_VERSION="${ZK_VERSION:-10.4.0.FL.20260713-Eval}"
JDK="${JDK:-17}"

STAGE="$ROOT/target/preview-war"
WAR="$ROOT/target/$WAR_NAME.war"
WEB="$ROOT/src/test/resources/web"

step() { printf '\n=== %s\n' "$1"; }

# -Dexec.skip=true switches off every exec-maven-plugin execution, which is what we
# want for a release build: the `watch-css` one is bound to process-resources and
# async, so it starts `npm run watch`, which then rebuilds the theme CSS in DEV mode
# (unminified) on top of the packaged output and leaves a file watcher behind. The
# other two exec executions are run explicitly below instead.
step "Compiling CSS (zk $ZK_VERSION)"
withjdk.sh "$JDK" ./mvnw -q clean
npm run build:css
./scripts/check-icon-coverage.sh

step "Building theme jar + preview classes"
withjdk.sh "$JDK" ./mvnw -q package -DskipTests -Dexec.skip=true -Dzk.version="$ZK_VERSION"

# target/ also holds -sources.jar and the Maven-Central -bundle.jar (pom + jar inside
# a jar), so name the main artifact explicitly rather than globbing for it.
POM_XPATH="string(/*[local-name()='project']/*[local-name()='%s'])"
THEME_JAR="$ROOT/target/$(xmllint --xpath "$(printf "$POM_XPATH" artifactId)" pom.xml)-$(xmllint --xpath "$(printf "$POM_XPATH" version)" pom.xml).jar"
[[ -f "$THEME_JAR" ]] || { echo "theme jar not built: $THEME_JAR" >&2; exit 1; }

# The Maven build above runs -Dexec.skip=true, which also switches off the stamp
# execution bound to process-test-resources - so run it explicitly, like the CSS build.
# It writes into target/test-classes/zk, which the staging step below rsyncs, so the
# sidebar on the review server can name the commit it was built from.
./scripts/stamp-commit.sh

step "Staging $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE/WEB-INF/classes"

# The preview pages are staged TWICE, on purpose:
#  - war root         -> DHtmlLayoutServlet serves them as /button.zul, /usecase/index.zul, ...
#  - WEB-INF/classes/web -> everything the pages pull with ZK's "~./" prefix
#                        (img/, media/, usecase/*.css, macro + template ZULs, and the
#                        SPA's own ~./<page>.zul navigation) resolves through
#                        ClassWebResource, which reads the classpath, not the war root.
rsync -a "$WEB/" "$STAGE/"
rsync -a "$WEB/" "$STAGE/WEB-INF/classes/web/"

# View-models / composers used by the pages. Skipped: the Spring Boot launchers
# (not needed and they would drag Spring into the WAR) and src/test/resources
# metainfo/zk.xml, which turns on debug-js for local development only.
rsync -a --exclude 'ThemePreviewApp*.class' --exclude 'iceblue/' \
	"$ROOT/target/test-classes/zk" "$STAGE/WEB-INF/classes/"

step "Removing the dev live-reload hook"
find "$STAGE" -name 'preview.zul' -o -name 'index.zul' | while read -r f; do
	perl -ni -e 'print unless m{zk-live-reload\.js}' "$f"
done

step "Collecting runtime jars"
withjdk.sh "$JDK" ./mvnw -q dependency:copy-dependencies \
	-Dzk.version="$ZK_VERSION" \
	-DincludeScope=runtime \
	-DoutputDirectory="$STAGE/WEB-INF/lib"
cp "$THEME_JAR" "$STAGE/WEB-INF/lib/"

# The whole theme is those generated *.css.dsp files, and a build that loses them
# still produces a WAR that starts up and looks merely "unstyled" - which is a very
# expensive thing to discover on the review server. So assert they are in the jar,
# and that they came from the packaged (minified, comment-free) CSS build rather
# than from a dev/watch build.
step "Checking the staged theme jar"
STAGED_JAR="$STAGE/WEB-INF/lib/$(basename "$THEME_JAR")"
DSP_COUNT=$(unzip -l "$STAGED_JAR" | grep -c '\.css\.dsp$' || true)
NORM_COMMENTS=$(unzip -p "$STAGED_JAR" web/marble/zul/css/norm.css.dsp | grep -c '/\*' || true)
printf '  %s *.css.dsp, norm.css.dsp comment blocks: %s\n' "$DSP_COUNT" "$NORM_COMMENTS"
[[ "$DSP_COUNT" -gt 50 ]] || { echo "theme CSS did not land in the jar - refusing to package" >&2; exit 1; }
[[ "$NORM_COMMENTS" -eq 0 ]] || { echo "theme CSS is an unminified dev build - refusing to package" >&2; exit 1; }

cat > "$STAGE/WEB-INF/web.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
		version="4.0">
	<display-name>Marble theme preview</display-name>

	<listener>
		<listener-class>org.zkoss.zk.ui.http.HttpSessionListener</listener-class>
	</listener>

	<!-- renders the ZUL pages staged at the war root -->
	<servlet>
		<servlet-name>zkLoader</servlet-name>
		<servlet-class>org.zkoss.zk.ui.http.DHtmlLayoutServlet</servlet-class>
		<init-param>
			<param-name>update-uri</param-name>
			<param-value>/zkau</param-value>
		</init-param>
		<load-on-startup>1</load-on-startup>
	</servlet>
	<servlet-mapping>
		<servlet-name>zkLoader</servlet-name>
		<url-pattern>*.zul</url-pattern>
	</servlet-mapping>

	<!-- AU channel + ~./ class web resources (theme CSS, images, media) -->
	<servlet>
		<servlet-name>auEngine</servlet-name>
		<servlet-class>org.zkoss.zk.au.http.DHtmlUpdateServlet</servlet-class>
	</servlet>
	<servlet-mapping>
		<servlet-name>auEngine</servlet-name>
		<url-pattern>/zkau/*</url-pattern>
	</servlet-mapping>

	<session-config>
		<session-timeout>60</session-timeout>
	</session-config>
	<welcome-file-list>
		<welcome-file>index.html</welcome-file>
	</welcome-file-list>
</web-app>
XML

cat > "$STAGE/WEB-INF/zk.xml" <<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<zk>
	<library-property>
		<name>org.zkoss.theme.preferred</name>
		<value>marble</value>
	</library-property>
</zk>
XML

# / -> the use-case browser, which is the sidebar that reaches every other page.
cat > "$STAGE/index.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Marble theme preview</title>
<meta http-equiv="refresh" content="0; url=usecase/index.zul">
<p><a href="usecase/index.zul">Open the Marble use-case browser</a></p>
HTML

step "Zipping $WAR"
rm -f "$WAR"
(cd "$STAGE" && zip -qr "$WAR" .)

printf '\n%s  (%s)\n' "$WAR" "$(du -h "$WAR" | cut -f1)"
printf '  %s jars, %s zul pages\n' \
	"$(find "$STAGE/WEB-INF/lib" -name '*.jar' | wc -l | tr -d ' ')" \
	"$(find "$STAGE" -maxdepth 2 -name '*.zul' -not -path '*/WEB-INF/*' | wc -l | tr -d ' ')"
