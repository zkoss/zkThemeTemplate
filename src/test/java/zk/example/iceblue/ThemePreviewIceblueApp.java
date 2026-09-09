package zk.example.iceblue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;
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
import java.util.Properties;

// @Profile gates this bean so ThemePreviewApp's scan (zk.example.*) doesn't register
// its mappings — only active when the "iceblue" profile is set (done in main() below).
@SpringBootApplication
@Controller
@Profile("iceblue")
public class ThemePreviewIceblueApp {
    public static void main(String[] args) {
        System.setProperty("zk.homepage", "preview");
        // Do NOT set preferred theme — ZK falls back to built-in iceblue for baseline capture
        Library.setProperty("org.zkoss.zk.ZUML.cache", "false");
        Library.setProperty("org.zkoss.zk.WPD.cache", "false");
        Library.setProperty("org.zkoss.zk.WCS.cache", "false");
        Library.setProperty("org.zkoss.web.classWebResource.cache", "false");
        Library.setProperty("org.zkoss.util.label.cache", "false");

        SpringApplication app = new SpringApplication(ThemePreviewIceblueApp.class);
        Properties props = new Properties();
        props.setProperty("server.port", "8082");
        props.setProperty("spring.profiles.active", "iceblue");
        app.setDefaultProperties(props);
        app.run(args);
    }

    @GetMapping(path = "/*.css", produces = "text/css")
    @ResponseBody
    public ResponseEntity<Resource> usecaseCss(HttpServletRequest request) {
        String path = request.getServletPath();
        Resource resource = new ClassPathResource("web" + path);
        if (!resource.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/css")).body(resource);
    }

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
        return path.substring(0, path.length() - 4);
    }
}
