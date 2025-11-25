package zk.example;

import java.io.File;
import java.io.FilenameFilter;
import java.util.*;

public class ZulListVM {
    public static final String HOME_PAGE = "preview.zul";

    List<String> zulFiles = new ArrayList<>();

    public void findZulFiles() {
        // Use getResource() to ensure correct path resolution in different environments (e.g., JAR, Java EE)
        java.net.URL resource = getClass().getClassLoader().getResource("web");
        File dir = new File(resource.getFile());

        File[] files = dir.listFiles(new FilenameFilter() {
            public boolean accept(File dir, String name) {
                return name.endsWith(".zul") && !name.equals(HOME_PAGE);
            }
        });

        if (files != null) {
            for (File file : files) {
                zulFiles.add(file.getName());
            }
        }
        Collections.sort(zulFiles);
    }

    public ZulListVM() {
        findZulFiles();
    }

    public List<String> getZulFiles() {
        return zulFiles;
    }
}
