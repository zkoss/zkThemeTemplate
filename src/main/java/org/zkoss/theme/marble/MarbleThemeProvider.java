package org.zkoss.theme.marble;

import org.zkoss.web.fn.ServletFns;
import org.zkoss.zk.ui.Execution;
import org.zkoss.zk.ui.util.ThemeProvider;

import java.util.*;

// this class is made as a workaround for ZK-6024 load theme-based font-awesome.css.dsp from a wrong path
public class MarbleThemeProvider implements ThemeProvider {
    @Override
    public Collection<Object> getThemeURIs(Execution exec, List<Object> uris) {
        return uris;
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
