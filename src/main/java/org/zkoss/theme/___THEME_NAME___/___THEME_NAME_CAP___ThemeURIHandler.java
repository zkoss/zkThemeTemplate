/* ___THEME_NAME_CAP___ThemeURIHandler.java

	Purpose:

	Description:

	History:
		Oct 30, 2026, Created by hawkchen

Copyright (C) 2026 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under LGPL Version 3.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.theme.___THEME_NAME___;

import java.util.List;

import org.zkoss.html.StyleSheet;
import org.zkoss.web.fn.ServletFns;
import org.zkoss.web.fn.ThemeFns;
import org.zkoss.zk.ui.Execution;
import org.zkoss.zk.ui.util.ThemeURIHandler;
import org.zkoss.zk.ui.util.ThemeURIModifier;

/**
 * Adds this theme's Font Awesome stylesheet when this theme is the current theme.
 * Since ZK 11.0, zk.wcs no longer lists Font Awesome, so the theme loads its own,
 * right before zk.wcs as it was when zk.wcs listed it first.
 */
public class ___THEME_NAME_CAP___ThemeURIHandler implements ThemeURIHandler {
	private static final String THEME_NAME = "___THEME_NAME___";
	private static final String FONT_AWESOME = "~./zul/font/font-awesome.css.dsp";
	private static final String WCS = "~./zul/css/zk.wcs";

	public void modifyThemeURIs(Execution exec, ThemeURIModifier modifier) {
		if (!THEME_NAME.equals(ThemeFns.getCurrentTheme()))
			return;
		modifier.add(indexOfWcs(modifier.getURIs()),
				new StyleSheet(ServletFns.resolveThemeURL(FONT_AWESOME), "text/css"));
	}

	/** Returns the index of zk.wcs, or 0 if it is not listed. */
	private static int indexOfWcs(List<StyleSheet> sheets) {
		for (int j = 0; j < sheets.size(); ++j) {
			final String href = sheets.get(j).getHref();
			if (href != null && href.startsWith(WCS))
				return j;
		}
		return 0;
	}
}
