package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.lang.Library;
import org.zkoss.zk.ui.Executions;

/**
 * View model for {@code density-probe.zul} — the in-app demonstration of the runtime density
 * switch, and the page a reviewer uses to compare densities side by side.
 *
 * <p><b>What it exercises.</b> Changing {@code org.zkoss.zul.theme.density} at runtime and
 * reloading is supported (C28). Three things have to hold for that, and this page depends on all
 * three, so a regression in any of them shows up here: {@link Library} is a live static map;
 * {@code c:property()} in a DSP resolves straight to {@link Library#getProperty(String)} and both
 * extendlets in front of it cache the *parsed* form rather than the rendered bytes; and
 * {@code Iceblue11ThemeProvider} gives each density its own stylesheet URL, so a browser holding
 * the other density is asked again instead of serving what it has.
 *
 * <p>That last one is the part that used to be missing, and it failed silently: both densities
 * shared one URL carrying {@code max-age=31536000}, so a warm cache kept painting the old density
 * through both a navigation and a reload. See {@code doc/density-runtime-switch-verification.md}.
 *
 * <p><b>This page is a demonstration, not the API.</b> An application sets the property — in
 * {@code zk.xml}, from {@code -D}, or with {@link Library#setProperty} — and reloads. It does not
 * need a view model; the switch here is just a convenient way to drive it. Two consequences of
 * {@code Library} being JVM-global and in-memory are worth knowing before wiring anything like this
 * into a real app: the toggle changes density for <em>every</em> session, not just the one that
 * clicked it, and a restart reverts to whatever {@code -D} or {@code zk.xml} says. Per-user density
 * is a different feature and would need a different mechanism.
 */
public class DensityProbeVM {

    /** The one density switch (D6/C25), read server-side by the conditional in norm.css.dsp. */
    static final String DENSITY_PROPERTY = "org.zkoss.zul.theme.density";

    private static final String COMPACT = "compact";

    /**
     * The "off" value. Deliberately not {@code null}: {@code Library.setProperty(key, null)}
     * stores a null and {@code getProperty} then falls through to {@link System#getProperty},
     * so an app launched with {@code -Dorg.zkoss.zul.theme.density=compact} could not be switched
     * back off. Any value other than {@code compact} means default density — the same three-state
     * behaviour {@code scripts/check-density-property.js} asserts with its {@code foo} case.
     */
    private static final String DEFAULT = "default";

    public boolean isCompact() {
        return COMPACT.equals(Library.getProperty(DENSITY_PROPERTY));
    }

    /** The raw property value, for the evidence panel. */
    public String getDensityProperty() {
        String value = Library.getProperty(DENSITY_PROPERTY);
        return value == null ? "(unset)" : value;
    }

    public String getModeLabel() {
        return isCompact() ? "compact" : "default";
    }

    // Expected token values, so the page can put server-side expectation next to client-side
    // measurement. Values come from tokens/_default.css and tokens/_density-compact.css; if a
    // regenerated density sheet changes them, these go stale and the page will say so by
    // disagreeing with the browser — which is the intended failure mode for a probe.

    public String getExpectedBaseFontSize() {
        return isCompact() ? "12px" : "16px";
    }

    public String getExpectedInputHeight() {
        return isCompact() ? "24px" : "34px";
    }

    public String getExpectedMeshBodyPadding() {
        return isCompact() ? "4px 5px" : "12px 16px";
    }

    public String getExpectedCheckboxSwitchHeight() {
        return isCompact() ? "14px" : "29px";
    }

    /**
     * Flips the property and reloads the page.
     *
     * <p>{@code sendRedirect(null)} reaches the client as {@code zUtl.go("")}, which falls through
     * to {@code location.reload()} — so the URL fragment survives and this page still works when
     * it is reached through the {@code usecase/index.zul} shell rather than standalone.
     */
    @Command
    public void setCompact(@BindingParam("on") boolean on) {
        Library.setProperty(DENSITY_PROPERTY, on ? COMPACT : DEFAULT);
        Executions.sendRedirect(null);
    }
}
