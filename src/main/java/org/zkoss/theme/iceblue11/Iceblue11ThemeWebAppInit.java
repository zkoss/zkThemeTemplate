/* Iceblue11ThemeWebAppInit.java

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
package org.zkoss.theme.iceblue11;

import org.zkoss.zk.ui.WebApp;
import org.zkoss.zk.ui.WebApps;
import org.zkoss.zk.ui.util.Configuration;
import org.zkoss.zk.ui.util.WebAppInit;
import org.zkoss.zkmax.theme.ResponsiveThemeRegistry;
import org.zkoss.zul.theme.Themes;

/**
 * Initial the theme relative setting, includes
 * Library property setting, Theme provider setting and Component definition setting 
 * 
 */
public class Iceblue11ThemeWebAppInit implements WebAppInit {

	private final static String THEME_NAME = "iceblue11";
	private final static String THEME_DISPLAY = "Iceblue 11";
	private final static int THEME_PRIORITY = 700;
	
	public void init(WebApp webapp) throws Exception {
		Themes.register(THEME_NAME, THEME_DISPLAY, THEME_PRIORITY);
		// Bug ZK-2963: register sapphire theme for tablet responsive theme
		String edition = WebApps.getEdition();
		if ("EE".equals(edition)) {
			Themes.register(ResponsiveThemeRegistry.TABLET_PREFIX + THEME_NAME, THEME_DISPLAY, THEME_PRIORITY);
		}

		// Iceblue11ThemeProvider puts the density into the WCS URL, so that changing
		// org.zkoss.zul.theme.density actually reaches a browser that already has the stylesheet.
		// Without it both densities share one URL carrying max-age=31536000 — see that class.
		//
		// Wired here rather than through <theme-provider-class> in metainfo/zk/zk.xml because of
		// ZK-1671: a provider declared in a jar's zk.xml can be silently replaced by
		// StandardThemeProvider depending on jar load order, and a silent revert here means the
		// cache key quietly loses the density again. setCustomThemeProvider(true) locks it.
		Configuration config = webapp.getConfiguration();
		config.setThemeProvider(new Iceblue11ThemeProvider());
		config.setCustomThemeProvider(true);
	}
}