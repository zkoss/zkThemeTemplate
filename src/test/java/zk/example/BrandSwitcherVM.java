package zk.example;

import org.zkoss.bind.annotation.BindingParam;
import org.zkoss.bind.annotation.Command;
import org.zkoss.bind.annotation.NotifyChange;
import org.zkoss.theme.marble.MarbleBrand;

/**
 * Drives the Brand Presets showcase page ({@code usecase/brand-switcher.zul}).
 *
 * <p>Delegates to the theme's own {@link MarbleBrand} helper, which sets
 * {@code data-brand} on the document root — the same knob Marble ships in
 * {@code tokens/_colors.css}. The demo dogfoods the real mechanism rather than a
 * demo-only class, mirroring how {@link UseCaseVM#toggleCompactMode} drives
 * {@code MarbleDensity}.
 */
public class BrandSwitcherVM {

    private String currentBrand = "default";

    public String getCurrentBrand() {
        return currentBrand;
    }

    @Command
    @NotifyChange("currentBrand")
    public void switchBrand(@BindingParam("brand") String brand) {
        MarbleBrand.Brand target;
        try {
            target = MarbleBrand.Brand.valueOf(brand.toUpperCase());
        } catch (IllegalArgumentException e) {
            target = MarbleBrand.Brand.DEFAULT;
        }
        this.currentBrand = target.token();
        MarbleBrand.apply(target);
    }
}
