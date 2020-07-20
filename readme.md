The ZK Theme Template serves as a base theme, allowing developers to make changes and create custom ZK themes. It comes with continuous/incremental compile and live-reload features to minimize the turn-around time when developing a theme.

# Build Steps
## Building prerequisites
Require Node.js \>= 10.16

## clone
clone the zkThemeTemplate project

## initially
```
./init.sh
npm install
```

## build jar file
`mvn clean package`

The jar file will be `target/___THEME_NAME___.jar`

# Development

## switch to compact profile (since 9.5.0)
1. Open `src/archive/web/zul/less/_zkvariables.less`
2. Modify `@themeProfile` to "compact".

``` less
@themeProfile:                 "compact";
@themePalette:                 "iceblue";
```

3. now the theme uses the compact profile.

## switch to a theme of [Theme Pack](https://www.zkoss.org/zkthemepackdemo/)
The theme pack contains extra 23 themes, you can choose one theme that is closer to your target theme as a base theme and start to customize it. So that it can save some efforts for you.
(**Notice**: you need to purchase ZK EE or theme pack to access the theme pack source code.)

1. Download Theme Pack source jar. <br/>
check theme color palette at `/projects/*.less`
2. Copy one theme less to `zkThemeTemplate/src/archive/web/zul/less/colors`. <br/>
For example, `montana.less`
3. prepend `_` at the file name <br/>
For example, `_montana.less`
4. Specify the theme name at `src/archive/web/zul/less/_zkvariables.less`
```less
@themePalette:                 "montana";
```

## compile run preview app
`mvn test exec:java@preview-app`

## preview
open a simple preview page in the browser, add your own pages containing the components to preview http://localhost:8080

## continuous compile/watch less files
in a separate console:

`npm run zklessc-dev`

## wrap up
update less-files with text editor, save file -\> auto zkless compile -\> browser will reload style sheet zk.wcs

# How to use `___THEME_NAME___.jar`:

1. Put `___THEME_NAME___.jar` in `WEB-INF/lib`, then `___THEME_NAME___.jar`
    will become your default theme if there is no other theme.

2. Now you can also dynamically switch between different themes by
    cookie or library property
  -  Use library-property
     ```
        <!-- in WEB-INF/zk.xml -->
        <library-property> 
            <name>org.zkoss.theme.preferred</name>
            <value>___THEME_NAME___</value>
        </library-property> 
     ```


  - Use cookie to switch theme, add a cookie
    ```
    zktheme=___THEME_NAME___
    ```
It does not require a server restart, but user has to refresh the browser.
