package zk.example;

import java.io.File;
import java.io.FilenameFilter;
import java.util.*;

public class ZulListVM {
    public static final String HOME_PAGE = "preview.zul";

    private List<String> zulFiles = new ArrayList<>();
    //some pages will affect the preview rendering, it's better to preview it in a separate page
    static private List<String> separatePageList = List.of("coachmark.zul");

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
    static public boolean isSeparatePage(String zulPageName) {
        return separatePageList.contains(zulPageName);
    }

    public ZulListVM() {
        findZulFiles();
    }

    public List<String> getZulFiles() {
        return zulFiles;
    }
}
