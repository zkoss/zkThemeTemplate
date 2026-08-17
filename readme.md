# ZK Theme Template
[ZK](https://github.com/zkoss/zk) is a highly productive open source Java framework for building amazing enterprise web and mobile applications. The **ZK Theme Template** provides a base theme that developers can extend to create custom ZK themes. It comes with continuous/incremental compile and live-reload features to minimize the turn-around time when developing a theme. 

If you just want to adjust the look of specific components rather than all of them, please read [ZK Style Customization Guide](https://www.zkoss.org/wiki/ZK_Style_Customization_Guide).

We assume you're already familiar with [Less](http://lesscss.org/).

Please note that with the introduction of [CSS Variables](https://docs.zkoss.org/zk_style_customization_guide/css_variables), you may not need to create a custom theme for simple customizations. If still adopting this approach of creating a theme jar, you need to be aware that CSS variables will not take effect if you override the corresponding LESS variables.
For example, overriding @colorPrimary will cause the CSS variable --zk-color-primary to be overridden as well.
The same applies when specifying @themePalette, as it overrides the theme-related variables defined in the theme file.

# Build Steps
## Building prerequisites

[Require Node.js](https://nodejs.org/en/download/) \>= 10.16

Check version with `node -v`

## Fork
fork this repository to another git repository, so this will make it easier to merge bug fixes from the original repository and migrate to the new version in the future.

## Initialize a custom theme
* initialize the project with a theme name. 

`./init.sh`

* install the build dependencies. This pulls in
[zkless-engine](https://github.com/zkoss/zkless-engine) — the LESS build runner for ZK themes —
along with the LESS compiler itself. Nothing needs to be installed by hand.

`npm install`
  

## build jar file
`mvn clean package`

It will compile `.less` files and package the source into jar. The jar file will be at `target/iceblue11-${project.version}.jar` (the unversioned `iceblue11.jar` name only exists inside the `bin` zip)

# How to Customize a Theme
This project contains the default theme (`iceblue`) .less files. 
The suggested steps:
1. Switch to a theme as a base theme
2. Add a new `.less` file to override the existing variables.

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

**Density is not switchable at runtime in this version.** There is no Java API for it, by design:
the previous version had no runtime switch either — it required editing a variable and rebuilding
— so this is the same capability delivered by one property instead of a second shipped jar.
Dynamic switching may be reconsidered later; see `tasks/l4-density-mechanism.md`.

Upgrading from `@themeProfile` or from the `iceblue_c` jar: [migration/density.md](doc/migration/density.md).

## Switch to a theme of [Theme Pack](https://www.zkoss.org/zkthemepackdemo/)
The [theme pack](https://www.zkoss.org/zkthemepackdemo/) contains extra 23 themes, you can choose one theme that is closer to your target theme as a base theme and start to customize it. So that it can save some efforts for you.
(**Notice**: you need to purchase ZK EE or theme pack to access the theme pack source code.)

1. Download Theme Pack source jar at [the premium repository](https://maven.zkoss.org/repo/zk/ee/org/zkoss/themepack/): [THEME_NAME]-[VERSION]-sources.jar
2. Get theme color palette less at `source.jar/palettes/*.less`
2. Copy the theme less to `zkThemeTemplate/src/main/resources/web/zul/less/colors`. <br/>
For example, `montana.less`
3. prepend `_` at the file name <br/>
For example, `_montana.less`
4. Specify the theme name at `src/main/resources/web/zul/less/_zkvariables.less`
```less
@themePalette:                 "montana";
```

## Add New .less
We suggest you customize a theme by overriding existing variables instead of modifying the variable value directly. So that you can easily merge the future changes from the original repository and easily differentiate the customized style and default styles. The steps are:
1. create a new `.less` file and add those variables you want to override.
2. import the new `.less` file in `_header.less` at the bottom to override the previous one like:
```less
@import "_zkvariables.less"; // variables needed for ZK
@import "_zkmixins.less";

@import "_mytheme.less" // your new theme variables
```


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

To review compact density, restart the preview app with the property set — the same switch a real
application uses, so what you review is what ships:

`mvn -Dorg.zkoss.zul.theme.density=compact test exec:java@preview-app`

There is no in-page density toggle, because there is no runtime switch to expose.


## continuous compile/watch less files
in a separate console:

`npm run zklessc-dev`


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
## Change primary color
`src/main/resources/web/zul/less/_zkvariables.less` > `@colorPrimary`

## Change base font
`src/main/resources/web/zul/less/_zkvariables.less` > `@baseFontSize`, `@baseTitleFontFamily`, `@baseContentFontFamily`

## Change margin and padding
Different components have different margin and padding, search "margin" and "padding" among all `.less` files.


# Customize Previous Themes

## breeze
check out the branch `breeze` of this repository

## atlantic 
visit https://github.com/zkoss/atlantic and follow the readme.

## silvertail, sapphire
visit https://github.com/zkoss/zkthemes and follow the readme.
