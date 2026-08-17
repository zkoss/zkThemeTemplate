/* IceblueDensity.java

	Purpose:
		Switch the theme's compact density at runtime, for the whole app or one region.
	Description:

	History:
		Aug 12, 2026, Created by Claude

Copyright (C) 2026 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under LGPL Version 3.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.theme.iceblue11;

import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.util.Clients;

/**
 * Switches the theme between its default and compact density without the caller having to know
 * the underlying DOM detail.
 *
 * <p>Density is a declarative knob: a {@code data-density} attribute that re-declares the 350
 * size tokens the compact profile changes. Because those are the tokens every component reads,
 * the attribute takes effect at <em>any</em> scope — the document root for the whole app, or one
 * component's subtree for a single region.
 *
 * <p>Before ZK 11 this was a separate theme jar ({@code iceblue_c}) selected by
 * {@code org.zkoss.theme.preferred}, so switching meant a cookie and a full page reload, and the
 * granularity was the whole site. Neither is true here.
 *
 * <h3>Compact nests; opting back out of it does not</h3>
 *
 * <p>Compact can be applied at any depth, and a compact region inside a compact app is simply
 * compact. What is <b>not supported</b> is the reverse: a region inside a compact ancestor cannot
 * be returned to the default density. The theme ships one rule block,
 * {@code [data-density="compact"]}; there is no {@code [data-density="default"]} block for an
 * inner scope to match, so such a region inherits the ancestor's compact values and the call is a
 * no-op. Shipping the second block was measured at +15 KB for every user and ruled against
 * (see {@code tasks/l4-density-mechanism.md} L3.1(g)).
 *
 * <p>So structure the page the other way round: leave the app at the default density and mark the
 * regions that should be dense, rather than making the app compact and carving exceptions out
 * of it.
 *
 * <h3>Use the library property for a fixed default</h3>
 *
 * <p>For an app that is <em>always</em> compact, set the library property in {@code zk.xml}
 * instead of calling this class:
 *
 * <pre>{@code
 * <library-property>
 *     <name>org.zkoss.zul.theme.density</name>
 *     <value>compact</value>
 * </library-property>
 * }</pre>
 *
 * <p>That decision is made server-side while the stylesheet is rendered, so it costs nothing and
 * cannot flash. {@link #apply(Density)} cannot match it: the document root is not a ZK component,
 * so it has to go through {@link Clients#evalJavaScript(String)}, which runs <em>after</em> the
 * first paint. Called on page load it produces a visible default&rarr;compact flash (FOUC). Use it
 * for a user flipping a preference, not for a fixed default.
 *
 * <h3>The tablet layer is library-property only — by specification</h3>
 *
 * <p><strong>Neither method on this class affects {@code zkmax}'s tablet stylesheet.</strong> That
 * is the specification, not a limitation waiting to be lifted: the touch layer's density is set by
 * the {@code org.zkoss.zul.theme.density} library property and by nothing else. On a mobile device,
 * set the property in {@code zk.xml}; calling {@link #apply(Density)} there would leave the desktop
 * tokens compact and the touch layer at its default sizes.
 *
 * <p>Why it works that way. The tablet sheet is a touch-compensation layer for the whole app,
 * injected only on a mobile user agent, and it is not token-driven: measured across the two
 * profiles, {@code var(--zk-} appears 95 times on each side, so overriding token values moves
 * nothing there. The sheet therefore ships BOTH densities and the server picks one while rendering
 * it — a decision made before first paint, which an attribute set afterwards cannot revisit.
 *
 * <p>This is not a capability the theme used to have. Before this version the tablet layer was
 * switched by editing a LESS variable and rebuilding the jar, so it had no runtime switch of any
 * kind, whole-app or otherwise. What changed is that the same result now costs one library
 * property instead of a second shipped artifact. The desktop half gaining a runtime switch is an
 * addition on that side, not a gap on this one.
 *
 * <p>{@link #apply(Component, Density)} could never have reached it in any design: region-scoped
 * density has no meaning for a whole-site compensation layer.
 *
 * @since 11.0.0
 */
public final class IceblueDensity {

	/** The attribute name, without the {@code data-} prefix ZK adds for components. */
	private static final String ATTRIBUTE = "density";

	private IceblueDensity() {
	}

	/**
	 * The density a scope is rendered at. The token is what lands in the DOM as
	 * {@code data-density}, and it is the same vocabulary as the theme's two profile files
	 * ({@code tokens/_default.css}, {@code tokens/_compact.css}) and the library property.
	 */
	public enum Density {
		/**
		 * The theme's default density — the {@code :root} token values.
		 *
		 * <p>Two things it does: turn compact off for the whole app, and take back a
		 * {@link #COMPACT} previously applied to the same region. It does <em>not</em> return a
		 * region to the default density underneath a compact ancestor — see the class javadoc.
		 */
		DEFAULT("default"),
		/** Compact density — the values ZK used to ship as the separate {@code iceblue_c} theme. */
		COMPACT("compact");

		private final String token;

		Density(String token) {
			this.token = token;
		}

		/** The {@code data-density} attribute value for this density. */
		public String token() {
			return token;
		}
	}

	/**
	 * Applies the density to the whole application, by setting {@code data-density} on the
	 * document root ({@code <html>}). Body-appended popups — menus, modal windows, notifications —
	 * are covered too, since they inherit from the root.
	 *
	 * <p>Must run within an active ZK execution (an event listener or an MVVM command) so the
	 * client update can be sent. See the class javadoc for why this is the wrong tool for a fixed
	 * default.
	 *
	 * @param density the density to apply; never {@code null}.
	 */
	public static void apply(Density density) {
		Clients.evalJavaScript(
				"document.documentElement.setAttribute('data-" + ATTRIBUTE + "','" + density.token() + "')");
	}

	/**
	 * Applies the density to a single component subtree, by setting {@code data-density} on that
	 * component's DOM element. Use it to make one region — a data-dense grid, a sidebar — compact
	 * while the rest of the app stays at the default density.
	 *
	 * <p>Uses ZK's native {@link Component#setClientDataAttribute(String, String)}, so no
	 * JavaScript string is involved and the subtree re-renders when the value changes.
	 *
	 * <p>Passing {@link Density#DEFAULT} takes back a {@link Density#COMPACT} applied earlier to
	 * this same component. It does <b>not</b> carve a default-density region out of a compact
	 * ancestor — that is unsupported and silently does nothing (see the class javadoc). No
	 * exception is thrown, because whether an ancestor is compact is client-side state this method
	 * cannot see, and the take-back case is a legitimate call.
	 *
	 * @param scope   the component whose subtree should adopt the density.
	 * @param density the density to apply; never {@code null}.
	 */
	public static void apply(Component scope, Density density) {
		scope.setClientDataAttribute(ATTRIBUTE, density.token());
	}
}
