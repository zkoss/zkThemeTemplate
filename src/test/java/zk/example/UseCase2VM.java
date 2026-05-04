package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.Executions;

import java.util.Set;

public class UseCase2VM {

    private static final String PAGE_PREFIX = "~./usecase2/";
    private static final String PAGE_SUFFIX = ".zul";
    private static final String DEFAULT_PAGE = PAGE_PREFIX + "default" + PAGE_SUFFIX;
    private static final Set<String> VALID_PAGES = Set.of(
        "default", "analytics", "saas", "pages", "projects", "orders", "products",
        "invoice-list", "invoice-detail", "tasks", "sign-in", "sign-up", "reset-password",
        "accordion", "alerts", "avatars", "badges", "buttons", "cards", "chips",
        "dialogs", "lists", "menus", "pagination", "progress", "tabs", "tooltips",
        "charts-apex", "charts-chartjs", "forms-editors", "forms-pickers",
        "forms-selection-controls", "forms-selects", "forms-text-fields",
        "tables-simple", "tables-advanced", "tables-datagrid", "icons-lucide"
    );

    private String currentPage = DEFAULT_PAGE;

    @Init
    public void init() {
        String bookmark = Executions.getCurrent().getDesktop().getBookmark();
        if (bookmark != null && !bookmark.isEmpty() && VALID_PAGES.contains(bookmark)) {
            this.currentPage = PAGE_PREFIX + bookmark + PAGE_SUFFIX;
        }
    }

    public String getCurrentPage() {
        return currentPage;
    }

    @Command
    @NotifyChange("currentPage")
    public void navigate(@BindingParam("page") String page) {
        this.currentPage = page;
        String bookmark = page.replace(PAGE_PREFIX, "").replace(PAGE_SUFFIX, "");
        Executions.getCurrent().getDesktop().setBookmark(bookmark);
    }

    @Command
    @NotifyChange("currentPage")
    public void handleBookmarkChange(@BindingParam("bookmark") String bookmark) {
        if (bookmark != null && !bookmark.isEmpty() && VALID_PAGES.contains(bookmark)) {
            this.currentPage = PAGE_PREFIX + bookmark + PAGE_SUFFIX;
        } else {
            this.currentPage = DEFAULT_PAGE;
        }
    }
}
