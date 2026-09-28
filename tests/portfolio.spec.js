const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

test('home presents the reference, profile, gallery, and achievement rail without overflow', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 950 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('AnNT');
    await expect(page.locator('.reference-card img')).toHaveAttribute('src', 'assets/editorial-reference.jpg');
    await expect(page.getByText('LinkedIn soon')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('CV soon')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[data-gallery] .photo')).toHaveCount(3);
    await expect(page.locator('[data-gallery] figcaption strong').first()).toHaveText('Window light');
    await expect(page.locator('.achievement-card:not([aria-hidden])')).toHaveCount(3);
    await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('achievement controls loop, pause, and cards activate from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const track = page.locator('[data-achievement-track]');
  const pause = page.locator('[data-pause]');
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(pause).toHaveText('Play');
  const transform = () => track.evaluate((node) => node.style.transform);
  const next = page.locator('[data-next]');
  const previous = page.locator('[data-previous]');

  expect(await transform()).toBe('translateY(-222px)');
  await next.click();
  expect(await transform()).toBe('translateY(-444px)');
  await page.waitForTimeout(650);
  await next.click();
  expect(await transform()).toBe('translateY(-666px)');
  await page.waitForTimeout(650);
  await next.click();
  expect(await transform()).toBe('translateY(-888px)');
  await page.waitForTimeout(650);
  expect(await transform()).toBe('translateY(-222px)');

  await previous.click();
  expect(await transform()).toBe('translateY(0px)');
  await page.waitForTimeout(650);
  expect(await transform()).toBe('translateY(-666px)');
  await previous.click();
  await page.waitForTimeout(650);
  expect(await transform()).toBe('translateY(-444px)');

  const tabbableCards = page.locator('.achievement-card:not([aria-hidden])[tabindex="0"]');
  await expect(tabbableCards).toHaveCount(1);
  await expect(tabbableCards).toHaveAttribute('href', 'achievement.html?id=patient-practice');
  await tabbableCards.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/achievement\.html\?id=patient-practice/);
  await expect(page.locator('.detail-copy h1')).toHaveText('Patient practice');
});

test('configured profile identity and links propagate across both pages', async ({ page }) => {
  const root = path.resolve(__dirname, '..');
  await page.route('**/content.js', async (route) => {
    const source = await fs.readFile(path.join(root, 'content.js'), 'utf8');
    await route.fulfill({
      contentType: 'text/javascript',
      body: `${source}\nObject.assign(window.PORTFOLIO_CONTENT.profile, {name: 'Nova Reed', role: 'designer · developer', bio: 'A replaced biography.', note: 'A replaced note.', github: {label: 'Nova on GitHub', url: 'https://github.com/nova'}, linkedin: {label: 'Nova on LinkedIn', url: 'https://linkedin.com/in/nova'}});`
    });
  });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Nova Reed');
  await expect(page.locator('[data-role]')).toHaveText('designer · developer');
  await expect(page.locator('[data-bio]')).toHaveText('A replaced biography.');
  await expect(page.locator('[data-note]')).toHaveText('A replaced note.');
  await expect(page.locator('[data-github]')).toHaveAttribute('href', 'https://github.com/nova');
  await expect(page.locator('[data-linkedin]')).toHaveAttribute('href', 'https://linkedin.com/in/nova');
  await expect(page.locator('.wordmark')).toHaveText('Nova Reed');
  await expect(page.locator('.folio-footer [data-identity]')).toHaveText('Nova Reed');
  await expect(page).toHaveTitle('Nova Reed — Personal Archive');
  await expect(page.locator('[data-profile-description]')).toHaveAttribute('content', /Nova Reed/);

  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.wordmark')).toHaveText('Nova Reed');
  await expect(page.locator('.wordmark')).toHaveAttribute('aria-label', 'Nova Reed home');
  await expect(page).toHaveTitle('First steps, carefully made — Nova Reed');
  await expect(page.locator('[data-profile-description]')).toHaveAttribute('content', /Nova Reed/);
  await page.goto('/achievement.html?id=missing');
  await expect(page).toHaveTitle('Achievement not found — Nova Reed');
});

test('touch controls move the rail and open an achievement card', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto('/');
  const track = page.locator('[data-achievement-track]');
  const initialTransform = await track.evaluate((node) => node.style.transform);
  await page.locator('[data-next]').tap();
  await expect.poll(() => track.evaluate((node) => node.style.transform)).not.toBe(initialTransform);
  await page.locator('.achievement-card[href*="patient-practice"]').tap();
  await expect(page).toHaveURL(/achievement\.html\?id=patient-practice/);
  await context.close();
});

test('valid and unknown direct achievement URLs have useful outcomes', async ({ page }) => {
  await page.goto('/achievement.html?id=patient-practice');
  await expect(page.locator('.detail-copy h1')).toHaveText('Patient practice');
  await expect(page.getByText('Demo entry — not a real credential')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to archive' })).toHaveAttribute('href', 'index.html#achievements');

  await page.goto('/achievement.html?id=does-not-exist');
  await expect(page.getByRole('heading', { name: 'That story is not here.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to achievements' })).toBeVisible();
});

test('empty collections and URLs render authored inactive states', async ({ page }) => {
  const root = path.resolve(__dirname, '..');
  await page.route('**/content.js', async (route) => {
    const source = await fs.readFile(path.join(root, 'content.js'), 'utf8');
    await route.fulfill({
      contentType: 'text/javascript',
      body: `${source}\nwindow.PORTFOLIO_CONTENT.gallery.items = []; window.PORTFOLIO_CONTENT.achievements = []; window.PORTFOLIO_CONTENT.profile.github = {label: 'GitHub soon', url: ''};`
    });
  });
  await page.goto('/');
  await expect(page.getByText('Photographs will be added here when they are ready to share.')).toBeVisible();
  await expect(page.getByText('Achievement notes will appear here as the archive grows.')).toBeVisible();
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  await expect(page.locator('[data-carousel-controls] button').first()).toBeDisabled();
  await expect(page.locator('[data-github]')).toHaveText('GitHub soon');
  await expect(page.locator('[data-github]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-github]')).not.toHaveAttribute('href', /.+/);
});

test('achievement detail tolerates omitted facts and links', async ({ page }) => {
  const root = path.resolve(__dirname, '..');
  await page.route('**/content.js', async (route) => {
    const source = await fs.readFile(path.join(root, 'content.js'), 'utf8');
    await route.fulfill({ contentType: 'text/javascript', body: `${source}\ndelete window.PORTFOLIO_CONTENT.achievements[0].facts; delete window.PORTFOLIO_CONTENT.achievements[0].links;` });
  });
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.locator('.detail-copy h1')).toHaveText('First steps, carefully made');
  await expect(page.locator('.facts li')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Back to archive' })).toBeVisible();
});

test('reduced motion exposes a static manual achievement list', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-achievement-track]')).toHaveCSS('transform', 'none');
  await expect(page.locator('.achievement-card:not([aria-hidden])')).toHaveCount(3);
  await expect(page.locator('.achievement-card:not([aria-hidden])[tabindex="0"]')).toHaveCount(3);
  await expect(page.locator('[data-pause]')).toBeHidden();
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-carousel-status]')).toContainText('2 of 3');
  await context.close();
});

test('missing gallery and detail images reveal styled fallbacks with useful text', async ({ page }) => {
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

test('additional gallery and achievement entries render without layout overflow', async ({ page }) => {
  const root = path.resolve(__dirname, '..');
  await page.route('**/content.js', async (route) => {
    const source = await fs.readFile(path.join(root, 'content.js'), 'utf8');
    await route.fulfill({
      contentType: 'text/javascript',
      body: `${source}\nwindow.PORTFOLIO_CONTENT.gallery.items.push({...window.PORTFOLIO_CONTENT.gallery.items[0], title: 'Added portrait'});\nwindow.PORTFOLIO_CONTENT.achievements.push({...window.PORTFOLIO_CONTENT.achievements[0], id: 'added-entry', title: 'Added entry'});`
    });
  });
  await page.goto('/');
  await expect(page.locator('[data-gallery] .photo')).toHaveCount(4);
  await expect(page.locator('.achievement-card:not([aria-hidden])')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/achievement.html?id=added-entry');
  await expect(page.locator('.detail-copy h1')).toHaveText('Added entry');
});

test('no JavaScript keeps core information and navigation usable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AnNT' })).toBeVisible();
  await expect(page.getByRole('link', { name: /GitHub/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'this sample entry' })).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.getByText('This page needs JavaScript to match the requested archive entry.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the archive' })).toBeVisible();
  await context.close();
});

test('a failed application script leaves readable content and navigation', async ({ page }) => {
  await page.route('**/script.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AnNT' })).toBeVisible();
  await expect(page.getByRole('link', { name: /GitHub/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();
  await expect(page.locator('.placeholder-card')).toHaveAttribute('href', 'achievement.html?id=first-steps');
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  await page.goto('/achievement.html?id=first-steps');
  await expect(page.getByRole('heading', { name: 'Achievement details' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the archive' })).toBeVisible();
});

test('all resources and navigation work beneath a project subpath', async ({ page }) => {
  const root = path.resolve(__dirname, '..');
  await page.route('**/AnNT.github.io/**', async (route) => {
    const url = new URL(route.request().url());
    let relative = decodeURIComponent(url.pathname.replace(/^\/AnNT\.github\.io\/?/, '')) || 'index.html';
    if (relative.endsWith('/')) relative += 'index.html';
    const target = path.resolve(root, relative);
    if (!target.startsWith(`${root}${path.sep}`) && target !== path.join(root, 'index.html')) return route.abort();
    try {
      const body = await fs.readFile(target);
      const extensions = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
      await route.fulfill({ status: 200, contentType: extensions[path.extname(target)] || 'application/octet-stream', body });
    } catch { await route.fulfill({ status: 404, body: 'not found' }); }
  });
  await page.goto('http://127.0.0.1:8765/AnNT.github.io/');
  await expect(page.locator('.reference-card img')).toBeVisible();
  await page.locator('.achievement-card:not([aria-hidden])').first().click();
  await expect(page).toHaveURL(/\/AnNT\.github\.io\/achievement\.html\?id=first-steps/);
  await expect(page.locator('.detail-copy h1')).toHaveText('First steps, carefully made');
});
