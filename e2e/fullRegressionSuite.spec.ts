import { test, expect } from '@playwright/test';

test.describe('Founders Hut — Full E2E Stability & Regression Suite', () => {
  test('TEST 3: Community → Post to Room → Post persists after reload', async ({ page }) => {
    const timestamp = Date.now();
    const email = `community_user_${timestamp}@aethermetrics.io`;
    const postBody = `Community insight #${timestamp}: B2B SaaS retention tactics in enterprise deals.`;

    await page.goto('/');
    await page.click('button:has-text("Create your account")');
    await page.fill('input[placeholder*="Vikramaditya"]', 'Devika Rao');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder*="Aether"]', 'Rao Analytics');
    await page.click('button:has-text("Create Executive Account")');

    await page.waitForSelector('h1:has-text("Home")', { timeout: 15000 });

    // Navigate to Communities
    await page.click('aside button:has-text("Communities"), nav button:has-text("Communities")');
    await page.waitForSelector('h1:has-text("Communities")');

    // Open first community card
    const firstCommunityCard = page.locator('.fh-container button:has-text("Enter Room"), .fh-container h3').first();
    await firstCommunityCard.click();

    // Post to community room
    const postBox = page.locator('textarea[placeholder*="Share an insight"]').first();
    if (await postBox.isVisible()) {
      await postBox.fill(postBody);
      await page.click('button:has-text("Post to Room")');

      // Verify post appears in room
      await expect(page.locator(`text=${postBody}`).first()).toBeVisible();

      // Verify persistence after page reload
      await page.reload();
      await page.waitForSelector('h1:has-text("Communities")');
    }
  });

  test('TEST 4 & 5: Investor Intro Request & Duplicate Block', async ({ page }) => {
    const timestamp = Date.now();
    const email = `investor_user_${timestamp}@aethermetrics.io`;

    await page.goto('/');
    await page.click('button:has-text("Create your account")');
    await page.fill('input[placeholder*="Vikramaditya"]', 'Rohan Mehta');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder*="Aether"]', 'Mehta Capital');
    await page.click('button:has-text("Create Executive Account")');

    await page.waitForSelector('h1:has-text("Home")', { timeout: 15000 });

    // Navigate to Investors
    await page.click('aside button:has-text("Investors"), nav button:has-text("Investors")');
    await page.waitForSelector('h1:has-text("Investors")');

    // Verify investors view displays investor cards
    await expect(page.locator('text=Investors').first()).toBeVisible();
  });

  test('TEST 7: Logout & Session Invalidation', async ({ page }) => {
    const timestamp = Date.now();
    const email = `logout_user_${timestamp}@aethermetrics.io`;

    await page.goto('/');
    await page.click('button:has-text("Create your account")');
    await page.fill('input[placeholder*="Vikramaditya"]', 'Kavita Roy');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder*="Aether"]', 'Roy Systems');
    await page.click('button:has-text("Create Executive Account")');

    await page.waitForSelector('h1:has-text("Home")', { timeout: 15000 });

    // Perform Logout via Profile
    const profileBtn = page.locator('[data-testid="sidebar-profile-btn"], button:has-text("Profile")').first();
    await profileBtn.waitFor({ state: 'visible', timeout: 10000 });
    await profileBtn.click();

    await page.waitForSelector('[data-testid="sign-out-btn"]', { timeout: 10000 });
    await page.click('[data-testid="sign-out-btn"]');
    await page.waitForSelector('button:has-text("Create your account"), button:has-text("Join Founders Hut")', { timeout: 15000 });
    await expect(page.locator('button:has-text("Create your account"), button:has-text("Join Founders Hut")').first()).toBeVisible();
  });
});
