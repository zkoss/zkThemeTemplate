package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.Executions;

import java.util.HashMap;
import java.util.Map;

public class UseCaseVM {

    private static final String DEFAULT_PAGE = "~./usecase/dashboard.zul";
    private static final String DEFAULT_NAV = "Use Cases";

    private static final Map<String, String> PAGE_TO_NAV;
    static {
        PAGE_TO_NAV = new HashMap<>();
        for (String p : new String[]{"usecase/dashboard", "usecase/app-shell", "usecase/order-entry",
                "usecase/employee-grid", "usecase/user-profile", "usecase/product-browser",
                "usecase/report-viewer", "usecase/media-manager"}) {
            PAGE_TO_NAV.put(p, "Use Cases");
        }
        for (String p : new String[]{"button", "combobutton", "checkbox", "radiogroup",
                "textbox", "intbox", "longbox", "decimalbox", "doublebox", "combobox", "selectbox",
                "chosenbox", "searchbox", "cascader", "datebox", "timebox", "timepicker", "spinner",
                "doublespinner", "colorbox", "bandbox", "slider", "rangeslider", "multislider",
                "rating", "inputgroup", "inputs", "inputs-basic", "inputs-rounded", "a"}) {
            PAGE_TO_NAV.put(p, "Form Controls");
        }
        for (String p : new String[]{"grid", "grid-header", "grid-grouping", "grid-livegrouping",
                "grid-detail", "grid-paging", "listbox", "listbox-header", "listbox-grouping",
                "tree", "tree-header", "paging", "biglistbox", "organigram"}) {
            PAGE_TO_NAV.put(p, "Data");
        }
        for (String p : new String[]{"menubar", "toolbar", "tabbox", "tabbox-misc",
                "navbar", "anchornav",
                "fisheyebar", "coachmark", "stepbar", "drawer"}) {
            PAGE_TO_NAV.put(p, "Navigation");
        }
        for (String p : new String[]{"window", "panel", "groupbox", "popup", "caption"}) {
            PAGE_TO_NAV.put(p, "Containers");
        }
        for (String p : new String[]{"borderlayout", "borderlayout-misc", "hlayout", "vlayout",
                "splitter", "splitlayout", "anchorlayout", "absolutelayout", "columnlayout",
                "rowlayout", "linelayout", "tablelayout", "cardlayout", "goldenlayout",
                "portallayout", "scrollview", "space", "area"}) {
            PAGE_TO_NAV.put(p, "Layout");
        }
        for (String p : new String[]{"progressmeter", "notification", "toast", "loadingbar",
                "messagebox", "loading", "separator", "scrollbar", "calendar", "error", "errorbox"}) {
            PAGE_TO_NAV.put(p, "Feedback");
        }
        for (String p : new String[]{"fileupload", "dropupload", "audio", "video", "camera",
                "barcode", "barcodescanner", "imagemap", "pdfviewer", "cropper", "signature",
                "tbeditor", "captcha", "html", "iframe"}) {
            PAGE_TO_NAV.put(p, "Media & Upload");
        }
        for (String p : new String[]{
                "usecase/utility/colors", "usecase/utility/typography",
                "usecase/utility/spacing", "usecase/utility/layout",
                "usecase/utility/borders", "usecase/utility/elevation",
                "usecase/utility/components"}) {
            PAGE_TO_NAV.put(p, "Utility CSS");
        }
    }

    private String currentPage = DEFAULT_PAGE;
    private String openNavLabel = DEFAULT_NAV;

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
