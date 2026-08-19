// @ts-check
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

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
const PLACEHOLDERS = { lastName: '-', foundUsReason: 'Our Website' };
// placeholder email is unique per submission (Fieldd merges leads sharing a
// field value): noemail+<epoch-ms><4 chars>@polishedmidwest.com
const EMAIL_RE = /^noemail\+\d+[a-z0-9]{4}@polishedmidwest\.com$/;

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
    await expect(shadowInput(page, 'emailID')).toHaveValue(EMAIL_RE);
    // the two visible fields must NOT invite saved-profile autofill.
    // "off" is ignored by Chrome for contact autofill when a saved profile
    // exists; "one-time-code" is honored and suppresses it (PR #4).
    await expect(shadowInput(page, 'firstName')).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(shadowInput(page, 'phone')).toHaveAttribute('autocomplete', 'one-time-code');
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
    expect(body.emailID).toMatch(EMAIL_RE);
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
    // Chromium contact autofill only engages on inputs whose autocomplete
    // token invites it (given-name/tel/etc.). With the fix the visible inputs
    // are one-time-code, which Chrome honors as "do not autofill contact
    // data" — we assert that precondition, then prove FormData still reads
    // the real typed values.
    const inviting = await page.evaluate(() => {
      const sr = document.querySelector('fieldd-lead-form').shadowRoot;
      const tokens = ['firstName', 'phone'].map((n) => sr.querySelector(`input[name="${n}"]`).getAttribute('autocomplete'));
      // only these two tokens are acceptable on the visible fields
      return tokens.filter((t) => t !== 'off' && t !== 'one-time-code');
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

  test('JUNK GUARD: first name "Test" is blocked — inline error, nothing POSTs', async ({ page }) => {
    await openModal(page);
    let posted = 0;
    await page.route(SUBMIT_URL, async (route) => { posted++; await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' }); });
    await shadowInput(page, 'firstName').fill('  Test ');
    await shadowInput(page, 'phone').fill('6185550142');
    await submitBtn(page).click();
    const err = page.locator('#pm-lead-error');
    await expect(err).toBeVisible();
    await expect(err).toHaveText('Please enter your real first name');
    await page.waitForTimeout(700); // give any (wrong) submit a chance to fire
    expect(posted, 'no POST to Fieldd may happen for a junk first name').toBe(0);
    await expect(page.locator('#pm-lead-overlay')).toBeVisible(); // still on the modal, not redirected
    // correcting the name clears the error and submits normally
    const captured = captureSubmit(page);
    await shadowInput(page, 'firstName').fill('Testerina');
    await expect(err).toBeHidden();
    await submitBtn(page).click();
    const body = await captured;
    expect(body.firstName).toBe('Testerina');
  });

  test('JUNK GUARD: a phone whose SHA-256 is in BLOCKED_PHONE_HASHES is rejected', async ({ browser }) => {
    // Runtime-computed hash of a dummy E.164 number, injected via the test
    // hook — no real number or hash is ever committed to the repo.
    const DUMMY = '+16185550999';
    const hex = createHash('sha256').update(DUMMY).digest('hex');
    const context = await browser.newContext();
    await context.addInitScript((h) => { window.__pmBlockedPhoneHashes = [h]; }, hex);
    const page = await context.newPage();
    await openModal(page);
    let posted = 0;
    await page.route(SUBMIT_URL, async (route) => { posted++; await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' }); });
    await shadowInput(page, 'firstName').fill('Marisol');
    await shadowInput(page, 'phone').fill('6185550999'); // -> +16185550999 via intl-tel-input
    await shadowInput(page, 'phone').blur(); // let the async hash precompute settle
    await expect.poll(async () => page.evaluate(() => !!document.querySelector('fieldd-lead-form'))).toBe(true);
    await page.waitForTimeout(300);
    await submitBtn(page).click();
    const err = page.locator('#pm-lead-error');
    await expect(err).toBeVisible();
    await expect(err).toHaveText('Please enter a valid phone number for your booking');
    await page.waitForTimeout(700);
    expect(posted, 'no POST to Fieldd may happen for a blocked phone').toBe(0);
    // a different number goes through
    const captured = captureSubmit(page);
    await shadowInput(page, 'phone').fill('6185550142');
    await shadowInput(page, 'phone').blur();
    await page.waitForTimeout(300);
    await submitBtn(page).click();
    const body = await captured;
    expect(body.phone).toBe('+16185550142');
    await context.close();
  });

  test('UNIQUE EMAIL: two submissions in fresh contexts carry two DIFFERENT placeholder emails', async ({ browser }) => {
    const emails = [];
    for (const who of [{ name: 'Anouk', phone: '6185550301' }, { name: 'Baptiste', phone: '6185550302' }]) {
      const context = await browser.newContext(); // fresh storage + memory
      const page = await context.newPage();
      await openModal(page);
      const captured = captureSubmit(page);
      await shadowInput(page, 'firstName').fill(who.name);
      await shadowInput(page, 'phone').fill(who.phone);
      await submitBtn(page).click();
      const body = await captured;
      expect(body.emailID).toMatch(EMAIL_RE);
      emails.push(body.emailID);
      await context.close();
    }
    expect(emails[0], 'placeholder emails must never collide across submissions').not.toBe(emails[1]);
  });
});
