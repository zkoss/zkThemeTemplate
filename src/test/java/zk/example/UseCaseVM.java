package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.Init;
import org.zkoss.bind.annotation.NotifyChange;

public class UseCaseVM {

    private static final String DEFAULT_PAGE = "~./usecase/dashboard.zul";

    private String currentPage = DEFAULT_PAGE;

    @Init
    public void init() {
    }

    public String getCurrentPage() {
        return currentPage;
    }

    @Command
    @NotifyChange("currentPage")
    public void navigate(@BindingParam("page") String page) {
        if (page != null && page.startsWith("~./")) {
            this.currentPage = page;
        }
    }
}
