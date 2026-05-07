package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.Executions;

import java.util.Set;

public class UseCaseVM {

    private static final String DEFAULT_PAGE = "~./usecase/dashboard.zul";
    private static final Set<String> VALID_PAGES = Set.of(
        // Use Cases
        "usecase/dashboard", "usecase/app-shell", "usecase/order-entry",
        "usecase/employee-grid", "usecase/user-profile", "usecase/product-browser",
        "usecase/report-viewer", "usecase/media-manager",
        // Form Controls
        "button", "combobutton", "checkbox", "radiogroup", "textbox",
        "combobox", "selectbox", "datebox", "timebox", "spinner",
        "slider", "rating", "inputgroup", "bandbox",
        // Data
        "grid", "grid-header", "grid-grouping", "grid-detail",
        "listbox", "listbox-header", "listbox-grouping",
        "tree", "tree-header", "paging", "biglistbox",
        // Navigation
        "menubar", "toolbar", "tabbox", "tabbox-accordion",
        // Containers
        "window", "panel", "groupbox", "popup", "caption",
        // Layout
        "borderlayout", "hlayout", "splitter", "anchorlayout", "absolutelayout",
        // Feedback
        "progressmeter", "notification", "toast", "usecase/messagebox", "calendar"
    );

    private String currentPage = DEFAULT_PAGE;

    @Init
    public void init() {
        String bookmark = Executions.getCurrent().getDesktop().getBookmark();
        if (bookmark != null && !bookmark.isEmpty() && VALID_PAGES.contains(bookmark)) {
            this.currentPage = "~./" + bookmark + ".zul";
        }
    }

    public String getCurrentPage() {
        return currentPage;
    }

    @Command
    @NotifyChange("currentPage")
    public void navigate(@BindingParam("page") String page) {
        this.currentPage = page;
        String bookmark = page.replace("~./", "").replace(".zul", "");
        Executions.getCurrent().getDesktop().setBookmark(bookmark);
    }

    @Command
    @NotifyChange("currentPage")
    public void handleBookmarkChange(@BindingParam("bookmark") String bookmark) {
        if (bookmark != null && !bookmark.isEmpty() && VALID_PAGES.contains(bookmark)) {
            this.currentPage = "~./" + bookmark + ".zul";
        } else {
            this.currentPage = DEFAULT_PAGE;
        }
    }
}
