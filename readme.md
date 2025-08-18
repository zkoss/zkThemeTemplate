# ZK Theme Template
[ZK](https://github.com/zkoss/zk) is a highly productive open source Java framework for building amazing enterprise web and mobile applications. The **ZK Theme Template** provides a base theme that developers can extend to create custom ZK themes. It comes with continuous/incremental compile and live-reload features to minimize the turn-around time when developing a theme. 

If you just want to adjust the look of specific components rather than all of them, please read [ZK Style Customization Guide](https://www.zkoss.org/wiki/ZK_Style_Customization_Guide).

We assume you're already familiar with [Less](http://lesscss.org/).

# Build Steps
## Building prerequisites

[Require Node.js](https://nodejs.org/en/download/) \>= 10.16

Check version with `node -v`

## Fork
fork this repository to another git repository, so this will make it easier to merge bug fixes from the original repository and migrate to the new version in the future.

## Initialize a custom theme
* initialize the project with a theme name. 

`./init.sh`

* install [zkless-engine](https://github.com/zkoss/zkless-engine).
The LESS processor customized for ZK.

`npm install`
  

## build jar file
`mvn clean package`

It will compile `.less` files and package the source into jar. The jar file will be at `target/___THEME_NAME___.jar`

# How to Customize a Theme
This project contains the default theme (`iceblue`) .less files. 
The suggested steps:
1. Switch to a theme as a base theme
2. Add a new `.less` file to override the existing variables.

## switch to compact profile (since 9.5.0)
1. Open [`src/archive/web/zul/less/_zkvariables.less`](src/archive/web/zul/less/_zkvariables.less)
2. Modify `@themeProfile` to `compact`.
``` less
@themeProfile:                 "compact";
@themePalette:                 "iceblue";
```
3. now the theme uses the compact profile.

## Switch to a theme of [Theme Pack](https://www.zkoss.org/zkthemepackdemo/)
The [theme pack](https://www.zkoss.org/zkthemepackdemo/) contains extra 23 themes, you can choose one theme that is closer to your target theme as a base theme and start to customize it. So that it can save some efforts for you.
(**Notice**: you need to purchase ZK EE or theme pack to access the theme pack source code.)

1. Download Theme Pack source jar at [the premium repository](https://maven.zkoss.org/repo/zk/ee/org/zkoss/themepack/): [THEME_NAME]-[VERSION]-sources.jar
2. Get theme color palette less at `source.jar/palettes/*.less`
2. Copy the theme less to `zkThemeTemplate/src/archive/web/zul/less/colors`. <br/>
For example, `montana.less`
3. prepend `_` at the file name <br/>
For example, `_montana.less`
4. Specify the theme name at `src/archive/web/zul/less/_zkvariables.less`
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


## continuous compile/watch less files
in a separate console:

`npm run zklessc-dev`


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

Please refer to [ZK Developer's Reference/Theming and Styling/Switching Themes](https://www.zkoss.org/wiki/ZK_Developer%27s_Reference/Theming_and_Styling/Switching_Themes).

# Use cases
## Change primary color
`src/archive/web/zul/less/_zkvariables.less` > `@colorPrimary`

## Change base font
`src/archive/web/zul/less/_zkvariables.less` > `@baseFontSize`, `@baseTitleFontFamily`, `@baseContentFontFamily`

## Change margin and padding
Different components have different margin and padding, search "margin" and "padding" among all `.less` files.


# Customize Previous Themes

## breeze
check out the branch `breeze` of this repository

## atlantic 
visit https://github.com/zkoss/atlantic and follow the readme.

## silvertail, sapphire
visit https://github.com/zkoss/zkthemes and follow the readme.
