package org.zkoss.theme.zkmaterial;

import org.zkoss.web.fn.ServletFns;
import org.zkoss.zk.ui.Execution;
import org.zkoss.zk.ui.util.ThemeProvider;

import java.util.*;

// this class is made as a workaround for ZK-6024 load theme-based font-awesome.css.dsp from a wrong path
public class ZkMaterialThemeProvider implements ThemeProvider {
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

    // workaround for ZK-6024 load theme-based font-awesome.css.dsp from a wrong path
    @Override
    public String beforeWidgetCSS(Execution exec, String uri) {
        //the paths that a theme can have
        if (uri.startsWith("~./zul/") // a patch for ZK-6024
                || uri.startsWith("~./js/zul/")) {

            uri = ServletFns.resolveThemeURL(uri);
        }

        return uri;
    }
}
