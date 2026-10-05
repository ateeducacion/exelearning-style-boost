// Uses Playwright already installed in the eXeLearning checkout; no test runner.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:1314/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
  const ready = () => page.waitForFunction(() => document.querySelector('.boost-navbar') && [...document.querySelectorAll('.idevice_node[data-idevice-component-type="json"]')].every(node => node.classList.contains('loaded')));
  const drawerOpen = () => page.evaluate(() => !document.documentElement.classList.contains('boost-drawer-closed') && getComputedStyle(document.querySelector('#siteNav')).visibility === 'visible');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  try {
    await page.goto(base);
    await ready();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontFamily.startsWith('"Noto Sans"')), true, 'Noto Sans is the body font');
    if (process.env.BOOST_SCREENSHOT) {
      await page.setViewportSize({ width: 1200, height: 700 });
      await page.goto(new URL('html/evaporacion.html', base).href); await ready();
      await page.evaluate(() => { document.querySelector('.exe-open-exelearning')?.remove(); return document.fonts.ready; });
      await page.screenshot({ path: process.env.BOOST_SCREENSHOT });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(base); await ready();
    }
    const urls = await page.locator('#siteNav li > a').evaluateAll(links => links.map(link => link.href));
    assert.equal(urls.length, 11, 'The course index lists every page');
    assert.equal(await drawerOpen(), true, 'The course index is open on a wide screen');

    // Read the whole course with "next", checking the header on each page.
    for (let index = 0; index < urls.length; index++) {
      assert.equal(stripped(page.url()), stripped(urls[index]), `Page ${index + 1} in order`);
      const state = await page.evaluate(() => ({
        current: document.querySelector('#siteNav a.active')?.href,
        crumbs: [...document.querySelectorAll('.boost-breadcrumb li')].map(item => item.textContent.trim()),
        title: document.querySelector('.page-title').textContent.trim(),
        tab: document.querySelector('.boost-secondary-navigation a.active')?.textContent.trim(),
        next: document.querySelector('.boost-activity-navigation a.nav-button-right')?.href,
      }));
      assert.equal(stripped(state.current), stripped(urls[index]), 'The course index marks the current page');
      if (index) assert.equal(state.crumbs.at(-1), state.title, 'The breadcrumb ends on the page title');
      if (state.tab) assert.equal(state.tab, state.title, 'The section tab marks the page');
      if (index === urls.length - 1) { assert.equal(state.next, undefined, 'Nothing after the last page'); break; }
      await page.locator('.boost-activity-navigation a.nav-button-right').click();
      await ready();
    }

    // Back, "Jump to..." and the course index.
    await page.locator('.boost-activity-navigation a.nav-button-left').click(); await ready();
    assert.equal(stripped(page.url()), stripped(urls.at(-2)), 'Previous link goes back');
    await page.selectOption('#boost-jump-to', urls[3]); await page.waitForURL(urls[3]); await ready();
    await page.locator('#siteNav a', { hasText: 'Recursos' }).click(); await page.waitForURL(/recursos/); await ready();

    // Sections fold; the drawer closes, stays closed across pages, and reopens.
    const section = page.locator('#siteNav .boost-chevron').first();
    assert.equal(await section.getAttribute('aria-expanded'), 'false', 'Other sections start folded');
    await section.click();
    assert.equal(await section.getAttribute('aria-expanded'), 'true');
    assert(await page.locator('#siteNav a', { hasText: 'Evaporación' }).isVisible(), 'Unfolding shows its pages');
    await page.locator('.boost-drawer-close').click();
    assert.equal(await drawerOpen(), false, 'The close button hides the course index');
    await page.waitForFunction(() => document.querySelector('main.page').getBoundingClientRect().left < 285); // Content takes the freed space.
    await page.reload(); await ready();
    assert.equal(await drawerOpen(), false, 'The closed index is remembered');
    await page.locator('.boost-drawer-open').click();
    assert.equal(await drawerOpen(), true, 'The toggler reopens the course index');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('boost-drawer-close')), true, 'Focus moves into the opened index');

    // Footer popover and search.
    assert.equal(await page.locator('#packageLicense').isVisible(), false, 'The footer starts hidden');
    await page.locator('.boost-footer-button').click();
    assert(await page.locator('#packageLicense').isVisible(), 'The help button shows the footer');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#packageLicense').isVisible(), false, 'Escape hides the footer');
    await page.locator('.boost-search-toggle').click();
    await page.locator('#exe-client-search-text').fill('nubes');
    await page.keyboard.press('Enter');
    assert((await page.locator('#exe-client-search-results-list li').count()) > 0, 'Search finds pages');

    // Activities work inside the cards.
    await page.goto(urls.find(url => url.includes('verdadero'))); await ready();
    for (const [index, value] of ['1', '0', '1', '0'].entries()) {
      await page.locator('.TOFP-QuestionDiv').nth(index).locator(`input[value="${value}"]`).check();
    }
    await page.locator('[id^="tofPCheckTest-"]').click();
    assert.equal(await page.locator('.TOFP-SolutionMessage').filter({ hasText: /Correct/i }).count(), 4, 'True/false quiz marks all answers');

    await page.goto(urls.find(url => url.includes('ordena'))); await ready();
    const options = await page.locator('.scrambled-list').evaluate(node => JSON.parse(node.dataset.ideviceJsonData).options);
    for (let i = 0; i < options.length; i++) {
      for (let attempts = 0; attempts < options.length; attempts++) {
        const items = await page.locator('.exe-sortableList-options > li').allTextContents();
        const index = items.findIndex(text => text.includes(options[i]));
        if (index === i) break;
        await page.locator('.exe-sortableList-options > li').nth(index).locator('a.up').click();
      }
    }
    await page.locator('input[class*="exe-sortableList-check-"]').click();
    assert.match(await page.locator('[id$="-feedback"]').innerText(), /Correcto|superada/i, 'Sorting exercise can be completed');

    // Phones: the index is a modal drawer and nothing is wider than the screen.
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(urls[2]); await ready();
      assert.equal(await drawerOpen(), false, `Index starts closed at ${width}px`);
      assert.equal(await overflow(), false, `Fits ${width}px`);
      await page.locator('.boost-drawer-open').click();
      assert.equal(await drawerOpen(), true, `Index opens at ${width}px`);
      await page.keyboard.press('Escape');
      assert.equal(await drawerOpen(), false, `Escape closes the index at ${width}px`);
      await page.locator('.boost-drawer-open').click();
      await page.locator('.boost-backdrop').click({ position: { x: width - 10, y: 400 } });
      assert.equal(await drawerOpen(), false, `The backdrop closes the index at ${width}px`);
    }
    assert.deepEqual(errors, [], errors.join('\n'));
    console.log(`PASS: ${urls.length} pages read in order with breadcrumb and tabs, jump menu, folding index, remembered drawer, footer, search, activities and phone widths.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

function stripped(url) {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.search = '';
  return parsed.href.replace(/\/index\.html$/, '/');
}
