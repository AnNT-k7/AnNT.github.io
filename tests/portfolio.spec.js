const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

async function overrideContent(page, sourceAddition) {
  await page.route('**/content.js', async (route) => {
    const source = await fs.readFile(path.join(projectRoot, 'content.js'), 'utf8');
    await route.fulfill({ contentType: 'text/javascript', body: `${source}\n${sourceAddition}` });
  });
}

test('home fills the viewport with an exact one-third achievement rail', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  const poster = page.locator('.poster-stage');
  const box = await poster.boundingBox();
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.y).toBeCloseTo(0, 0);
  expect(box.width).toBeCloseTo(1200, 0);
  expect(box.height).toBeCloseTo(800, 0);
  const columnHeights = await poster.evaluate((node) => {
    const stage = node.getBoundingClientRect();
    const left = node.querySelector('.contact-sheet').getBoundingClientRect();
    const right = node.querySelector('.feature-poster').getBoundingClientRect();
    const strip = node.querySelector('.filmstrip').getBoundingClientRect();
    const fifth = node.querySelector('.achievement-card:nth-child(5)').getBoundingClientRect();
    const tail = node.querySelector('.title-tail').getBoundingClientRect();
    const header = node.querySelector('.poster-header').getBoundingClientRect();
    return {
      stage: stage.height,
      left: left.height,
      right: right.height,
      fifthStartsInsideStrip: fifth.top < strip.bottom && fifth.top >= strip.top,
      titleFits: tail.right <= header.right
    };
  });
  expect(columnHeights.left).toBeCloseTo(columnHeights.stage, 0);
  expect(columnHeights.right).toBeCloseTo(columnHeights.stage, 0);
  expect(columnHeights.fifthStartsInsideStrip).toBe(true);
  expect(columnHeights.titleFits).toBe(true);
  expect(await page.locator('.contact-sheet').evaluate((node) => node.getBoundingClientRect().width / node.closest('.poster-stage').getBoundingClientRect().width)).toBeCloseTo(1 / 3, 2);
  await expect(page.locator('.poster-header h1')).toHaveText('AnNT');
  await expect(page.locator('.title-tail')).toHaveText('archive');
  await expect(page.locator('.hero-field')).toBeVisible();
  await expect(page.locator('.poster-footer')).toBeVisible();
  await expect(page.locator('.botanical-top')).toBeVisible();
  await expect(page.locator('.botanical-bottom')).toBeVisible();
  await expect(page.locator('.poster-stage')).toHaveCSS('overflow', 'hidden');
  await expect(page.getByRole('link', { name: 'View all achievements' })).toHaveAttribute('href', 'archive.html');
  await expect(page.locator('[data-linkedin]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-cv]')).toHaveAttribute('aria-disabled', 'true');
  expect(await page.evaluate(() => ({
    noHorizontalScroll: document.documentElement.scrollWidth <= window.innerWidth,
    noVerticalScroll: document.documentElement.scrollHeight <= window.innerHeight,
    scrollY: window.scrollY
  }))).toEqual({ noHorizontalScroll: true, noVerticalScroll: true, scrollY: 0 });

  await page.setViewportSize({ width: 900, height: 1200 });
  expect(await poster.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    return [bounds.width, bounds.height, document.documentElement.scrollHeight];
  })).toEqual([900, 1200, 1200]);
});

test('the contact sheet contains exactly the newest five linked records in order', async ({ page }) => {
  await overrideContent(page, 'window.PORTFOLIO_CONTENT.achievements.reverse();');
  await page.goto('/');
  const cards = page.locator('.achievement-card');
  await expect(cards).toHaveCount(5);
  expect(await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')))).toEqual([
    'achievement.html?id=first-steps',
    'achievement.html?id=patient-practice',
    'achievement.html?id=room-to-grow',
    'achievement.html?id=small-systems',
    'achievement.html?id=useful-details'
  ]);
  await expect(cards.first().locator('.frame-image img')).toHaveAttribute('src', 'assets/achievement-placeholder-01.svg');
  await expect(cards.last().locator('.frame-meta')).toContainText('2026');
  await expect(cards.first()).toHaveAccessibleName('First steps, carefully made, Learning note, 2026, demo content');
  await expect(cards.first().locator('.frame-meta')).toContainText('First steps, carefully made');
});

test('autoplay, pointer/focus pause, buttons, wheel, and keyboard stay inside the locked viewport', async ({ page }) => {
  await page.addInitScript(() => {
    const intervals = new Map(); let nextId = 1;
    window.setInterval = (callback) => { const id = nextId++; intervals.set(id, callback); return id; };
    window.clearInterval = (id) => intervals.delete(id);
    window.__runIntervals = () => intervals.forEach((callback) => callback());
  });
  await page.goto('/');
  const viewport = page.locator('[data-achievement-viewport]');
  const status = page.locator('[data-carousel-status]');
  await expect(status).toHaveText('1 of 5');
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('2 of 5');
  await viewport.hover();
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('2 of 5');
  await viewport.focus();
  await page.mouse.move(1100, 1000);
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('2 of 5');
  await page.locator('.reference-note a').focus();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.__runIntervals();
  });
  await expect(status).toHaveText('2 of 5');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('[data-next]').focus();
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('2 of 5');
  await page.mouse.move(1100, 1000);
  await page.locator('[data-pause]').click();
  await expect(page.locator('[data-pause]')).toHaveText('Play');
  await page.locator('[data-next]').click();
  await expect(status).toHaveText('3 of 5');
  await expect(page.locator('[data-achievement-track]')).not.toHaveCSS('transform', 'none');
  const prevented = await viewport.evaluate((node) => {
    const event = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await expect(status).toHaveText('4 of 5');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const zoomPrevented = await viewport.evaluate((node) => {
    const event = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(zoomPrevented).toBe(false);
  await viewport.focus();
  await page.keyboard.press('ArrowDown');
  await expect(status).toHaveText('5 of 5');
  await page.keyboard.press('ArrowDown');
  await expect(status).toHaveText('1 of 5');
  await expect(page.locator('.achievement-card[aria-current="true"]')).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await page.waitForTimeout(700);
  expect(await viewport.evaluate((node) => {
    const selected = node.querySelector('.achievement-card[aria-current="true"]').getBoundingClientRect();
    const bounds = node.getBoundingClientRect();
    return selected.top >= bounds.top - 1 && selected.top < bounds.bottom;
  })).toBe(true);
});

test('complete archive exposes every dated record and links each one to details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'View all achievements' }).click();
  await expect(page).toHaveURL(/\/archive\.html$/);
  const cards = page.locator('[data-archive-grid] .achievement-card');
  await expect(cards).toHaveCount(6);
  await expect(cards.last()).toHaveAttribute('href', 'achievement.html?id=earlier-note');
  await cards.last().click();
  await expect(page.locator('.detail-copy h1')).toHaveText('An earlier note');
});

test('horizontal touch gesture selects and reveals a mobile frame while preserving vertical panning', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 700, height: 900 } });
  const page = await context.newPage();
  await page.goto('/');
  const viewport = page.locator('[data-achievement-viewport]');
  await expect(viewport).toHaveCSS('touch-action', 'pan-y');
  const handle = await viewport.elementHandle();
  await viewport.dispatchEvent('touchstart', { changedTouches: [{ identifier: 1, target: handle, clientX: 300, clientY: 220, pageX: 300, pageY: 220, screenX: 300, screenY: 220 }] });
  await viewport.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, target: handle, clientX: 180, clientY: 220, pageX: 180, pageY: 220, screenX: 180, screenY: 220 }] });
  await expect(page.locator('[data-carousel-status]')).toHaveText('2 of 5');
  expect(await viewport.evaluate((node) => {
    const selected = node.querySelector('.achievement-card[aria-current="true"]');
    const viewportBox = node.getBoundingClientRect();
    const selectedBox = selected.getBoundingClientRect();
    return selectedBox.left >= viewportBox.left && selectedBox.right <= viewportBox.right;
  })).toBe(true);
  await context.close();
});

test('mobile keeps the one-third rail and entire home inside one viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.feature-poster')).toBeVisible();
  await expect(page.locator('.achievement-card')).toHaveCount(5);
  expect(await page.locator('.contact-sheet').evaluate((node) => node.getBoundingClientRect().width / window.innerWidth)).toBeCloseTo(1 / 3, 2);
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth <= window.innerWidth,
    height: document.documentElement.scrollHeight <= window.innerHeight,
    scrollY: window.scrollY
  }))).toEqual({ width: true, height: true, scrollY: 0 });
  expect(await page.locator('.ink-link').first().evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(30);
  await expect(page.locator('.achievement-card').first().locator('.frame-meta em')).toBeVisible();
  await expect(page.locator('.reference-note')).toBeVisible();
});

test('short and landscape viewports keep essential controls inside the locked home', async ({ page }) => {
  for (const viewport of [{ width: 667, height: 375 }, { width: 900, height: 400 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const selector of ['[data-github]', '.archive-link', '[data-carousel-controls]']) {
      const bounds = await page.locator(selector).boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  }
});

test('no-script fallback link remains reachable inside the fixed viewport', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const link = page.getByRole('link', { name: 'open this sample entry' });
  await expect(link).toBeVisible();
  const bounds = await link.boundingBox();
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await context.close();
});

test('content overrides propagate and empty/missing media show authored fallbacks', async ({ page }) => {
  await overrideContent(page, `Object.assign(window.PORTFOLIO_CONTENT.profile, {name:'Nova Reed', bio:'A replaced biography.', linkedin:{label:'LinkedIn later',url:''}}); window.PORTFOLIO_CONTENT.gallery.items=[]; window.PORTFOLIO_CONTENT.achievements=[];`);
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Nova Reed');
  await expect(page.locator('[data-bio]')).toHaveText('A replaced biography.');
  await expect(page.getByText('LinkedIn later')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText('Photographs will be added here when they are ready to share.')).toBeVisible();
  await expect(page.getByText('Achievement notes will appear here as the archive grows.')).toBeVisible();
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();

  const missingPage = await page.context().newPage();
  await missingPage.route('**/photo-placeholder-01.svg', (route) => route.abort());
  await missingPage.route('**/achievement-placeholder-01.svg', (route) => route.abort());
  await missingPage.goto('/');
  await expect(missingPage.locator('.photo').first()).toHaveClass(/is-missing/);
  await expect(missingPage.locator('.photo .image-fallback').first()).toContainText('Window light');
  await expect(missingPage.locator('.achievement-card').first().locator('.frame-image')).toHaveClass(/is-missing/);
  await expect(missingPage.locator('.achievement-card').first().locator('.image-fallback')).toContainText('First steps');
});

test('configured profile fields and identity propagate through home and detail metadata', async ({ page }) => {
  await overrideContent(page, `Object.assign(window.PORTFOLIO_CONTENT.profile, {name:'Nova Reed Portfolio Atelier', role:'designer · developer', bio:'A replaced biography.', note:'A replaced note.', github:{label:'Nova on GitHub',url:'https://github.com/nova'}, linkedin:{label:'Nova on LinkedIn',url:'https://linkedin.com/in/nova'}});`);
  await page.goto('/');
  await expect(page.locator('.poster-header')).toHaveClass(/identity-long/);
  expect(await page.locator('.poster-header').evaluate((header) => {
    const name = header.querySelector('h1').getBoundingClientRect();
    const bounds = header.getBoundingClientRect();
    return name.right <= bounds.right && name.bottom <= bounds.bottom;
  })).toBe(true);
  await expect(page.locator('[data-role]')).toHaveText('designer · developer');
  await expect(page.locator('[data-note]')).toHaveText('A replaced note.');
  await expect(page.locator('[data-github]')).toHaveAttribute('href', 'https://github.com/nova');
  await expect(page.locator('[data-linkedin]')).toHaveAttribute('href', 'https://linkedin.com/in/nova');
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.detail-home')).toContainText('Nova Reed Portfolio Atelier / home');
  await expect(page.locator('.detail-home')).toHaveAttribute('aria-label', 'Nova Reed Portfolio Atelier home');
  await expect(page).toHaveTitle('First steps, carefully made — Nova Reed Portfolio Atelier');
  await expect(page.locator('[data-profile-description]')).toHaveAttribute('content', /Nova Reed Portfolio Atelier/);
});

test('detail rendering tolerates omitted optional facts and links and missing media', async ({ page }) => {
  await overrideContent(page, 'delete window.PORTFOLIO_CONTENT.achievements[0].facts; delete window.PORTFOLIO_CONTENT.achievements[0].links;');
  await page.route('**/achievement-placeholder-01.svg', (route) => route.abort());
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.detail-copy h1')).toHaveText('First steps, carefully made');
  await expect(page.locator('.facts')).toHaveCount(0);
  await expect(page.locator('.detail-visual')).toHaveClass(/is-missing/);
  await expect(page.locator('.detail-visual .image-fallback')).toContainText('First steps');
  await expect(page.getByRole('link', { name: 'Back to archive' })).toBeVisible();
});

test('reduced motion renders a static accessible newest-five list', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-achievement-track]')).toHaveCSS('transform', 'none');
  await expect(page.locator('.achievement-card[tabindex="0"]')).toHaveCount(5);
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  await context.close();
});

test('detail and unknown routes remain complete and use matching poster treatment', async ({ page }) => {
  await page.goto('/achievement.html?id=patient-practice');
  await expect(page.locator('.detail-sheet')).toBeVisible();
  await expect(page.locator('.detail-copy h1')).toHaveText('Patient practice');
  await expect(page.getByText('Demo entry — not a real credential')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to archive' })).toHaveAttribute('href', 'index.html#achievements');
  await page.goto('/achievement.html?id=unknown');
  await expect(page.getByRole('heading', { name: 'That story is not here.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to achievements' })).toBeVisible();
  await page.goto('/achievement.html?id=earlier-note');
  await expect(page.locator('.detail-copy h1')).toHaveText('An earlier note');
});

test('no JavaScript keeps identity, profile navigation, and a detail route available', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AnNT' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'open this sample entry' })).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.getByText('This page needs JavaScript to match the requested archive entry.')).toBeVisible();
  await context.close();
});

test('a failed application script retains identifiable fallback content and navigation', async ({ page }) => {
  await page.route('**/script.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.placeholder-card')).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await expect(page.locator('.placeholder-card .frame-meta')).toContainText('First steps, carefully made');
  await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
});

test('reference and relative resources work beneath a GitHub Pages project subpath', async ({ page }) => {
  await page.route('**/AnNT.github.io/**', async (route) => {
    const url = new URL(route.request().url());
    let relative = decodeURIComponent(url.pathname.replace(/^\/AnNT\.github\.io\/?/, '')) || 'index.html';
    if (relative.endsWith('/')) relative += 'index.html';
    const target = path.resolve(projectRoot, relative);
    if (!target.startsWith(`${projectRoot}${path.sep}`) && target !== path.join(projectRoot, 'index.html')) return route.abort();
    try {
      const body = await fs.readFile(target);
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
      await route.fulfill({ status: 200, contentType: types[path.extname(target)] || 'application/octet-stream', body });
    } catch { await route.fulfill({ status: 404, body: 'not found' }); }
  });
  await page.goto('http://127.0.0.1:8765/AnNT.github.io/');
  const referenceLink = page.getByRole('link', { name: 'View the unchanged reference.' });
  await expect(referenceLink).toHaveAttribute('href', 'reference_pic.jpg');
  const [referenceResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/AnNT.github.io/reference_pic.jpg')),
    referenceLink.click()
  ]);
  expect(referenceResponse.ok()).toBe(true);
  expect(referenceResponse.headers()['content-type']).toBe('image/jpeg');
  await page.goBack();
  await page.locator('.achievement-card').first().click();
  await expect(page).toHaveURL(/\/AnNT\.github\.io\/achievement\.html\?id=first-steps/);
  await expect(page.locator('.detail-copy h1')).toHaveText('First steps, carefully made');
});
