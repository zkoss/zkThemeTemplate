package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.Executions;

import java.util.HashMap;
import java.util.Map;

/**
 * View model for {@code usecase/index.zul}, the component browser.
 *
 * <p>One job: keep the sidebar and the content pane agreed on which page is showing.
 *
 * <p>It used to have a second — a live density switch — which went away with D6/C25: density is
 * now set only by the {@code org.zkoss.zul.theme.density} library property, so reviewing compact
 * means restarting the preview app with {@code -Dorg.zkoss.zul.theme.density=compact}. That is
 * also exactly what an application does, so the review path and the shipped path are the same.
 *
 * <p><b>Deep links.</b> The desktop bookmark IS the page, minus {@code ~./} and {@code .zul}, so
 * {@code usecase/index.zul#button} opens the button page and browser back/forward work. That
 * makes every page in the corpus addressable by URL — which is what the screenshot harness and a
 * design reviewer both need.
 *
 * <p><b>PAGE_TO_NAV exists to reopen the right group.</b> Arriving by bookmark, the sidebar has
 * no idea which {@code <nav>} contains the page, and a browser that lands on a collapsed sidebar
 * looks broken. The map is the same grouping the ZUL renders, kept here rather than derived from
 * it because the ZUL is markup and this is the only consumer.
 */
public class UseCaseVM {

    private static final String DEFAULT_PAGE = "~./overview.zul";
    private static final String DEFAULT_NAV = "Overview";

    /**
     * Page (bookmark form) to the sidebar group that contains it. Mirrors the {@code <nav>}
     * structure of {@code usecase/index.zul}; a page missing here still navigates, it just does
     * not reopen its group on a cold deep link.
     *
     * <p>{@code preview} is absent on purpose: it is the app homepage and renders every other
     * page inline, so it is not a sidebar destination.
     */
    private static final Map<String, String> PAGE_TO_NAV = new HashMap<>();

    private static void put(String nav, String... pages) {
        for (String p : pages) {
            PAGE_TO_NAV.put(p, nav);
        }
    }

    static {
        put("Overview",
                "overview", "component-theming");
        put("Inputs",
                "bandbox", "button", "calendar", "cascader", "checkbox", "chosenbox", "colorbox",
                "combobox", "combobutton", "datebox", "daterangebox", "decimalbox", "doublebox",
                "doublespinner", "inputgroup", "inputs", "intbox", "longbox", "multislider",
                "radiogroup", "rangeslider", "rating", "searchbox", "selectbox", "slider", "spinner",
                "textbox", "timebox", "timepicker");
        put("Data",
                "badge", "biglistbox", "chip", "dnd", "grid", "grid-detail", "grid-grouping",
                "grid-header", "grid-livegrouping", "grid-paging", "label", "listbox",
                "listbox-grouping", "listbox-header", "organigram", "paging", "responsive-grid",
                "tree", "tree-header");
        put("Navigation",
                "a", "anchornav", "breadcrumb", "coachmark", "drawer", "fisheyebar", "menubar",
                "navbar", "stepbar", "tabbox", "tabbox-misc", "toolbar");
        put("Containers",
                "caption", "groupbox", "panel", "popup", "window");
        put("Layout",
                "absolutelayout", "anchorlayout", "area", "borderlayout", "cardlayout",
                "columnlayout", "goldenlayout", "hlayout", "linelayout", "portallayout", "rowlayout",
                "scrollview", "space", "splitlayout", "splitter", "tablelayout", "vlayout");
        put("Feedback",
                "confirmpopup", "errorbox", "loading", "loadingbar", "messagebox", "notification",
                "progressmeter", "runtime-error", "scrollbar", "separator", "toast");
        put("Media & Upload",
                "audio", "avatar", "barcode", "barcodescanner", "camera", "captcha", "carousel",
                "cropper", "dropupload", "fileupload", "html", "iframe", "imagemap", "pdfviewer",
                "signature", "tbeditor", "video");
        put("Utility CSS",
                "utility/borders", "utility/colors", "utility/components", "utility/elevation",
                "utility/grid-layout", "utility/icons", "utility/layout", "utility/print",
                "utility/responsive", "utility/spacing", "utility/stack", "utility/typography",
                "utility/zindex");
    }

    private String currentPage = DEFAULT_PAGE;
    private String openNavLabel = DEFAULT_NAV;

    /** A bookmark reaches this from the URL fragment, so it is untrusted input that ends up in a
        {@code templateURI}. Only the shape the navigate command produces is accepted. */
    private static boolean isValidBookmark(String bookmark) {
        return bookmark != null && bookmark.matches("[a-zA-Z0-9/_-]+");
    }

    private void updateOpenNav(String bookmark) {
        String group = PAGE_TO_NAV.get(bookmark);
        if (group != null) {
            openNavLabel = group;
        }
    }

    @Init
    public void init() {
        String bookmark = Executions.getCurrent().getDesktop().getBookmark();
        if (isValidBookmark(bookmark)) {
            this.currentPage = "~./" + bookmark + ".zul";
            updateOpenNav(bookmark);
        }
    }

    public String getCurrentPage() {
        return currentPage;
    }

    public String getOpenNavLabel() {
        return openNavLabel;
    }

    @Command
    @NotifyChange({"currentPage", "openNavLabel"})
    public void navigate(@BindingParam("page") String page) {
        this.currentPage = page;
        String bookmark = page.replace("~./", "").replace(".zul", "");
        Executions.getCurrent().getDesktop().setBookmark(bookmark);
        updateOpenNav(bookmark);
    }

    @Command
    @NotifyChange({"currentPage", "openNavLabel"})
    public void handleBookmarkChange(@BindingParam("bookmark") String bookmark) {
        if (isValidBookmark(bookmark)) {
            this.currentPage = "~./" + bookmark + ".zul";
            updateOpenNav(bookmark);
        } else {
            this.currentPage = DEFAULT_PAGE;
            this.openNavLabel = DEFAULT_NAV;
        }
    }
}
