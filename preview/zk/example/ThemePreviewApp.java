package zk.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.zkoss.lang.Library;

@SpringBootApplication
public class ThemePreviewApp {
    public static void main(String[] args) {
        System.setProperty("zk.homepage", "preview");
        Library.setProperty("org.zkoss.theme.preferred", "sca");
        //disable caches for development
        Library.setProperty("org.zkoss.zk.ZUML.cache", "false");
        Library.setProperty("org.zkoss.zk.WPD.cache", "false");
        Library.setProperty("org.zkoss.zk.WCS.cache", "false");
        Library.setProperty("org.zkoss.web.classWebResource.cache", "false");
        Library.setProperty("org.zkoss.util.label.cache", "false");
        SpringApplication.run(ThemePreviewApp.class, args);
    }
}
