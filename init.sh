#!/bin/bash

echo ""
echo "This script will assist you in setting up your custom ZK theme maven project."
echo ""

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
	
	themeName=$artifactId
	themeNameCap=$(echo $themeName | cut -c 1 | tr [a-z] [A-Z])$(echo $themeName | cut -c 2-)

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


# 2. done gathering information, update the files now

# need to update
# 1. pom.xml
# 2. folder path
# 3. Version.java
# 4. webAppInit.java
# 5. config.xml
# 6. lang-addon.xml

set -e

# first, check if files to be modified are present

if [ ! -e pom.xml ]; then
	echo "[pom.xml] not found, unable to proceed, abort."
	exit 2
fi
fileCount=$(find . -name "Version.java" | wc -l)
if [ ! $fileCount -eq "1" ]; then
	echo "more than one [Version.java], or file not found, unable to proceed, abort."
	exit 2
fi
versionFilePath=$(find . -name "Version.java") # we now have the path to the file
oldThemePath=${versionFilePath%/Version.java} # trim the file name
oldThemeName=$(echo ${oldThemePath} | rev | cut -d / -f 1 | rev) # substring the theme name
themeWebAppInitFileCount=$(find ${oldThemePath} -name "*ThemeWebAppInit.java" | wc -l)
if [ ! $themeWebAppInitFileCount -eq "1" ]; then
	echo "more than one [ThemeWebAppInit.java], or file not found, unable to proceed, abort."
	exit 2
fi
themeWebAppInitFilePath=$(find ${oldThemePath} -name "*ThemeWebAppInit.java")
if [ ! -e src/archive/metainfo/zk/config.xml ]; then
	echo "[config.xml] not found, unable to proceed, abort."
	exit 2
fi
if [ ! -e src/archive/metainfo/zk/lang-addon.xml ]; then
	echo "[lang-addon.xml] not found, unable to proceed, abort."
	exit 2
fi

# all files found, start updating

echo "updating pom.xml..."
sed -i.zktmp "s/___GROUP_ID___/${groupId}/g" pom.xml
sed -i.zktmp "s/___ARTIFACT_ID___/${artifactId}/g" pom.xml
sed -i.zktmp "s/___VERSION___/${version}/g" pom.xml
sed -i.zktmp "s/___DISPLAY_NAME___/${displayName}/g" pom.xml

echo "updating Version.java..."
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" ${versionFilePath}
sed -i.zktmp "s/___VERSION___/${version}/g" ${versionFilePath}

echo "updating ThemeWebAppInit.java..."
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" ${themeWebAppInitFilePath}
sed -i.zktmp "s/___THEME_NAME_CAP___/${themeNameCap}/g" ${themeWebAppInitFilePath}
sed -i.zktmp "s/___DISPLAY_NAME___/${displayName}/g" ${themeWebAppInitFilePath}
mv ${themeWebAppInitFilePath} ${oldThemePath}/${themeNameCap}ThemeWebAppInit.java

echo "updating theme path..."
mv ${oldThemePath} ${oldThemePath/${oldThemeName}/${themeName}}

echo "updating config.xml..."
configXmlFile=src/archive/metainfo/zk/config.xml
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" ${configXmlFile}
sed -i.zktmp "s/___THEME_NAME_CAP___/${themeNameCap}/g" ${configXmlFile}
sed -i.zktmp "s/___VERSION___/${version}/g" ${configXmlFile}

echo "updating lang-addon.xml..."
langAddonFile=src/archive/metainfo/zk/lang-addon.xml
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" ${langAddonFile}
sed -i.zktmp "s/___VERSION___/${version}/g" ${langAddonFile}

echo "updating readme.txt..."
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" readme.txt

echo "updating package.json..."
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" package.json

echo "updating ThemePreviewApp.java..."
sed -i.zktmp "s/___THEME_NAME___/${themeName}/g" preview/zk/example/ThemePreviewApp.java

echo "removing zktmp files..."
find . -name "*.zktmp" | xargs rm -f

echo "All done."
exit 0

if [ "$OS" = "Windows_NT" ]; then # to avoid tons of if/else with uname -s in Windows
	OS_detected="Windows"
else
	OS_detected=$(uname -s 2>/dev/null || echo not)
fi

case "$OS_detected" in
	Darwin)
		echo 'mac'
	;;
	
	Linux)
		echo 'linux'
	;;

	Windows)
		echo 'windows'
	;;

	*)
		echo 'other OS'
	;;
esac
