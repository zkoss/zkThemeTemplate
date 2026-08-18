/* Iceblue11ThemeProvider.java

	Purpose:
		Put the density axis into the WCS cache key.

	Copyright (C) 2026 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under LGPL Version 3.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.theme.iceblue11;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.zkoss.html.StyleSheet;
import org.zkoss.lang.Library;
import org.zkoss.zk.ui.Execution;
import org.zkoss.zk.ui.util.ThemeProvider;

/**
 * Puts the density into the URL of both density-dependent stylesheets, so that changing
 * {@code org.zkoss.zul.theme.density} at runtime and reloading actually reaches the browser.
 *
 * <p>That is the spec this class exists to deliver (C28): <b>the property may be changed at
 * runtime, and a reload picks it up</b> — desktop bundle and zkmax tablet sheet alike. The property
 * remains the one and only knob, so C25 stands; what changed is that it no longer has to be set
 * before startup.
 *
 * <h3>The defect this fixes</h3>
 *
 * <p>{@code org.zkoss.zul.theme.density} decides, server-side, whether {@code norm.css.dsp} emits
 * the compact token block (D6/C25). That part works — the property is read per request and nothing
 * caches the rendered bytes. What did <em>not</em> work is the cache key: the WCS URL is
 * {@code /zkau/web/<stamp>/_zkiju-<theme>/zul/css/zk.wcs}, where {@code <stamp>} is computed once at
 * startup from version ⊕ build ⊕ edition ⊕ JS-module hashes and the injected segment carried the
 * theme name only. A library property is an input to neither, so both densities were served under
 * one URL — with {@code Cache-Control: public, max-age=31536000} on it.
 *
 * <p>Measured before this class existed: warm a browser cache on the bare URL, change the density,
 * navigate again — the browser paints the old density. Same URL, same browser, same instant, a
 * default-cache-mode fetch returned 539491 bytes with the compact block while a {@code no-store}
 * fetch returned 525096 bytes without it. That applies to <b>both</b> ways of setting the property:
 * at runtime via {@link Library#setProperty}, and the shipped way — edit {@code zk.xml}, restart —
 * because a restart does not change the stamp either.
 *
 * <p>The fix is the mechanism ZK documents for exactly this, in {@link ThemeProvider}'s own
 * javadoc: "inject a special fragment into the URI of the WCS file such that a different URI
 * represents a different theme". The theme name already rides there; density now rides with it, so
 * the fragment reads {@code iceblue11} or {@code iceblue11-compact}. Injection is transparent to
 * resource lookup — {@code WcsExtendlet.WcsLoader.getRealPath} strips the {@code _zkiju-…/} segment
 * before resolving the file — which is why nothing else has to change.
 *
 * <h3>Why this DELEGATES rather than extends</h3>
 *
 * <p>The obvious implementation, {@code extends org.zkoss.zul.theme.StandardThemeProvider},
 * is wrong, and wrong silently. ZK's provider is an <b>edition chain</b> —
 * {@code zkmax.theme.StandardThemeProvider} extends {@code zkex.theme.…} extends
 * {@code zul.theme.…} — and each link widens {@code beforeWidgetCSS} to rewrite one more widget
 * namespace at the theme. Only the zkmax link rewrites {@code ~./js/zkex/} and
 * {@code ~./js/zkmax/}.
 *
 * <p>Registering a subclass of the <em>zul</em> link therefore drops the theme's own zkex/zkmax
 * component CSS in favour of the jars' unthemed copies. Measured: the served bundle changed by
 * 10646 bytes and {@code .z-colorbox} came back carrying {@code -moz-}/{@code -o-} prefixes the
 * migration had removed. Nothing failed; the theme just quietly stopped being applied to those
 * components.
 *
 * <p>Capturing the configured provider at registration time does not work either: {@code WebAppInit}
 * runs <em>before</em> the jars' {@code zk.xml} are parsed, which is exactly how
 * {@code setCustomThemeProvider(true)} manages to suppress them (ZK-1671). At that moment there is
 * no zkmax provider to capture yet. So the delegate is resolved <b>lazily, on first use</b>, by
 * walking the same chain ZK would have, most capable first.
 *
 * <h3>Two sheets, two mechanisms — and why they differ</h3>
 *
 * <p>{@code zkmax/css/tablet.css.dsp} switches on the same property (D4/C23) but cannot use
 * {@code injectURI} at all, for two independent reasons: it is served by {@code DspExtendlet},
 * whose loader does not strip the {@code _zkiju-…/} segment (so an injected path 404s), and its
 * href has already been resolved to the theme by the time it reaches us, while {@code injectURI}
 * only rewrites a {@code ~./}-rooted URI. It gets a query string instead — see {@link #bust}.
 *
 * <p>So: the WCS bundle carries its density in an injected path segment, the tablet sheet in a
 * query string. Both are checked, three-state and with a negative control, by
 * {@code scripts/check-density-property.js} and {@code scripts/check-tablet-density.js}.
 *
 * <h3>What this does not change</h3>
 *
 * <p>The property is still the only knob. There is no {@code data-density} attribute and no
 * {@code IceblueDensity.apply()} — D6/C25 removed both deliberately, because a second desktop-only
 * knob is a path back to the split theme S36 names, and nothing here reopens it.
 */
public class Iceblue11ThemeProvider implements ThemeProvider {

	private static final Logger log = LoggerFactory.getLogger(Iceblue11ThemeProvider.class);

	/** The one density switch (D6/C25); also read server-side by the conditional in norm.css.dsp. */
	private static final String DENSITY_PROPERTY = "org.zkoss.zul.theme.density";

	/** The only value meaning compact. Any other value is default density — same as the `eq` test
	    in norm.css.dsp, so a typo in zk.xml cannot silently fork the cache key either. */
	private static final String COMPACT = "compact";

	private static final String WCS = "~./zul/css/zk.wcs";

	/** zkmax's touch layer (D4/C23), linked separately from the WCS bundle and switched on the
	    same property. Matched as a substring: by the time it reaches us the href has already been
	    resolved to the theme, so the leading `~./` and the theme segment are not fixed text. */
	private static final String TABLET = "zkmax/css/tablet.css.dsp";

	/** The tablet sheet's cache buster. A fixed token, not the property value — see {@link #bust}. */
	private static final String DENSITY_QUERY = "density=compact";

	/**
	 * ZK's provider chain, most capable first. Each entry rewrites one more widget namespace at
	 * the theme than the next, so the FIRST one that loads is the one ZK itself would have
	 * installed for this edition.
	 */
	private static final String[] DELEGATES = {
			"org.zkoss.zkmax.theme.StandardThemeProvider", // EE
			"org.zkoss.zkex.theme.StandardThemeProvider",  // PE
			"org.zkoss.zul.theme.StandardThemeProvider",   // CE
	};

	private volatile ThemeProvider _delegate;

	/**
	 * Resolved on first use, not in the constructor: this object is built from {@code WebAppInit},
	 * which runs before the jars' {@code zk.xml} are parsed, so asking the configuration then
	 * would see the chain half-built.
	 */
	private ThemeProvider delegate() {
		ThemeProvider d = _delegate;
		if (d == null) {
			synchronized (this) {
				if ((d = _delegate) == null)
					_delegate = d = resolveDelegate();
			}
		}
		return d;
	}

	private static ThemeProvider resolveDelegate() {
		for (String name : DELEGATES) {
			try {
				// Class.forName by this class's loader: the theme jar sits alongside the zk jars.
				final ThemeProvider p = (ThemeProvider) Class.forName(name)
						.getDeclaredConstructor().newInstance();
				if (log.isDebugEnabled())
					log.debug("density cache-key provider delegating to {}", name);
				return p;
			} catch (Throwable ignored) {
				// Not this edition — try the next link down the chain.
			}
		}
		// Unreachable in any working deployment: the zul link ships with the framework itself.
		throw new IllegalStateException("no ZK StandardThemeProvider on the classpath");
	}

	/**
	 * Lets the edition's provider build the list — including its own theme-name injection — then
	 * marks the two density-dependent stylesheets so each density has its own cache key.
	 *
	 * <p>When density is default this returns the delegate's output untouched, so URLs stay
	 * byte-identical to a deployment without this class. That matters: adding density must not
	 * invalidate every existing cache entry for apps that never use compact.
	 */
	public Collection<Object> getThemeURIs(Execution exec, List<Object> uris) {
		final Collection<Object> themed = delegate().getThemeURIs(exec, uris);
		if (themed == null || !COMPACT.equals(Library.getProperty(DENSITY_PROPERTY)))
			return themed;

		final List<Object> out = new ArrayList<Object>(themed.size());
		for (Object o : themed)
			out.add(markCompact(o));
		return out;
	}

	/**
	 * Returns the entry with a compact-specific URL, or the entry unchanged when it is not one of
	 * the two density-dependent sheets.
	 *
	 * <p>An entry reaches here as a plain href or as a {@link StyleSheet}: {@code HtmlPageRenders}
	 * keeps the object form only for entries that carry a {@code media} or are {@code disabled},
	 * and the tablet sheet is disabled (zkmax enables it from the client when {@code zk.mobile}).
	 * Both forms are handled for each sheet, so neither depends on that detail staying true.
	 */
	private static Object markCompact(Object entry) {
		if (entry instanceof String) {
			final String href = (String) entry;
			final String wcs = widen(href);
			if (wcs != null)
				return wcs;
			return isTablet(href) ? bust(href) : entry;
		}
		if (entry instanceof StyleSheet) {
			final StyleSheet ss = (StyleSheet) entry;
			final String href = ss.getHref();
			if (href == null)
				return entry; // an inline-content sheet; nothing to key on
			final String replaced = isTablet(href) ? bust(href) : widen(href);
			if (replaced != null)
				// The 5-arg constructor, not the 4-arg one: the latter passes null for media
				// instead of its own argument, so it would silently drop the media attribute.
				return new StyleSheet(replaced, ss.getType(), ss.getMedia(), false, ss.isDisabled());
		}
		return entry;
	}

	/**
	 * Appends the density to the WCS entry's injected fragment, or injects one if the delegate
	 * injected nothing.
	 *
	 * <p>Returns null when this entry is not the WCS file, so the caller can try the tablet test.
	 *
	 * <p>The "injected nothing" branch is not dead code: the delegate skips injection when the
	 * theme's name equals ZK's default ({@code StandardTheme.DEFAULT_NAME}, literally
	 * {@code "iceblue"}). Density still has to be injected there, or renaming this theme to
	 * {@code iceblue} would silently reintroduce the defect this class exists to fix.
	 */
	private static String widen(String uri) {
		final String[] decoded = Aide.decodeURI(uri); // [original uri, injected fragment]
		if (decoded != null)
			return WCS.equals(decoded[0]) ? Aide.injectURI(decoded[0], decoded[1] + '-' + COMPACT) : null;
		return uri.startsWith(WCS) ? Aide.injectURI(uri, COMPACT) : null;
	}

	private static boolean isTablet(String uri) {
		return uri.contains(TABLET);
	}

	/**
	 * The tablet sheet's cache buster: a query string, because {@link Aide#injectURI} cannot be
	 * used here.
	 *
	 * <p>Two independent reasons it cannot. The injected form resolves through
	 * {@code DspExtendlet}, whose loader — unlike {@code WcsExtendlet.WcsLoader} — does not strip
	 * the {@code _zkiju-…/} segment, so the path would not resolve and the sheet would 404. And
	 * {@code injectURI} only rewrites a {@code ~./}-rooted URI, while this href has already been
	 * resolved to the theme by the time it reaches us.
	 *
	 * <p>A query string is the smallest thing that changes the cache key without changing which
	 * file is served: the servlet path excludes it, so {@code DspExtendlet} resolves exactly the
	 * same resource and re-renders it against the current property — which is the whole point.
	 * The value is a fixed token rather than the raw property, so an unrecognised value shares the
	 * default sheet's cache entry instead of minting one of its own.
	 */
	private static String bust(String href) {
		return href + (href.indexOf('?') >= 0 ? '&' : '?') + DENSITY_QUERY;
	}

	// Everything else is the edition provider's business, unchanged.

	public int getWCSCacheControl(Execution exec, String uri) {
		return delegate().getWCSCacheControl(exec, uri);
	}

	public String beforeWCS(Execution exec, String uri) {
		return delegate().beforeWCS(exec, uri);
	}

	public String beforeWidgetCSS(Execution exec, String uri) {
		return delegate().beforeWidgetCSS(exec, uri);
	}
}
