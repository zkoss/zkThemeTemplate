/* MarbleThemeWebAppInit.java

	Purpose:

	Description:

	History:
		Jun 29, 2010 11:56:16 AM , Created by Sam

Copyright (C) 2010 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under LGPL Version 3.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.theme.marble;

import org.zkoss.zk.ui.WebApp;
import org.zkoss.zk.ui.WebApps;
import org.zkoss.zk.ui.util.Configuration;
import org.zkoss.zk.ui.util.WebAppInit;
import org.zkoss.web.theme.StandardTheme.ThemeOrigin;
import org.zkoss.zkmax.theme.ResponsiveThemeRegistry;
import org.zkoss.zul.theme.Themes;

/**
 * Initial the theme relative settings, includes
 * Library property setting, Theme provider setting and Component definition setting
 *
 */
public class MarbleThemeWebAppInit implements WebAppInit {

	private final static String THEME_NAME = "marble";
	private final static String THEME_DISPLAY = "Marble";
	private final static int THEME_PRIORITY = 500;

	public void init(WebApp webapp) throws Exception {
		// ThemeOrigin.JAR is StandardTheme's default; state it explicitly so it is
		// self-documenting that Marble ships its CSS resources inside the theme jar
		// (not a FOLDER deployment).
		Themes.register(THEME_NAME, THEME_DISPLAY, THEME_PRIORITY, ThemeOrigin.JAR);
		// Bug ZK-2963: register theme for tablet responsive theme
		String edition = WebApps.getEdition();
		if ("EE".equals(edition)) {
			Themes.register(ResponsiveThemeRegistry.TABLET_PREFIX + THEME_NAME, THEME_DISPLAY, THEME_PRIORITY, ThemeOrigin.JAR);
		}

		// ZK-1671: <theme-provider-class> in our metainfo/zk/zk.xml is loaded
		// from a jar and can be silently overridden by StandardThemeProvider
		// depending on jar load order. WcsExtendlet then runs without our
		// beforeWidgetCSS, so ~./zul/font/font-awesome.css.dsp is included
		// verbatim and the FA banner ships in zk.wcs.
		// Wire the provider explicitly here and lock it with
		// setCustomThemeProvider(true) so no later init can replace it.
		Configuration config = webapp.getConfiguration();
		config.setThemeProvider(new MarbleThemeProvider());
		config.setCustomThemeProvider(true);
	}
}
