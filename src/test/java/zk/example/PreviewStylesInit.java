package zk.example;

import org.zkoss.zk.ui.WebApp;
import org.zkoss.zk.ui.util.WebAppInit;

/**
 * Appends the preview-only utility stylesheet to every desktop.
 *
 * <p>The preview pages copied in from Marble are written against its {@code z-*} utility
 * classes. 277 of them do not exist in this theme, which is why those pages render with no
 * layout at all — {@code z-d-flex} resolves to nothing, so a flex row computes as
 * {@code display:block}. The sheets under {@code web/preview/utility/} supply them.
 *
 * <p><b>Why a WebAppInit and not a &lt;style src&gt; on each page.</b> Of the 125 preview
 * pages, 113 reference no stylesheet at all. Adding a tag to each would be 125 edits plus a
 * rule to remember on every new page. {@link org.zkoss.zk.ui.util.Configuration#addThemeURI}
 * attaches a sheet to every desktop once.
 *
 * <p><b>Why this is test scope, and must stay there.</b> The drop-LESS conversion proves each
 * phase by diffing the built theme output against {@code baseline/} declaration by
 * declaration. These utilities are net-new declarations: shipped from
 * {@code src/main/resources/web} they would land in that comparison and turn the gate red for
 * a reason that has nothing to do with the conversion. Under {@code src/test} they compile to
 * {@code target/test-classes}, which the gate never reads — and which the visual A/B harness
 * never puts on its classpath either. Promotion into the theme belongs after P8; see
 * {@code tasks/utility-css-vs-p7-ordering.md}.
 *
 * <p>Order is load-bearing twice over: tokens before the utilities that consume them, and the
 * whole set after the theme's own CSS. This tree has no cascade layers, so a utility only
 * outranks the component rule it is meant to override by coming later in source order.
 */
public class PreviewStylesInit implements WebAppInit {

    /** Tokens first — the utility files are written against this vocabulary. */
    private static final String[] SHEETS = {
        "~./preview/utility/_tokens.css",
        "~./preview/utility/_colors.css",
        "~./preview/utility/_elevation.css",
        "~./preview/utility/_components.css",
        "~./preview/utility/_spacing.css",
        "~./preview/utility/_layout.css",
        "~./preview/utility/_typography.css",
        "~./preview/utility/_borders.css",
        "~./preview/utility/_stack.css",
        "~./preview/utility/_print.css",
    };

    public void init(WebApp webapp) throws Exception {
        for (String sheet : SHEETS) {
            webapp.getConfiguration().addThemeURI(sheet);
        }
    }
}
