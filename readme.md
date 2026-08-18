# ZK Theme Template
[ZK](https://github.com/zkoss/zk) is a highly productive open source Java framework for building amazing enterprise web and mobile applications. The **ZK Theme Template** provides a base theme that developers can extend to create custom ZK themes.

If you just want to adjust the look of specific components rather than all of them, please read [ZK Style Customization Guide](https://www.zkoss.org/wiki/ZK_Style_Customization_Guide).

**The sources are plain CSS. There is no Less.** Every value a theme exposes is a
[CSS custom property](https://docs.zkoss.org/zk_style_customization_guide/css_variables) —
this theme declares 862 of them — so customizing is overriding a property, and there is exactly
one way to do it. Upgrading from a version that used Less variables:
[migration/less-to-css.md](doc/migration/less-to-css.md).

Note that with CSS custom properties you may not need a custom theme jar at all for simple
customizations: load your own stylesheet after the theme and override the properties there.

# Build Steps
## Building prerequisites

[Require Node.js](https://nodejs.org/en/download/) \>= 10.16

Check version with `node -v`

## Fork
fork this repository to another git repository, so this will make it easier to merge bug fixes from the original repository and migrate to the new version in the future.

## Initialize a custom theme
* initialize the project with a theme name. 

`./init.sh`

* install the build dependencies. Nothing needs to be installed by hand.

`npm install`

### changing the version afterwards

`init.sh` asks for a version and writes it into the four places that declare one. It does that
**once**, when you initialize the project. To change it later:

`npm run set:version -- 11.0.1-Eval`

That rewrites all four at once — `pom.xml`, `metainfo/zk/config.xml`, `metainfo/zk/lang-addon.xml`
and `Version.java` — and re-reads them afterwards to confirm they agree. The four are not copies of
one value; each has its own job, which is why they are separate declarations and why they still have
to say the same thing:

| Where | What it is for |
|---|---|
| `pom.xml` `<version>` | names the jar, the `bin` zip and the OSGi `Bundle-Version` |
| `config.xml` `<version-uid>` | ZK compares it with `Version.UID` while loading |
| `lang-addon.xml` `<version-uid>` | same comparison, for the language addon |
| `Version.java` `UID` | the value both XML files are compared against |

**Editing one by hand is the mistake to avoid**, because ZK's own reaction to a mismatch is quiet:
it skips the whole file and logs one `INFO` line. A `config.xml` that disagrees with `Version.java`
therefore drops the listener that registers the theme — the application keeps serving pages with
HTTP 200 and no error, just without your theme applied. `npm run check:version` asserts the four
agree, and it is part of `npm run check:gate`.

## build jar file
`mvn clean package`

It compiles every `.css` source into the `*.css.dsp` stylesheets ZK serves (`scripts/build-css.js`,
bound to `process-resources`) and packages them into the jar. The jar file will be at
`target/iceblue11-${project.version}.jar` (the unversioned `iceblue11.jar` name only exists inside
the `bin` zip). Raw `.css` sources are deliberately excluded from the jar — only the compiled
`.css.dsp` ships.

To compile the stylesheets without Maven: `npm run build:css`.

# How to Customize a Theme
This project contains the default theme (`iceblue11`) as plain `.css` files.
The suggested steps:
1. Switch to a theme as a base theme
2. Override the custom properties you want to change (see [Override custom properties](#override-custom-properties)).

## switch to compact density (since 9.5.0)

Set **one library property** in `zk.xml`. That is the whole mechanism, and it covers the desktop
stylesheet and `zkmax`'s tablet stylesheet alike:

``` xml
<library-property>
    <name>org.zkoss.zul.theme.density</name>
    <value>compact</value>
</library-property>
```

Any other value, including leaving the property out, keeps the default density — a typo cannot
silently switch an app. The decision is made server-side while the stylesheet is rendered, so
compact costs no extra request and cannot flash the default density first. A default-density app
does not receive the compact rules at all.

**The property may also be changed while the app is running.** Set it with
`Library.setProperty("org.zkoss.zul.theme.density", "compact")` and reload the page — for example
with `Executions.sendRedirect(null)` — and the browser gets the other density. No restart, and no
second knob: it is the same property either way. Each density is served under its own stylesheet
URL, so a browser that already holds one is asked again rather than serving what it has.

Two things to know before building a feature on it. `Library` is JVM-global, so changing the
property changes the density for **every** session, not just the one that asked; and it is
in-memory, so a restart reverts to whatever `zk.xml` or `-D` says. Per-user density is a different
feature and would need a different mechanism.

**This replaces the build-time switch.** Earlier versions selected the profile by editing
`@themeProfile` and rebuilding the jar, and shipped a second artifact (`iceblue_c`) for it. Both
are gone: the property does the same job without a rebuild, and there is one jar. If you are
migrating from `org.zkoss.theme.preferred=iceblue_c`, use `iceblue11` plus the property above.

> **Do not switch density by editing the sources.** Pointing `zul/css/norm.css`'s first `@import`
> at `tokens/_compact.css` still "works" for the desktop stylesheet, but the tablet stylesheet
> does not read it — the result is a compact desktop with a default-density touch layer on mobile,
> which is the exact split the property exists to prevent. `tokens/_compact.css` is now an input to
> `scripts/gen-density-css.js`, not a switch; if you fork and edit it, re-run
> `npm run gen:density-css` or `npm run check:gate` will fail.

**There is no Java API for density, and that is deliberate** — no `IceblueDensity.apply(...)`, no
`data-density` attribute. One knob, used the same way whether you set it at startup or while the
app runs. A second, desktop-only knob is exactly how you end up with a compact desktop and a
default-density touch layer, which is what the box above warns about.

Upgrading from `@themeProfile` or from the `iceblue_c` jar: [migration/density.md](doc/migration/density.md).

## Switch to a theme of [Theme Pack](https://www.zkoss.org/zkthemepackdemo/)
The [theme pack](https://www.zkoss.org/zkthemepackdemo/) contains extra 23 themes, you can choose one theme that is closer to your target theme as a base theme and start to customize it. So that it can save some efforts for you.
(**Notice**: you need to purchase ZK EE or theme pack to access the theme pack source code.)

**The `@themePalette` variable is gone.** A palette is a set of custom-property values, so a
palette is now just a stylesheet that overrides them — you load it after the theme instead of
compiling it into the jar. See
[migration/less-to-css.md § Palette](doc/migration/less-to-css.md#palette-themepalette-is-gone)
for what to do with a palette you already have.

## Override custom properties
Customize by overriding properties rather than editing the values in place — that way your
customization is a small file of its own, and merging future changes from the original repository
stays easy.

Two ways, and the first needs no build at all:

1. **No theme jar** — load your own stylesheet after the theme and override there:
```css
:root {
    --zk-color-primary: #6750a4;
    --zk-base-font-size: 15px;
}
```
2. **In this theme** — add a `.css` file next to the token files and `@import` it from
`src/main/resources/web/zul/css/norm.css`, after the existing imports so it wins:
```css
@import "tokens/_default.css";
@import "tokens/_iceblue.css";
@import "base/_reset.css";
@import "tokens/_mytheme.css";   /* your overrides */
```
Both take effect at runtime, and both compose: a later override never makes an earlier one
unreachable. (Overriding a *Less variable* used to erase the custom property from the compiled
output, which silently broke any downstream override — one of the reasons Less is gone. The full
list of behavioural differences is in
[migration/less-to-css.md](doc/migration/less-to-css.md).)


## preview custom theme
* compile run preview app
`mvn test exec:java@preview-app`
* open a simple preview page in a browser: http://localhost:8080
* add your own pages containing the components to preview under `/preview/web`

### component browser

http://localhost:8080/usecase/index.zul is a sidebar shell over the same pages, grouped by kind.

Every page is deep-linkable: append the page path minus `.zul`, e.g.
`…/usecase/index.zul#button` or `…/usecase/index.zul#utility/colors`. Browser back and forward
work, so a review comment can point at an exact page.

To review compact density, open **Overview → Density Switch** and flip the switch. It sets the same
property a real application sets and reloads the page, so what you review is what ships. The page
also prints the tokens it expects next to the ones the browser actually computed, which is how a
density regression announces itself.

Starting the app with the property set works too, and is what a customer's deployment looks like:

`mvn -Dorg.zkoss.zul.theme.density=compact test exec:java@preview-app`

The sidebar chrome itself has no toggle — density is a property, not a per-user preference, and a
control in the chrome would imply otherwise. See `doc/density-runtime-switch-verification.md`.


## recompile after editing a stylesheet
In a separate console:

`npm run build:css`

It rebuilds all 85 stylesheets in well under a second, and the preview app picks them up on the
next request without a restart (`ThemePreviewApp` sets `org.zkoss.zk.WCS.cache=false`), so a
hard-reload in the browser is enough.

## rebuild on save, and update the browser for you

`npm run watch`

Leave it running in its own console. It rebuilds the theme whenever a `.css` under
`src/main/resources/web` changes, and copies preview-page edits under `src/test/resources/web`
(`.zul`, `.css`, `.js`, images) into `target/test-classes` where the running app reads them.

To have the browser follow along, start the preview app with live reload enabled:

`mvn test exec:java@preview-app -Dorg.zkoss.zul.theme.liveReload=true`

Stylesheet changes are swapped in without a page reload, so whatever you had open — a dropdown,
a selected row, a scroll position — survives the edit. Everything else reloads the page.

Live reload is **off unless you ask for it**, because the visual A/B harness and the Playwright
suites start this same preview app and must not be talking to a development watcher. The watcher
listens on port 50001; if that clashes with something else, run `npm run watch -- --port 50002`
and start the app with `-Dorg.zkoss.zul.theme.liveReload=50002`.

Neither the watcher nor the reload channel adds a dependency — the watcher restates the file list
every 400ms, and the browser is notified over Server-Sent Events using Node's own `http` module.
The `npm run zklessc-dev` this replaces needed the whole Less toolchain to do the same job, and
watched `.less` files only, so it had gone blind as this theme's sources were converted to `.css`.


# How to use `iceblue11.jar`:

1. Put `iceblue11.jar` in `WEB-INF/lib`, then `iceblue11.jar`
    will become your default theme if there is no other theme.

2. Now you can also dynamically switch between different themes by
    cookie or library property
  -  Use library-property
     ```
        <!-- in WEB-INF/zk.xml -->
        <library-property> 
            <name>org.zkoss.theme.preferred</name>
            <value>iceblue11</value>
        </library-property> 
     ```


  - Use cookie to switch theme, add a cookie
    ```
    zktheme=iceblue11
    ```
It does not require a server restart, but user has to refresh the browser.

Please refer to [ZK Developer's Reference/Theming and Styling/Switching Themes](https://www.zkoss.org/wiki/ZK_Developer%27s_Reference/Theming_and_Styling/Switching_Themes).

# Use cases
Every value below is a custom property declared in
`src/main/resources/web/zul/css/tokens/_default.css`. Override it the way
[Override custom properties](#override-custom-properties) describes — don't edit it in place.

## Change primary color
`--zk-color-primary` (and `--zk-color-primary-dark` / `-light` / `-lighter` if you want the whole ramp)

## Change base font
`--zk-base-font-size`, `--zk-base-title-font-family`, `--zk-base-content-font-family`

## Change margin and padding
Different components have different margin and padding. Grep the token file for the component name
(e.g. `--zk-container-padding`, `--zk-mesh-body-padding`); if no token covers what you need, the
component's own rules are in `src/main/resources/web/js/**/css/*.css`.

## Look up the old Less variable name
Every `@variable` this theme used to expose, and the property that replaced it:
[migration/less-var-to-token.md](doc/migration/less-var-to-token.md).


# Customize Previous Themes

## breeze
check out the branch `breeze` of this repository

## atlantic 
visit https://github.com/zkoss/atlantic and follow the readme.

## silvertail, sapphire
visit https://github.com/zkoss/zkthemes and follow the readme.
