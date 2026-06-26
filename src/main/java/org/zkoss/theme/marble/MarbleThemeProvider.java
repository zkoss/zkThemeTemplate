package org.zkoss.theme.marble;

import org.zkoss.lang.Library;
import org.zkoss.web.fn.ServletFns;
import org.zkoss.zk.ui.Execution;
import org.zkoss.zk.ui.util.ThemeProvider;

import java.util.*;

// this class is made as a workaround for ZK-6024 load theme-based font-awesome.css.dsp from a wrong path
public class MarbleThemeProvider implements ThemeProvider {

    // ZK's widget-CSS bundle; everything inside it (norm.css.dsp + component CSS) loads
    // after this entry in the page <head>. We insert the reset stylesheet just before it
    // so the reset keeps its current "first" cascade position (it used to live inside
    // norm.css.dsp). See doc/spec/reset-scoping.md.
    private static final String ZK_WCS = "zul/css/zk.wcs";

    // org.zkoss.zul.theme.browserDefault (boolean, default false): the legacy ZK switch for
    // whether the theme overrides browser defaults globally. We reuse it DSP-free —
    //   false → override globally: serve the standard global reset (reset.css);
    //   true  → don't override the host: serve the host-safe reset scoped to .z-page
    //           with the html/body frame dropped (reset-embed.css), for JS-Embed pages.
    private static final String BROWSER_DEFAULT = "org.zkoss.zul.theme.browserDefault";
    private static final String RESET_GLOBAL = "~./zul/css/reset.css";
    private static final String RESET_EMBED = "~./zul/css/reset-embed.css";

    @Override
    public Collection<Object> getThemeURIs(Execution exec, List<Object> uris) {
        final boolean embedSafe = Boolean.parseBoolean(Library.getProperty(BROWSER_DEFAULT, "false"));
        final String resetUri = ServletFns.resolveThemeURL(embedSafe ? RESET_EMBED : RESET_GLOBAL);

        final List<Object> out = new ArrayList<>(uris.size() + 1);
        boolean inserted = false;
        for (Object uri : uris) {
            if (!inserted && uri instanceof String && ((String) uri).contains(ZK_WCS)) {
                out.add(resetUri); // reset loads immediately before the widget-CSS bundle
                inserted = true;
            }
            out.add(uri);
        }
        if (!inserted) {
            out.add(0, resetUri); // no zk.wcs entry found — fall back to loading first
        }
        return out;
    }

    @Override
    public int getWCSCacheControl(Execution exec, String uri) {
        return 8760;
    }

    @Override
    public String beforeWCS(Execution exec, String uri) {
        return uri;
    }

    // ZK's stock zk.wcs (in zul-*.jar) pulls in ~./zul/font/font-awesome.css.dsp.
    // Marble renders every icon via Lucide-derived ::before mask-image (see _icons.css),
    // so the font-awesome.css.dsp would only ship dead bytes and trigger a noisy
    // "Font Awesome Free 6.4.2 by @fontawesome" banner inside the served zk.wcs.
    // Returning null tells WcsExtendlet to skip that <stylesheet> entry entirely.
    private static final String FONT_AWESOME_DSP = "~./zul/font/font-awesome.css.dsp";

    // workaround for ZK-6024 load theme-based font-awesome.css.dsp from a wrong path
    @Override
    public String beforeWidgetCSS(Execution exec, String uri) {
        if (FONT_AWESOME_DSP.equals(uri)) {
            return null; // skip — Marble does not use Font Awesome
        }
        //the paths that a theme can have. Marble ships themed CSS for all three
        //widget namespaces (js/zul, js/zkmax, js/zkex); without rewriting zkmax
        //and zkex too, ZK serves its stock default CSS for those components
        //(e.g. navbar's .z-nav-text would resolve to Helvetica Neue / 18px from
        //the default LESS profile instead of Marble's MD3 typescale).
        if (uri.startsWith("~./zul/") // a patch for ZK-6024
                || uri.startsWith("~./js/zul/")
                || uri.startsWith("~./js/zkmax/")
                || uri.startsWith("~./js/zkex/")) {

            uri = ServletFns.resolveThemeURL(uri);
        }

        return uri;
    }
}
