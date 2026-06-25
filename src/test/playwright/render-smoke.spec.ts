import { test, expect } from '@playwright/test';

// Render smoke test: every preview page must return HTTP 200 and compose without
// error. xmllint only proves a .zul is well-formed XML — it does NOT catch ZK
// semantic errors such as an unsupported mold or an attribute with no setter,
// which surface only at compose time as an HTTP 500.
//
// Most pages share the `.z-p-8` page wrapper; `preview.zul` is a special SPA
// listing page (no z-p-8) so it falls back to a `body` visible check.
//
// Requires the preview app running on http://localhost:8080
//   withjdk.sh 17 mvn test exec:java@preview-app

const PAGES = [
  '/a.zul',
  '/absolutelayout.zul',
  '/anchorlayout.zul',
  '/anchornav.zul',
  '/area.zul',
  '/audio.zul',
  '/bandbox.zul',
  '/barcode.zul',
  '/barcodescanner.zul',
  '/biglistbox.zul',
  '/borderlayout.zul',
  '/button.zul',
  '/calendar.zul',
  '/camera.zul',
  '/captcha.zul',
  '/caption.zul',
  '/cardlayout.zul',
  '/cascader.zul',
  '/checkbox.zul',
  '/chosenbox.zul',
  '/coachmark.zul',
  '/colorbox.zul',
  '/columnlayout.zul',
  '/combobox.zul',
  '/combobutton.zul',
  '/cropper.zul',
  '/datebox.zul',
  '/decimalbox.zul',
  '/dnd.zul',
  '/doublebox.zul',
  '/doublespinner.zul',
  '/drawer.zul',
  '/dropupload.zul',
  '/error.zul',
  '/errorbox.zul',
  '/fileupload.zul',
  '/fisheyebar.zul',
  '/goldenlayout.zul',
  '/grid-detail.zul',
  '/grid-grouping.zul',
  '/grid-header.zul',
  '/grid-livegrouping.zul',
  '/grid-paging.zul',
  '/grid-utilities.zul',
  '/grid.zul',
  '/groupbox.zul',
  '/hlayout.zul',
  '/html.zul',
  '/iframe.zul',
  '/imagemap.zul',
  '/inputgroup.zul',
  '/inputs.zul',
  '/intbox.zul',
  '/label.zul',
  '/linelayout.zul',
  '/listbox-grouping.zul',
  '/listbox-header.zul',
  '/listbox.zul',
  '/loading.zul',
  '/loadingbar.zul',
  '/longbox.zul',
  '/menubar.zul',
  '/messagebox.zul',
  '/multislider.zul',
  '/navbar.zul',
  '/notification.zul',
  '/organigram.zul',
  '/overview.zul',
  '/paging.zul',
  '/panel.zul',
  '/pdfviewer.zul',
  '/popup.zul',
  '/portallayout.zul',
  '/preview.zul',
  '/progressmeter.zul',
  '/radiogroup.zul',
  '/rangeslider.zul',
  '/rating.zul',
  '/rowlayout.zul',
  '/scrollbar.zul',
  '/scrollview.zul',
  '/searchbox.zul',
  '/selectbox.zul',
  '/separator.zul',
  '/signature.zul',
  '/slider.zul',
  '/space.zul',
  '/spinner.zul',
  '/splitlayout.zul',
  '/splitter.zul',
  '/stepbar.zul',
  '/tabbox-misc.zul',
  '/tabbox.zul',
  '/tablelayout.zul',
  '/tbeditor.zul',
  '/textbox.zul',
  '/timebox.zul',
  '/timepicker.zul',
  '/toast.zul',
  '/toolbar.zul',
  '/tree-header.zul',
  '/tree.zul',
  '/video.zul',
  '/vlayout.zul',
  '/window.zul',
];

// Pages that don't use the standard .z-p-8 wrapper — check body instead.
const NO_WRAPPER = new Set(['/preview.zul']);

test.describe('render smoke — all preview pages', () => {
  for (const path of PAGES) {
    test(`renders ${path}`, async ({ page }) => {
      const resp = await page.goto(path, { waitUntil: 'networkidle' });

      expect(resp, `no response for ${path}`).toBeTruthy();
      expect(
        resp!.status(),
        `${path} returned HTTP ${resp!.status()} — page failed to compile`
      ).toBe(200);

      if (NO_WRAPPER.has(path)) {
        await expect(page.locator('body'), `${path} body not visible`).toBeVisible();
      } else {
        await expect(
          page.locator('.z-p-8').first(),
          `${path} did not render the .z-p-8 page wrapper`
        ).toBeVisible();
      }
    });
  }
});
