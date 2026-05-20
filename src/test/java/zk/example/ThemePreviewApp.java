package zk.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.zkoss.lang.Library;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@SpringBootApplication
@Controller
public class ThemePreviewApp {
    public static void main(String[] args) {
        System.setProperty("zk.homepage", "preview");
        Library.setProperty("org.zkoss.theme.preferred", "marble");
        //disable caches for development
        Library.setProperty("org.zkoss.zk.ZUML.cache", "false");
        Library.setProperty("org.zkoss.zk.WPD.cache", "false");
        Library.setProperty("org.zkoss.zk.WCS.cache", "false");
        Library.setProperty("org.zkoss.web.classWebResource.cache", "false");
        Library.setProperty("org.zkoss.util.label.cache", "false");
        SpringApplication.run(ThemePreviewApp.class, args);
    }

    /** serve static CSS files from usecase demo directory */
    @GetMapping(path = "/*.css", produces = "text/css")
    @ResponseBody
    public ResponseEntity<Resource> usecaseCss(HttpServletRequest request) {
        String path = request.getServletPath();
        Resource resource = new ClassPathResource("web" + path);
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/css")).body(resource);
    }

    /** serve ZUL pages; non-.zul requests return 404 to avoid intercepting static resources */
    @GetMapping("/**")
    public String zulPage(HttpServletRequest request, HttpServletResponse response) throws java.io.IOException {
        String path = request.getServletPath();
        if (!path.endsWith(".zul")) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return null;
        }
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        // Strip .zul extension — ZK view resolver appends it when resolving the view
        return path.substring(0, path.length() - 4);
    }
}
