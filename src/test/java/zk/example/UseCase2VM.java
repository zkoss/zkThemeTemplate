package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.NotifyChange;

public class UseCase2VM {

    private String currentPage = "~./usecase2/default.zul";

    public String getCurrentPage() {
        return currentPage;
    }

    @Command
    @NotifyChange("currentPage")
    public void navigate(@BindingParam("page") String page) {
        this.currentPage = page;
    }
}
