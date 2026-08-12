package zk.example;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Drives the Font Awesome catalog page ({@code utility/icons.zul}).
 *
 * <p>The names come from <b>this theme's own compiled stylesheet</b>, not from ZK's LESS
 * sources — so the page always demos what the theme currently serves. If a conversion phase
 * drops or renames an icon rule, the catalog shows it on the next build instead of listing
 * names that no longer render.
 *
 * <p>The three categories of the zkbooks reference page fall straight out of the compiled
 * CSS, because ZK's {@code _icons.less} emits the two glyph maps with different pseudo-element
 * syntax:
 *
 * <pre>
 *   .z-icon-{name}::before{content:"\f0f1"}   → Classic Solid   (the .fa-icons() map)
 *   .z-icon-{name}:before{content:"\f3d0"}    → Brand Icons     (the .fa-brand-icons() map)
 *   .z-icon-{name}{...animation...}           → Animation modifiers
 * </pre>
 *
 * <p>Brands therefore also pick up the FA4 brand aliases that {@code _shims.less} emits, which
 * is the honest answer for "what can I write today" — every name here has a rule behind it.
 */
public class FontAwesomeIconsVM {

    /** This theme's compiled Font Awesome sheet, as a classpath resource under target/classes. */
    private static final String THEME_FA_CSS = "web/iceblue11/zul/font/font-awesome.css.dsp";

    private static final Pattern RULE = Pattern.compile("([^{}]+)\\{([^{}]*)\\}");
    private static final Pattern GLYPH_DECL = Pattern.compile("^content:\"\\\\[0-9a-f]+\"$");
    private static final Pattern SOLID_SEL = Pattern.compile("^\\.z-icon-([a-z0-9-]+)::before$");
    private static final Pattern BRAND_SEL = Pattern.compile("^\\.z-icon-([a-z0-9-]+):before$");
    private static final Pattern PLAIN_SEL = Pattern.compile("^\\.z-icon-([a-z0-9-]+)$");

    private final List<String> solidIcons;
    private final List<String> brandIcons;
    private final List<String> animations;

    public FontAwesomeIconsVM() {
        Set<String> solid = new LinkedHashSet<>();
        Set<String> brands = new LinkedHashSet<>();
        Set<String> anims = new LinkedHashSet<>();
        scan(readThemeCss(), solid, brands, anims);

        if (solid.isEmpty() && brands.isEmpty())
            throw new IllegalStateException("No icon rules found in " + THEME_FA_CSS
                    + " — build the theme before starting the preview app.");

        solidIcons = new ArrayList<>(solid);
        brandIcons = new ArrayList<>(brands);
        animations = new ArrayList<>(anims);
    }

    public List<String> getSolidIcons() {
        return solidIcons;
    }

    public List<String> getBrandIcons() {
        return brandIcons;
    }

    public List<String> getAnimations() {
        return animations;
    }

    public String getSolidHeading() {
        return solidIcons.size() + " icons";
    }

    public String getBrandHeading() {
        return brandIcons.size() + " icons";
    }

    public String getAnimationHeading() {
        return animations.size() + " modifiers";
    }

    /**
     * Sorts every {@code .z-icon-*} rule in the sheet into the three categories, keeping the
     * stylesheet's own order. Declaration blocks never nest here, so a flat rule scan is
     * enough — {@code @keyframes} inner steps simply fail the selector patterns and drop out.
     */
    private void scan(String css, Set<String> solid, Set<String> brands, Set<String> anims) {
        Matcher rule = RULE.matcher(css);
        while (rule.find()) {
            String declarations = rule.group(2).trim();
            boolean isGlyph = GLYPH_DECL.matcher(declarations).matches();
            boolean isAnimation = declarations.contains("animation");
            if (!isGlyph && !isAnimation)
                continue;
            for (String selector : rule.group(1).split(",")) {
                selector = selector.trim();
                Matcher m;
                if (isGlyph && (m = SOLID_SEL.matcher(selector)).matches())
                    solid.add(m.group(1));
                else if (isGlyph && (m = BRAND_SEL.matcher(selector)).matches())
                    brands.add(m.group(1));
                else if (isAnimation && (m = PLAIN_SEL.matcher(selector)).matches())
                    anims.add(m.group(1));
            }
        }
    }

    private String readThemeCss() {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(THEME_FA_CSS)) {
            if (in == null)
                throw new IllegalStateException("Classpath resource not found: " + THEME_FA_CSS
                        + " — build the theme before starting the preview app.");
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + THEME_FA_CSS, e);
        }
    }
}
