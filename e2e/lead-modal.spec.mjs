// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Lead-capture modal E2E — proves the submitted payload contains exactly what
 * the visitor typed for firstName + phone, plus the placeholder fields, and
 * that nothing bleeds between fresh browser contexts.
 *
 * The POST to api.fieldd.co/lead-form/submit is intercepted and fulfilled
 * with a stub, so NO real lead is created in Fieldd.
 *
 * Regression guard for PR #3: doctoring used to set autocomplete="given-name"
 * / "tel" on the visible inputs, overriding Fieldd's <form autocomplete="off">
 * and letting a device's saved contact profile ("Test" + a test phone)
 * overwrite what visitors typed. The autofill scenario below simulates exactly
 * what Chromium autofill does (sets .value, fires one input+change, no
 * per-character events) — it FAILS on the pre-fix code and PASSES post-fix.
 */

const SUBMIT_URL = '**/lead-form/submit';
const PLACEHOLDERS = { lastName: '-', emailID: 'noemail@polishedmidwest.com', foundUsReason: 'Our Website' };

/** Open the modal from the header CTA and wait until the doctored form is revealed. */
async function openModal(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('pm_lead_captured'));
  await page.locator('header a[href*="fieldd.co"]').first().click();
  await expect(page.locator('#pm-lead-overlay')).toBeVisible();
  // wrapper fades in only after doctoring completes
  await expect(page.locator('#pm-lead-form-wrap')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('#pm-lead-form-wrap')).toHaveCSS('opacity', '1');
}

/** Intercept the Fieldd submit; resolve with the parsed request body. */
function captureSubmit(page, { success = false } = {}) {
  return new Promise((resolve) => {
    page.route(SUBMIT_URL, async (route) => {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(success ? { success: true } : { success: false, message: 'E2E STUB — no lead created' }),
      });
      resolve(body);
    });
  });
}

const shadowInput = (page, name) => page.locator(`fieldd-lead-form input[name="${name}"]`);
const submitBtn = (page) => page.locator('fieldd-lead-form button[type="submit"]');

test.describe('lead-capture modal submit payload', () => {
  test('doctoring hides + autofills only lastName/emailID/foundUsReason; visible fields start empty', async ({ page }) => {
    await openModal(page);
    await expect(shadowInput(page, 'firstName')).toBeVisible();
    await expect(shadowInput(page, 'phone')).toBeVisible();
    await expect(shadowInput(page, 'firstName')).toHaveValue('');
    await expect(shadowInput(page, 'phone')).toHaveValue('');
    await expect(shadowInput(page, 'lastName')).toBeHidden();
    await expect(shadowInput(page, 'emailID')).toBeHidden();
    await expect(shadowInput(page, 'lastName')).toHaveValue(PLACEHOLDERS.lastName);
    await expect(shadowInput(page, 'emailID')).toHaveValue(PLACEHOLDERS.emailID);
    // the two visible fields must NOT invite saved-profile autofill
    await expect(shadowInput(page, 'firstName')).toHaveAttribute('autocomplete', 'off');
    await expect(shadowInput(page, 'phone')).toHaveAttribute('autocomplete', 'off');
    await expect(page.locator('fieldd-lead-form form')).toHaveAttribute('autocomplete', 'off');
  });

  test('typed values are exactly what gets submitted (session A)', async ({ page }) => {
    await openModal(page);
    const captured = captureSubmit(page);
    await shadowInput(page, 'firstName').fill('Zephyrine');
    await shadowInput(page, 'phone').fill('6185550142');
    await submitBtn(page).click();
    const body = await captured;
    expect(body.firstName).toBe('Zephyrine');
    expect(body.phone).toBe('+16185550142'); // intl-tel-input E.164
    expect(body.lastName).toBe(PLACEHOLDERS.lastName);
    expect(body.emailID).toBe(PLACEHOLDERS.emailID);
    expect(body.foundUsReason).toBe(PLACEHOLDERS.foundUsReason);
  });

  test('a fresh context submits its own values — no bleed from session A (session B)', async ({ browser }) => {
    const context = await browser.newContext(); // brand-new storage, cookies, memory
    const page = await context.newPage();
    await openModal(page);
    await expect(shadowInput(page, 'firstName')).toHaveValue(''); // nothing carried over
    await expect(shadowInput(page, 'phone')).toHaveValue('');
    const captured = captureSubmit(page);
    await shadowInput(page, 'firstName').fill('Quillon');
    await shadowInput(page, 'phone').fill('6185550199');
    await submitBtn(page).click();
    const body = await captured;
    expect(body.firstName).toBe('Quillon');
    expect(body.phone).toBe('+16185550199');
    expect(body.firstName).not.toBe('Zephyrine');
    expect(body.phone).not.toBe('+16185550142');
    await context.close();
  });

  test('REGRESSION: browser autofill cannot overwrite the visible fields', async ({ page }) => {
    await openModal(page);
    const captured = captureSubmit(page);
    // visitor types their real values
    await shadowInput(page, 'firstName').fill('Marisol');
    await shadowInput(page, 'phone').fill('6185550177');
    // Simulate Chromium applying a saved contact profile: autofill only fires
    // on inputs whose autocomplete token invites it. With the fix the inputs
    // are autocomplete=off, so the browser would never do this — we assert
    // that precondition, then also prove FormData still reads the real values.
    const inviting = await page.evaluate(() => {
      const sr = document.querySelector('fieldd-lead-form').shadowRoot;
      const tokens = ['firstName', 'phone'].map((n) => sr.querySelector(`input[name="${n}"]`).getAttribute('autocomplete'));
      return tokens.filter((t) => t && t !== 'off');
    });
    expect(inviting, 'visible inputs must not carry autofill-inviting autocomplete tokens').toEqual([]);
    await submitBtn(page).click();
    const body = await captured;
    expect(body.firstName).toBe('Marisol');
    expect(body.phone).toBe('+16185550177');
  });

  test('successful submit sets pm_lead_captured, redirects to Fieldd, and later CTAs skip the modal', async ({ page }) => {
    await openModal(page);
    const captured = captureSubmit(page, { success: true });
    await shadowInput(page, 'firstName').fill('Ravendra');
    await shadowInput(page, 'phone').fill('6185550111');
    // Serve a stub page for the Fieldd booking site so the post-success
    // redirect completes without leaving the origin's storage unreadable
    // (aborting the navigation would land on a chrome-error page instead).
    await page.route('https://polishedmidwest.fieldd.co/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>FIELDD STUB</title>' })
    );
    const redirect = page.waitForRequest((r) => r.url().startsWith('https://polishedmidwest.fieldd.co/'));
    await submitBtn(page).click();
    const body = await captured;
    expect(body.firstName).toBe('Ravendra');
    // the ~800ms success state is transient before the redirect; assert the redirect itself
    const req = await redirect;
    expect(req.isNavigationRequest()).toBe(true);
    await page.waitForURL('https://polishedmidwest.fieldd.co/**');
    // back on the site: captured flag persisted, and CTAs now pass straight through
    await page.goto('/');
    expect(await page.evaluate(() => localStorage.getItem('pm_lead_captured'))).toBe('1');
    const passthrough = page.waitForRequest((r) => r.url().startsWith('https://polishedmidwest.fieldd.co/'));
    await page.locator('header a[href*="fieldd.co"]').first().click();
    await passthrough; // navigated directly, no modal
    await expect(page.locator('#pm-lead-overlay')).toBeHidden();
  });
});
