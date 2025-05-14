#!/bin/bash

echo ""
echo "This script will assist you in setting up your custom ZK theme maven project."
echo ""

themeSrcPath=src/org/zkoss/theme
themeTemplatePath=$themeSrcPath/___THEME_NAME___
webAppInitFile=$themeTemplatePath/___THEME_NAME_CAP___ThemeWebAppInit.java

templateFiles="pom.xml \
readme.md \
package.json \
preview/zk/example/ThemePreviewApp.java \
${themeTemplatePath}/Version.java \
${webAppInitFile} \
src/main/resources/metainfo/zk/config.xml \
src/main/resources/metainfo/zk/lang-addon.xml"

# 1. gather information

while true; do
	while true; do
		read -p "Enter the [GROUP ID] for your theme project and press [ENTER]: " groupId
		case $groupId in
			"" ) echo "[GROUP ID] cannot be empty, try again.";;
			* ) break;;
		esac
	done

	while true; do
		read -p "Enter the [ARTIFACT ID] (will also be your theme name) for your theme project and press [ENTER]: " artifactId
		case $artifactId in
			"" ) echo "[ARTIFACT ID] cannot be empty, try again.";;
			# need to check with regex, because this string will be used in folder path
			*[[:space:]]* ) echo "[ARTIFACT ID] cannot contain whitespace(s), try again.";;
			* ) break;;
		esac
	done
	
	while true; do
		read -p "Enter the [VERSION] for your theme project and press [ENTER]: " version
		case $version in
			"" ) echo "[VERSION] cannot be empty, try again.";;
			* ) break;;
		esac
	done

	while true; do
		read -p "Enter the [DISPLAY NAME] for your theme and press [ENTER]: " displayName
		case $displayName in
			"" ) echo "[DISPLAY NAME] cannot be empty, try again.";;
			* ) break;;
		esac
	done

	echo ""
	echo "GROUP ID     : $groupId"
	echo "ARTIFACT ID  : $artifactId"
	echo "VERSION      : $version"
	echo "DISPLAY NAME : $displayName"
	echo ""

	read -p "Is the above information correct? [Y/n] " confirm
	case $confirm in
		"") break;;
		[Yy]*) break;;
		*) echo "Let's start again then."; echo "";;
	esac
done

set -e

themeName=$artifactId
themeNameCap=$(echo $themeName | sed 's/.*/\u&/g')

# 2. check all expected files exist
echo Checking files
for file in $templateFiles; do
    if [ ! -e $file ]; then
	    echo "[$file] not found, unable to proceed, abort."
	    exit 2
    fi
    echo Found: $file
done

echo All files found, start updating
for file in $templateFiles; do
    echo Updating: $file
    sed -i.zktmp "s/___GROUP_ID___/${groupId}/g" ${file}
    sed -i.zktmp "s/___ARTIFACT_ID___/${artifactId}/g" ${file}
    sed -i.zktmp "s/___VERSION___/${version}/g" ${file}
    sed -i.zktmp "s/___DISPLAY_NAME___/${displayName}/g" ${file}
    sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" ${file}
    sed -i.zktmp "s/___THEME_NAME_CAP___/${themeNameCap}/g" ${file}
done

echo "Removing tmp files..."
find . -name "*.zktmp" | xargs rm -f

echo Move files/folders 
echo "  from: ${themeTemplatePath}"
echo "    to: $themeSrcPath/$themeName"

mv ${webAppInitFile} ${themeTemplatePath}/${themeNameCap}ThemeWebAppInit.java
mv $themeTemplatePath/ $themeSrcPath/$themeName

echo "All done."
exit 0
