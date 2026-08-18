package zk.example;

import org.zkoss.lang.Library;
import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.Desktop;
import org.zkoss.zk.ui.Page;
import org.zkoss.zk.ui.ShadowElement;
import org.zkoss.zk.ui.util.UiLifeCycle;
import org.zkoss.zul.Script;

/**
 * Injects the live-reload client script into every preview page, so that saving a stylesheet
 * updates the open browser tab.
 *
 * <p><b>Off unless asked for.</b> The script is added only when the library property
 * {@code org.zkoss.zul.theme.liveReload} is set. Nothing in the tree sets it, so the visual
 * A/B harness, the Playwright suites and the two density gates — all of which start this same
 * preview app — behave exactly as they did before this class existed. Turn it on for a
 * development session:
 *
 * <pre>
 *   npm run watch                                                    # terminal 1
 *   mvn test exec:java@preview-app -Dorg.zkoss.zul.theme.liveReload=true   # terminal 2
 * </pre>
 *
 * The value may be {@code true} (use the watcher's default port) or a port number, which has
 * to match the {@code --port} the watcher was given.
 *
 * <p><b>Why a UiLifeCycle and not a tag on each page.</b> There are 125 preview pages. A
 * {@code <script>} on each would be 125 edits plus a rule to remember on every new page — the
 * same reasoning that makes {@link PreviewStylesInit} a listener. {@code afterPageAttached}
 * fires once per page, before its content is evaluated.
 *
 * <p><b>Why this is test scope, and must stay there.</b> Same reason as
 * {@link PreviewStylesInit}: it is development scaffolding for the preview app, not part of
 * the theme anyone ships.
 */
public class LiveReloadInit implements UiLifeCycle {

	/** Set to {@code true} or to a port; unset (the default) disables injection entirely. */
	private static final String PROPERTY = "org.zkoss.zul.theme.liveReload";

	/** Must match DEFAULT_PORT in scripts/live-reload-server.js. */
	private static final String DEFAULT_PORT = "50001";

	public void afterPageAttached(Page page, Desktop desktop) {
		String value = Library.getProperty(PROPERTY);
		if (value == null || value.isEmpty() || "false".equalsIgnoreCase(value)) {
			return;
		}
		String port = "true".equalsIgnoreCase(value) ? DEFAULT_PORT : value.trim();
		Script script = new Script();
		script.setSrc("http://localhost:" + port + "/zk-live-reload.js");
		script.setDefer(true);
		script.setPage(page);
	}

	public void afterPageDetached(Page page, Desktop prevdesktop) {
	}

	public void afterComponentAttached(Component comp, Page page) {
	}

	public void afterComponentDetached(Component comp, Page prevpage) {
	}

	public void afterComponentMoved(Component parent, Component child, Component prevparent) {
	}

	public void afterShadowAttached(ShadowElement shadow, Component host) {
	}

	public void afterShadowDetached(ShadowElement shadow, Component prevhost) {
	}
}
