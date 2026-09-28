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

test('desktop and phone show the full editorial composition without horizontal overflow', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 950 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'AnNT' })).toBeVisible();
    await expect(page.locator('.reference-card img')).toHaveAttribute('src', 'assets/editorial-reference.jpg');
    await expect(page.getByText('LinkedIn soon')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('CV soon')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[data-gallery] .photo')).toHaveCount(3);
    await expect(page.locator('[data-gallery] figcaption strong').first()).toHaveText('Window light');
    await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('newest five populate the loop and View all exposes the complete dated archive', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.achievement-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await expect(cards.last()).toHaveAttribute('href', 'achievement.html?id=useful-details');
  await expect(page.getByText('An earlier note')).toHaveCount(0);

  const viewAll = page.locator('[data-view-all]');
  await viewAll.click();
  await expect(viewAll).toHaveAttribute('aria-expanded', 'true');
  await expect(cards).toHaveCount(6);
  await expect(page.getByText('An earlier note')).toBeVisible();
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  const viewport = page.locator('[data-achievement-viewport]');
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    expect(await viewport.evaluate((node) => {
      const lastCard = node.querySelector('.achievement-card:last-child');
      const viewportBox = node.getBoundingClientRect();
      const lastBox = lastCard.getBoundingClientRect();
      return getComputedStyle(node).overflowY === 'visible'
        && node.scrollHeight <= node.clientHeight + 1
        && lastBox.bottom <= viewportBox.bottom + 1;
    })).toBe(true);
  }

  await viewAll.click();
  await expect(cards).toHaveCount(5);
  await expect(viewAll).toHaveAttribute('aria-expanded', 'false');
});

test('shuffled dated achievements are sorted newest-first before selecting five', async ({ page }) => {
  await overrideContent(page, `window.PORTFOLIO_CONTENT.achievements = [window.PORTFOLIO_CONTENT.achievements[5], window.PORTFOLIO_CONTENT.achievements[2], window.PORTFOLIO_CONTENT.achievements[4], window.PORTFOLIO_CONTENT.achievements[0], window.PORTFOLIO_CONTENT.achievements[3], window.PORTFOLIO_CONTENT.achievements[1]];`);
  await page.goto('/');
  expect(await page.locator('.achievement-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('href')))).toEqual([
    'achievement.html?id=first-steps',
    'achievement.html?id=patient-practice',
    'achievement.html?id=room-to-grow',
    'achievement.html?id=small-systems',
    'achievement.html?id=useful-details'
  ]);
});

test('rail translation uses the selected card position when card heights differ', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.achievement-card');
  await cards.nth(0).evaluate((card) => { card.style.minHeight = '235px'; });
  await page.locator('[data-achievement-viewport]').evaluate((node) => node.dispatchEvent(new Event('resize')));
  const expectedOffset = await cards.evaluateAll((items) => items[1].offsetTop - items[0].offsetTop);
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-achievement-track]')).toHaveAttribute('style', new RegExp(`translateY\\(-${expectedOffset}px\\)`));
});

test('buttons, wheel, keyboard, focus, and pointer pause keep the rail predictable', async ({ page }) => {
  await page.addInitScript(() => {
    const intervals = new Map();
    let nextId = 1;
    window.setInterval = (callback) => { const id = nextId++; intervals.set(id, callback); return id; };
    window.clearInterval = (id) => intervals.delete(id);
    window.__runIntervals = () => intervals.forEach((callback) => callback());
  });
  await page.goto('/');
  const track = page.locator('[data-achievement-track]');
  const viewport = page.locator('[data-achievement-viewport]');
  const status = page.locator('[data-carousel-status]');
  const pause = page.locator('[data-pause]');
  await expect(status).toHaveText('1 of 5');

  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('2 of 5');
  await page.locator('[data-previous]').click();
  await viewport.hover();
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('1 of 5');
  await viewport.focus();
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('1 of 5');
  await page.locator('[data-next]').focus();
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('1 of 5');
  await page.locator('.wordmark').focus();
  await page.evaluate(() => window.__runIntervals());
  await expect(status).toHaveText('2 of 5');
  await page.locator('[data-previous]').click();
  await page.mouse.move(0, 0);
  await page.locator('.wordmark').focus();

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.__runIntervals();
  });
  await expect(status).toHaveText('1 of 5');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    window.__runIntervals();
  });
  await expect(status).toHaveText('2 of 5');
  await page.locator('[data-previous]').click();

  await pause.click();
  await expect(pause).toHaveText('Play');
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  const firstTransform = await track.evaluate((node) => node.style.transform);
  await page.evaluate(() => window.__runIntervals());
  expect(await track.evaluate((node) => node.style.transform)).toBe(firstTransform);

  await page.locator('[data-next]').click();
  await expect(status).toHaveText('2 of 5');
  await page.locator('[data-previous]').click();
  await expect(status).toHaveText('1 of 5');
  await viewport.evaluate((node) => node.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })));
  await expect(status).toHaveText('2 of 5');
  await viewport.evaluate((node) => node.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })));
  await expect(status).toHaveText('2 of 5');
  await viewport.focus();
  await page.keyboard.press('ArrowDown');
  await expect(status).toHaveText('3 of 5');
  await expect(page.locator('.achievement-card[tabindex="0"]')).toHaveAttribute('href', 'achievement.html?id=room-to-grow');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/achievement\.html\?id=room-to-grow/);
});

test('touch swipe moves the rail and card links remain tappable', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const viewport = page.locator('[data-achievement-viewport]');
  await expect(viewport).toHaveCSS('touch-action', 'pan-y');
  const box = await viewport.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 350);
  const touchTarget = await viewport.elementHandle();
  await viewport.dispatchEvent('touchstart', { changedTouches: [{ identifier: 1, target: touchTarget, clientX: 300, clientY: 350, pageX: 300, pageY: 350, screenX: 300, screenY: 350 }] });
  await viewport.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, target: touchTarget, clientX: 180, clientY: 350, pageX: 180, pageY: 350, screenX: 180, screenY: 350 }] });
  await expect(page.locator('[data-carousel-status]')).toHaveText('2 of 5');
  await page.locator('.achievement-card[href*="patient-practice"]').tap();
  await expect(page).toHaveURL(/achievement\.html\?id=patient-practice/);
  await context.close();
});

test('configured identity, biography, links, gallery, and records propagate from content.js', async ({ page }) => {
  await overrideContent(page, `Object.assign(window.PORTFOLIO_CONTENT.profile, {name: 'Nova Reed', role: 'designer · developer', bio: 'A replaced biography.', note: 'A replaced note.', github: {label: 'Nova on GitHub', url: 'https://github.com/nova'}, linkedin: {label: 'Nova on LinkedIn', url: 'https://linkedin.com/in/nova'}});`);
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Nova Reed');
  await expect(page.locator('[data-role]')).toHaveText('designer · developer');
  await expect(page.locator('[data-bio]')).toHaveText('A replaced biography.');
  await expect(page.locator('[data-note]')).toHaveText('A replaced note.');
  await expect(page.locator('[data-github]')).toHaveAttribute('href', 'https://github.com/nova');
  await expect(page.locator('[data-linkedin]')).toHaveAttribute('href', 'https://linkedin.com/in/nova');
  await expect(page.locator('.wordmark')).toHaveText('Nova Reed');
  await expect(page).toHaveTitle('Nova Reed — Personal Archive');
  await expect(page.locator('[data-profile-description]')).toHaveAttribute('content', /Nova Reed/);
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.wordmark')).toHaveText('Nova Reed');
  await expect(page.locator('.wordmark')).toHaveAttribute('aria-label', 'Nova Reed home');
  await expect(page).toHaveTitle('First steps, carefully made — Nova Reed');
  await expect(page.locator('[data-profile-description]')).toHaveAttribute('content', /Nova Reed/);
});

test('intentionally empty configured strings do not reveal fallback sample copy', async ({ page }) => {
  await overrideContent(page, `window.PORTFOLIO_CONTENT.profile.bio = ''; window.PORTFOLIO_CONTENT.profile.note = ''; window.PORTFOLIO_CONTENT.gallery.intro = '';`);
  await page.goto('/');
  await expect(page.locator('[data-bio]')).toHaveText('');
  await expect(page.locator('[data-note]')).toHaveText('');
  await expect(page.locator('[data-gallery-intro]')).toHaveText('');
});

test('custom collection growth reaches the home, full archive, and detail story', async ({ page }) => {
  await overrideContent(page, `window.PORTFOLIO_CONTENT.gallery.items.push({title: 'Added portrait', caption: 'Added photo', image: 'assets/photo-placeholder-01.svg', alt: 'Added portrait placeholder'}); window.PORTFOLIO_CONTENT.achievements.push({id: 'added-entry', title: 'Added entry', category: 'Added note', date: '2024-01-01', year: '2024', summary: 'Added summary', story: 'The added detail story.', image: 'assets/achievement-placeholder-01.svg', imageAlt: 'Added entry placeholder'});`);
  await page.goto('/');
  await expect(page.locator('[data-gallery] .photo')).toHaveCount(4);
  await expect(page.getByText('Added portrait', { exact: true })).toBeVisible();
  await page.locator('[data-view-all]').click();
  await expect(page.locator('.achievement-card')).toHaveCount(7);
  await page.locator('.achievement-card[href="achievement.html?id=added-entry"]').click();
  await expect(page.locator('.detail-copy h1')).toHaveText('Added entry');
  await expect(page.getByText('The added detail story.')).toBeVisible();
});

test('detail records tolerate omitted optional facts and links', async ({ page }) => {
  await overrideContent(page, `delete window.PORTFOLIO_CONTENT.achievements[0].facts; delete window.PORTFOLIO_CONTENT.achievements[0].links;`);
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.detail-copy h1')).toHaveText('First steps, carefully made');
  await expect(page.locator('.facts')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to archive' })).toBeVisible();
});

test('known and unknown achievement URLs render complete useful outcomes', async ({ page }) => {
  await page.goto('/achievement.html?id=patient-practice');
  await expect(page.locator('.detail-copy h1')).toHaveText('Patient practice');
  await expect(page.getByText('Demo entry — not a real credential')).toBeVisible();
  await expect(page.getByRole('link', { name: 'GitHub profile' })).toHaveAttribute('href', 'https://github.com/AnNT-k7');
  await expect(page.getByRole('link', { name: 'Back to archive' })).toHaveAttribute('href', 'index.html#achievements');
  await page.goto('/achievement.html?id=does-not-exist');
  await expect(page.getByRole('heading', { name: 'That story is not here.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to achievements' })).toBeVisible();
});

test('empty content creates authored fallbacks and disables unavailable behavior', async ({ page }) => {
  await overrideContent(page, `window.PORTFOLIO_CONTENT.gallery.items = []; window.PORTFOLIO_CONTENT.achievements = []; window.PORTFOLIO_CONTENT.profile.github = {label: 'GitHub soon', url: ''};`);
  await page.goto('/');
  await expect(page.getByText('Photographs will be added here when they are ready to share.')).toBeVisible();
  await expect(page.getByText('Achievement notes will appear here as the archive grows.')).toBeVisible();
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  await expect(page.locator('[data-carousel-controls] button').first()).toBeDisabled();
  await expect(page.locator('[data-github]')).toHaveText('GitHub soon');
  await expect(page.locator('[data-github]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-github]')).not.toHaveAttribute('href', /.+/);
});

test('reduced motion removes autoplay while preserving all newest cards and manual controls', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-achievement-track]')).toHaveCSS('transform', 'none');
  await expect(page.locator('.achievement-card')).toHaveCount(5);
  await expect(page.locator('.achievement-card[tabindex="0"]')).toHaveCount(5);
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  await context.close();
});

test('missing gallery and detail images expose styled text fallbacks', async ({ page }) => {
  await page.route('**/photo-placeholder-01.svg', (route) => route.abort());
  await page.goto('/');
  const photo = page.locator('[data-gallery] .photo').first();
  await expect(photo).toHaveClass(/is-missing/);
  await expect(photo.locator('.image-fallback')).toContainText('Window light');
  await page.route('**/achievement-placeholder-01.svg', (route) => route.abort());
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.detail-visual')).toHaveClass(/is-missing/);
  await expect(page.locator('.detail-visual .image-fallback')).toContainText('First steps');
});

test('no JavaScript and a failed application script retain identity, navigation, and truthful fallback copy', async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await context.newPage();
  await noJsPage.goto('/');
  await expect(noJsPage.getByRole('heading', { name: 'AnNT' })).toBeVisible();
  await expect(noJsPage.getByRole('link', { name: 'GitHub' })).toBeVisible();
  await expect(noJsPage.getByRole('link', { name: 'open this sample entry' })).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await noJsPage.goto('/achievement.html?id=first-steps');
  await expect(noJsPage.getByText('This page needs JavaScript to match the requested archive entry.')).toBeVisible();
  await context.close();

  await page.route('**/script.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.placeholder-card')).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
});

test('resources and stable detail navigation work beneath a GitHub Pages project subpath', async ({ page }) => {
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
  await expect(page.locator('.reference-card img')).toBeVisible();
  await page.locator('.achievement-card').first().click();
  await expect(page).toHaveURL(/\/AnNT\.github\.io\/achievement\.html\?id=first-steps/);
  await expect(page.locator('.detail-copy h1')).toHaveText('First steps, carefully made');
});
