package zk.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.zkoss.lang.Library;

import jakarta.servlet.http.HttpServletRequest;

@SpringBootApplication
@Controller
public class ThemePreviewApp {
    public static void main(String[] args) {
        System.setProperty("zk.homepage", "preview");
        Library.setProperty("org.zkoss.theme.preferred", "zk-material");
        //disable caches for development
        Library.setProperty("org.zkoss.zk.ZUML.cache", "false");
        Library.setProperty("org.zkoss.zk.WPD.cache", "false");
        Library.setProperty("org.zkoss.zk.WCS.cache", "false");
        Library.setProperty("org.zkoss.web.classWebResource.cache", "false");
        Library.setProperty("org.zkoss.util.label.cache", "false");
        SpringApplication.run(ThemePreviewApp.class, args);
    }

    /** allow visiting each zul without zul e.g. http://localhost:8080/anchor or http://localhost:8080/usecase/app-shell */
    @GetMapping("/**")
    public String zulPage(HttpServletRequest request) {
        String path = request.getServletPath();
        // strip leading slash
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        return path;
    }
}
