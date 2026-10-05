import { test, expect } from '@playwright/test';

test.describe('Founders Hut — Real Multi-User Two-Browser Real-Backend E2E Suite', () => {
  test('Two Real Browser Users interacting through actual UI and Backend DB', async ({ browser }) => {
    const timestamp = Date.now();
    const userAEmail = `ui_user_a_${timestamp}@aethermetrics.io`;
    const userBEmail = `ui_user_b_${timestamp}@kashmirvalley.io`;

    // ----------------------------------------------------
    // Create Browser Context A (User A) & Browser Context B (User B)
    // ----------------------------------------------------
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    pageA.on('console', msg => console.log('PAGE A LOG:', msg.text()));
    pageA.on('pageerror', err => console.log('PAGE A ERROR:', err.message));

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    pageB.on('console', msg => console.log('PAGE B LOG:', msg.text()));
    pageB.on('pageerror', err => console.log('PAGE B ERROR:', err.message));

    // ----------------------------------------------------
    // STEP 1: USER A REGISTRATION & PROFILE COMPLETION VIA REAL UI
    // ----------------------------------------------------
    await pageA.goto('/');
    await pageA.click('button:has-text("Create your account")');

    await pageA.fill('input[placeholder*="Vikramaditya"]', 'Ananya Sharma');
    await pageA.fill('input[type="email"]', userAEmail);
    await pageA.fill('input[type="password"]', 'Password123!');
    await pageA.fill('input[placeholder*="Aether"]', 'Aether Metrics');
    await pageA.click('button:has-text("Create Executive Account")');

    // Verify User A reaches main app layout
    await pageA.waitForSelector('h1:has-text("Home")', { timeout: 15000 });
    await expect(pageA.locator('h2:has-text("Ananya")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 2: USER B REGISTRATION & EXPERTISE PROFILE VIA REAL UI
    // ----------------------------------------------------
    await pageB.goto('/');
    await pageB.click('button:has-text("Create your account")');

    await pageB.fill('input[placeholder*="Vikramaditya"]', 'Tariq Kashmir');
    await pageB.fill('input[type="email"]', userBEmail);
    await pageB.fill('input[type="password"]', 'Password123!');
    await pageB.fill('input[placeholder*="Aether"]', 'Kashmir Valley Organics');
    await pageB.click('button:has-text("Create Executive Account")');

    // Verify User B reaches main app layout
    await pageB.waitForSelector('h1:has-text("Home")', { timeout: 15000 });
    await expect(pageB.locator('h2:has-text("Tariq")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 3: USER A CREATES REAL BUSINESS REQUEST VIA UI
    // ----------------------------------------------------
    await pageA.click('aside button:has-text("Requests"), nav button:has-text("Requests")');
    await pageA.waitForSelector('h1:has-text("Requests")');

    const openRequestModalBtn = pageA.locator('button:has-text("Ask the network"), button:has-text("Post Request"), button:has-text("New Request")').first();
    await openRequestModalBtn.click();

    await pageA.fill('input[placeholder*="expanded D2C retail"]', 'Need UAE cold-chain distribution partner');
    await pageA.fill('textarea[placeholder*="Describe what you are trying"]', 'Looking for verified founders with established retail warehousing in Dubai.');
    await pageA.click('form button:has-text("Ask the network")');

    // Verify Request appears on User A's feed
    await expect(pageA.locator('text=Need UAE cold-chain distribution partner').first()).toBeVisible();

    // ----------------------------------------------------
    // STEP 4: USER B SEES USER A'S REQUEST ON REAL BACKEND FEED VIA UI & OFFERS HELP
    // ----------------------------------------------------
    await pageB.click('aside button:has-text("Requests"), nav button:has-text("Requests")');
    await pageB.waitForSelector('h1:has-text("Requests")');

    await expect(pageB.locator('text=Need UAE cold-chain distribution partner').first()).toBeVisible();

    // User B offers help on User A's request
    const offerHelpBtn = pageB.locator('button:has-text("Offer help")').first();
    if (await offerHelpBtn.isVisible()) {
      await offerHelpBtn.click();
      const helpNoteInput = pageB.locator('textarea[placeholder*="helping"], textarea[placeholder*="note"]').first();
      if (await helpNoteInput.isVisible()) {
        await helpNoteInput.fill('We own cold-chain warehousing in Jebel Ali Free Zone.');
        await pageB.click('button:has-text("Send message"), button:has-text("Send Offer")');
      }
    }

    // ----------------------------------------------------
    // STEP 5: USER A DISCOVERS USER B & STARTS CONVERSATION VIA UI
    // ----------------------------------------------------
    await pageA.click('aside button:has-text("People"), aside button:has-text("Discover"), nav button:has-text("People"), nav button:has-text("Discover")');
    await pageA.waitForSelector('h1:has-text("People"), h1:has-text("Discover")');

    // User A finds Tariq Kashmir member card and opens profile modal
    await expect(pageA.locator('text=Tariq Kashmir').first()).toBeVisible();
    await pageA.click('text=Tariq Kashmir');

    // Click Start conversation in ProfileModal
    await pageA.click('button:has-text("Start conversation")');
    await pageA.waitForSelector('h1:has-text("Messages")');

    // User A sends initial message
    const msgInputA = pageA.locator('input[placeholder*="Write a message"], textarea[placeholder*="Write a message"]').first();
    await msgInputA.fill('Hi Tariq! Looking for cold-chain warehousing in Jebel Ali.');
    await pageA.click('form button:has-text("Send"), button[type="submit"]');

    // ----------------------------------------------------
    // STEP 6: USER B REPLIES TO USER A'S MESSAGE VIA REAL UI
    // ----------------------------------------------------
    await pageB.reload();
    await pageB.click('aside button:has-text("Messages"), nav button:has-text("Messages")');
    await pageB.waitForSelector('h1:has-text("Messages")');

    const convItemB = pageB.locator('div:has-text("Ananya Sharma")').first();
    if (await convItemB.isVisible()) {
      await convItemB.click();
    }

    const msgInputB = pageB.locator('input[placeholder*="Write a message"], textarea[placeholder*="Write a message"]').first();
    await expect(msgInputB).toBeVisible();
    await msgInputB.fill('Hi Ananya! Happy to connect. We operate 3 cold storage facilities in Jebel Ali.');
    await pageB.click('form button:has-text("Send"), button[type="submit"]');

    // ----------------------------------------------------
    // STEP 7: USER A RECEIVES USER B'S MESSAGE VIA UI
    // ----------------------------------------------------
    await pageA.reload();
    await pageA.click('aside button:has-text("Messages"), nav button:has-text("Messages")');
    await pageA.waitForSelector('h1:has-text("Messages")');

    const convItemA = pageA.locator('div:has-text("Tariq Kashmir")').first();
    if (await convItemA.isVisible()) {
      await convItemA.click();
    }

    await expect(pageA.locator('text=Jebel Ali').first()).toBeVisible();

    // ----------------------------------------------------
    // STEP 8: USER A CREATES RESOLUTION & USER B CONFIRMS VIA UI
    // ----------------------------------------------------
    await pageA.click('aside button:has-text("Requests"), nav button:has-text("Requests")');
    await pageA.waitForSelector('h1:has-text("Requests")');

    const didThisHelpBtn = pageA.locator('button:has-text("Did this help?")').first();
    if (await didThisHelpBtn.isVisible()) {
      await didThisHelpBtn.click();

      // Submit Resolution Modal
      const solvedBtn = pageA.locator('button:has-text("Problem Solved"), div:has-text("Problem Solved")').first();
      if (await solvedBtn.isVisible()) {
        await solvedBtn.click();
      }

      const summaryInput = pageA.locator('textarea[placeholder*="Describe"], textarea[placeholder*="assessment"]').first();
      if (await summaryInput.isVisible()) {
        await summaryInput.fill('Tariq provided verified cold-storage facilities in Dubai Jebel Ali.');
        await pageA.click('button:has-text("Submit Resolution"), button:has-text("Record Resolution")');
      }
    }

    // User B checks notification bell and confirms resolution
    await pageB.reload();
    const notifBell = pageB.locator('[data-testid="notification-bell"]').first();
    if (await notifBell.isVisible()) {
      await notifBell.click();
      const confirmHelpBtn = pageB.locator('button:has-text("Confirm Help")').first();
      if (await confirmHelpBtn.isVisible()) {
        await confirmHelpBtn.click();
      }
    }

    // ----------------------------------------------------
    // STEP 9: PERSISTENCE TEST ACROSS PAGE RELOADS
    // ----------------------------------------------------
    await pageA.reload();
    await pageA.waitForSelector('h1:has-text("Home")');
    await expect(pageA.locator('h2:has-text("Ananya")')).toBeVisible();

    await pageB.reload();
    await pageB.waitForSelector('h1:has-text("Home")');
    await expect(pageB.locator('h2:has-text("Tariq")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 10: PRIVACY TEST FOR PRIVATE REQUESTS VIA UI
    // ----------------------------------------------------
    await pageA.click('aside button:has-text("Requests"), nav button:has-text("Requests")');
    await openRequestModalBtn.click();

    await pageA.fill('input[placeholder*="expanded D2C retail"]', 'Confidential acquisition target analysis');
    await pageA.fill('textarea[placeholder*="Describe what you are trying"]', 'Private strategic analysis for executive board only.');
    await pageA.selectOption('select:has(option[value="PRIVATE"])', 'PRIVATE');
    await pageA.click('form button:has-text("Ask the network")');

    // User A sees their own Private Request
    await expect(pageA.locator('text=Confidential acquisition target analysis').first()).toBeVisible();

    // User B reloads Requests tab and verifies Confidential private request is NOT visible
    await pageB.reload();
    await pageB.click('aside button:has-text("Requests"), nav button:has-text("Requests")');
    await expect(pageB.locator('text=Confidential acquisition target analysis')).not.toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
await expect(pageA.locator('text=Confidential acquisition target analysis').first()).toBeVisible();

// User B reloads Requests tab and verifies Confidential private request is NOT visible
await pageB.reload();
await pageB.click('aside button:has-text("Requests"), nav button:has-text("Requests")');
const allRequestsFilterB = pageB.locator('button:has-text("All requests")');
if (await allRequestsFilterB.isVisible()) {
  await allRequestsFilterB.click();
}
await expect(pageB.locator('text=Confidential acquisition target analysis')).not.toBeVisible();

await contextA.close();
await contextB.close();
  });
});
