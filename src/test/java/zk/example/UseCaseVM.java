package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.zk.ui.Executions;

public class UseCaseVM {

    private static final String DEFAULT_PAGE = "~./usecase/dashboard.zul";

    private String currentPage = DEFAULT_PAGE;

    private static boolean isValidBookmark(String bookmark) {
        return bookmark != null && bookmark.matches("[a-zA-Z0-9/_-]+");
    }

    @Init
    public void init() {
        String bookmark = Executions.getCurrent().getDesktop().getBookmark();
        if (isValidBookmark(bookmark)) {
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
        if (isValidBookmark(bookmark)) {
            this.currentPage = "~./" + bookmark + ".zul";
        } else {
            this.currentPage = DEFAULT_PAGE;
        }
    }
}
