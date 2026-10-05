import { test, expect } from '@playwright/test';

test.describe('Founders Hut — Share an Idea Real Browser Regression Suite', () => {
  test('Share an Idea flow publishes post via UI and persists across page reloads', async ({ browser }) => {
    const timestamp = Date.now();
    const email = `share_idea_user_${timestamp}@aethermetrics.io`;
    const uniqueIdeaText = `Grounded founder insight #${timestamp}: Scaling D2C cold-chain in Jebel Ali required direct logistics verification.`;
    const uniqueArticleTitle = `Operational Playbook ${timestamp}`;
    const uniqueArticleBody = `Detailed founder analysis of Series A capital efficiency #${timestamp}.`;

    const context = await browser.newContext();
    const page = await context.newPage();

    // ----------------------------------------------------
    // STEP 1: REGISTER & ENTER HOME VIEW VIA REAL UI
    // ----------------------------------------------------
    await page.goto('/');
    await page.click('button:has-text("Create your account")');

    await page.fill('input[placeholder*="Vikramaditya"]', 'Vikram Oberoi');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder*="Aether"]', 'Aether Logistics');
    await page.click('button:has-text("Create Executive Account")');

    await page.waitForSelector('h1:has-text("Home")', { timeout: 15000 });
    await expect(page.locator('h2:has-text("Vikram")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 2: CLICK "SHARE AN IDEA" CTA & VERIFY POSTCOMPOSER MODAL OPENS
    // ----------------------------------------------------
    await page.click('button:has-text("Share an idea")');

    // Verify PostComposer modal header opens
    await page.locator('h2:has-text("Share an idea or insight")').waitFor();
    await expect(page.locator('h2:has-text("Share an idea or insight")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 3: PUBLISH SHORT POST VIA UI
    // ----------------------------------------------------
    await page.fill('textarea[placeholder*="What is on your mind"]', uniqueIdeaText);

    const publishBtn = page.locator('button[type="submit"]:has-text("Publish")');
    await publishBtn.click();

    // Verify PostComposer modal closes
    await expect(page.locator('h2:has-text("Share an idea or insight")')).not.toBeVisible();

    // Verify the unique post appears directly on the Home feed
    await expect(page.locator(`text=${uniqueIdeaText}`).first()).toBeVisible();

    // ----------------------------------------------------
    // STEP 4: VERIFY PERSISTENCE AFTER RELOAD
    // ----------------------------------------------------
    await page.reload();
    await page.waitForSelector('h1:has-text("Home")');
    await expect(page.locator(`text=${uniqueIdeaText}`).first()).toBeVisible();

    // ----------------------------------------------------
    // STEP 5: PUBLISH ARTICLE POST TYPE VIA UI
    // ----------------------------------------------------
    await page.click('button:has-text("Share an idea")');
    await page.locator('h2:has-text("Share an idea or insight")').waitFor();

    // Switch to Article tab
    await page.click('button:has-text("Article")');
    await page.fill('input[placeholder*="Article Title"]', uniqueArticleTitle);
    await page.fill('textarea[placeholder*="Write your article thoughts"]', uniqueArticleBody);

    await page.click('button[type="submit"]:has-text("Publish")');

    // Verify Article title & body appear on Home feed
    await expect(page.locator(`text=${uniqueArticleTitle}`).first()).toBeVisible();
    await expect(page.locator(`text=${uniqueArticleBody}`).first()).toBeVisible();

    // Verify persistence after reload
    await page.reload();
    await page.waitForSelector('h1:has-text("Home")');
    await expect(page.locator(`text=${uniqueArticleTitle}`).first()).toBeVisible();

    await context.close();
  });
});
await context.close();
  });
});
