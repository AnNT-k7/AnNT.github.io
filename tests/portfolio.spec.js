const { test, expect } = require('@playwright/test');

async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test('desktop enhancements reveal content without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await scrollThrough(page);

  await expect(page.locator('html')).toHaveClass(/js/);
  await expect(page.locator('#main-nav')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#contact-title')).toBeVisible();
  expect(await page.locator('.reveal:not(.visible)').count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile menu is hidden when closed and keeps keyboard focus contained when open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menu = page.locator('.menu-toggle');
  const navigation = page.locator('#main-nav');
  await expect(navigation).toHaveAttribute('aria-hidden', 'true');
  await expect(navigation).toHaveAttribute('inert', '');

  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#main-nav a').first()).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(menu).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#main-nav a').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(navigation).toHaveAttribute('aria-hidden', 'true');

  await menu.click();
  await page.locator('#main-nav a[href="#about"]').click();
  await expect(page.locator('#about-title')).toBeFocused();
  await expect(navigation).toHaveAttribute('aria-hidden', 'true');
});

test('failed application script leaves baseline content and navigation visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/script.js', (route) => route.abort());
  await page.goto('/');

  await expect(page.locator('html')).not.toHaveClass(/js/);
  await expect(page.locator('#main-nav')).toBeVisible();
  await expect(page.locator('#contact-title')).toBeVisible();
  expect(await page.locator('.reveal').evaluateAll((items) => items.every((item) => getComputedStyle(item).opacity !== '0'))).toBe(true);
});

test('missing IntersectionObserver falls back to visible enhanced content', async ({ page }) => {
  await page.addInitScript(() => {
    delete window.IntersectionObserver;
  });
  await page.goto('/');

  await expect(page.locator('html')).toHaveClass(/js/);
  expect(await page.locator('.reveal').evaluateAll((items) => items.every((item) => item.classList.contains('visible')))).toBe(true);
  await expect(page.locator('#contact-title')).toBeVisible();
});

test('motion preference persists, ignores corrupt values, and synchronizes pointer tracking', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Giảm chuyển động' });
  const orb = page.locator('.pointer-orb');
  await page.mouse.move(180, 190);
  await expect(orb).toHaveCSS('left', '180px');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAccessibleName('Giảm chuyển động');
  expect(await page.evaluate(() => localStorage.getItem('annt-motion'))).toBe('reduced');
  await page.mouse.move(310, 320);
  await expect(orb).not.toHaveCSS('left', '310px');

  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAccessibleName('Giảm chuyển động');
  await toggle.click();
  await page.mouse.move(410, 420);
  await expect(orb).toHaveCSS('left', '410px');

  await page.evaluate(() => localStorage.setItem('annt-motion', 'corrupt'));
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('annt-motion'))).toBeNull();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('system reduced motion and no-JavaScript modes expose substantive content', async ({ browser }) => {
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('/');
  await expect(reducedPage.locator('html')).toHaveClass(/reduce-motion/);
  expect(await reducedPage.locator('.reveal').evaluateAll((items) => items.every((item) => getComputedStyle(item).opacity !== '0'))).toBe(true);
  await reducedContext.close();

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto('/');
  await expect(noScriptPage.locator('#main-nav')).toBeVisible();
  await expect(noScriptPage.locator('#contact-title')).toBeVisible();
  expect(await noScriptPage.locator('.reveal').evaluateAll((items) => items.every((item) => getComputedStyle(item).opacity !== '0'))).toBe(true);
  await noScriptContext.close();
});
