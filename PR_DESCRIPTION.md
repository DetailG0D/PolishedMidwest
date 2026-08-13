# Lead-capture modal gating the Fieldd booking links

Gates every Fieldd booking CTA behind a two-field lead form (First Name +
Phone) using Fieldd's own `<fieldd-lead-form>` embed, so leads land directly
in Fieldd before the visitor continues to the booking flow. Falls back to
plain links in every failure mode — the gate can never block a booking.

**Files:** `src/components/LeadCaptureModal.astro` (new), `functions/api/lead.js` (new), `src/layouts/BaseLayout.astro` (listener moved into the modal)

---

## Fieldd component investigation (source of https://fieldd.me/lead-form, fetched 2026-07-06, 73KB)

1. **DOM mode:** `attachShadow({mode:"open"})` — **open shadow root**, internals fully reachable via `el.shadowRoot`. Element registered as `fieldd-lead-form` (alias `lead-form`).
2. **Network:** on mount it fetches company config `GET https://api.fieldd.co/lead-form/company/{code}` (headers `api_key` — baked into the script — and `companyId`). Submit is `POST https://api.fieldd.co/lead-form/submit` with JSON body `{firstName, lastName, emailID, phone, foundUsReason, companyId, ...customInputs}` and the same headers. Phone is normalized to E.164 via intl-tel-input's `getNumber()` before sending. Success response shape: `{success: true}`.
3. **Validation:** the form is created with `novalidate`; on submit the component calls `form.checkValidity()` / `reportValidity()` (all five fields carry `required`), plus intl-tel-input `isValidNumber()` for the phone. Errors render via a `data-error` attribute — no popup. **Values are read with `new FormData(form)`**, so programmatic `.value` assignment satisfies validation (we still dispatch `input`/`change` for its "touched" styling).
4. **On success:** re-renders the form and shows an in-shadow success popup (`<h2>` title + `<p>` + reset button) built with hashed CSS-module classes. **No custom DOM event, no redirect.** Detection therefore uses (a) a `window.fetch` wrapper watching `/lead-form/submit` for a 2xx `{success:true}` (primary) and (b) a MutationObserver for the popup `<h2>` (backup) — not class names, which are hash-unstable.
5. **Attributes:** `observedAttributes = ["code"]` — `code` is the only reactive attribute.
6. **Its own external deps:** api.fieldd.co, cdnjs.cloudflare.com (intl-tel-input v22 + utils), fonts.googleapis.com. Relevant if a CSP is ever added — **this repo currently sets no CSP** in `public/_headers` (verified), so no header change was needed.

## Implementation notes

- **Interception:** one capture-phase delegated listener on `a[href*="fieldd.co"]` (all pages — header, heroes, cards, sticky bars, footer). Modifier/middle clicks and `target="_blank"` links pass through. `pm_lead_captured=1` visitors always pass through.
- **Lazy load:** the Fieldd script injects on first `pointerover`/`touchstart` of a booking CTA (note: `pointerenter` doesn't bubble, so `pointerover` is used), with a fallback injection on first intercepted click. Never in the global head.
- **Doctoring (internals confirmed reachable at runtime before use):** hides + autofills Last Name (`-`), Email (`noemail@polishedmidwest.com`), and the "How did you find us?" select (picks the option matching /website/i from the live config — resolves to **"Our Website"** for this account — else the first real option). Visible: First Name + Phone. Sets `inputmode=tel`/`autocomplete`, relabels submit to **"Continue to Booking"**, injects a shadow stylesheet matching the site (ink surfaces, brand `#2882FD`, 6px radius, inherited fonts), autofocuses First Name.
- **Fallbacks (gate never blocks):** script `onerror`, custom element never defined, config fetch dead, or `firstName` input absent after 6s → modal closes, click-tracking fires, and the visitor is sent straight to their original destination; the gate then stays off for the session (`broken` flag). The always-present "Continue to booking →" link is the manual safety net; a `SHOW_SKIP_LINK = false` const controls the optional low-contrast skip link.
- **Success:** sets `pm_lead_captured=1`, shows "Taking you to booking…", redirects after 800ms.
- **⚠️ Deliberate deviation:** success redirects to the **original CTA's href**, not always the Fieldd root — a gated click on the ceramic "Book a Free Paint Inspection" CTA continues to `/service/-2`, and Maintenance to `/subscriptions`. Redirecting everyone to the root (as literally specced) would break those deep links.

## Tracking (follows the established Pixel + CAPI pattern)

The sitewide booking-CTA click listener **moved from BaseLayout into the modal
component** so Lead can't double-fire. The `window.__pm` visitor-ID block and
Pixel init in BaseLayout are untouched.

- **Pass-through clicks** (captured visitors, broken gate, modifier clicks): browser `Lead` on click — unchanged behavior.
- **Gated clicks:** `Lead` fires on **successful form submit** instead, using the established dual pattern: browser Pixel with `eventID` + server mirror via the new **`functions/api/lead.js`** Pages Function (a sibling of `paint-inspection-click.js` — same payload contract, same `META_CAPI_ACCESS_TOKEN` / `META_TEST_EVENT_CODE` env vars, `event_name: 'Lead'`, hashed `external_id`, fbp/fbc forwarding, sendBeacon with fetch-keepalive fallback).
- **PaintInspectionClick** keeps click semantics in **both** paths (browser + `/api/paint-inspection-click` CAPI mirror with shared event_id), exactly as on main.
- `gtag('event','generate_lead')` fires behind a `typeof` guard (no GA installed today).

Note: the earlier local working copy predated `functions/api` — this branch is
built on current `main` (afe14b4) and reuses that infrastructure as intended.

## What I verified (live, local dev server)

- `npm run build` passes (9 pages).
- Click on a booking CTA is intercepted: no navigation, modal opens with correct copy; Fieldd script lazy-injects and the real component loaded **live** — open shadow root confirmed at runtime.
- Doctoring verified against the real rendered form: lastName/emailID/foundUsReason hidden with values `-` / `noemail@polishedmidwest.com` / `Our Website`; First Name + Phone (type=tel, intl-tel-input) visible; submit reads "Continue to Booking"; First Name autofocused.
- ESC / backdrop / X close; focus returns to the triggering CTA; body scroll unlocks; modal reopens cleanly.
- Ctrl-click passes through unintercepted. `pm_lead_captured=1` skips the modal (a synthetic pass-through click genuinely navigated the tab to polishedmidwest.fieldd.co).
- Ceramic CTA interception preserves the `/service/-2` deep link as the continue/redirect destination.
- `window.fetch` wrapper installs while the modal is open and restores on close.
- Mobile 375px: bottom sheet (full-width, bottom-anchored, top-rounded, blurred backdrop), no horizontal overflow.

## What I could NOT verify (needs your QA on the Pages preview)

- **An actual submission** — I didn't submit the form, since that creates a real lead in your Fieldd account; the success path (fetch detection → Lead events → redirect) is source-verified but not exercised end-to-end.
- `/api/lead` CAPI delivery — Pages Functions don't run in the local static preview; test on the Pages preview with `META_TEST_EVENT_CODE` set (it no-ops with 202 until `META_CAPI_ACCESS_TOKEN` exists, same as the existing function).
- Script-blocked fallback in a real browser (code path exists and is guarded; simulate with an adblocker or DevTools request blocking on `fieldd.me`).
- Real screenshots — the sandbox couldn't composite frames this session; all visual checks above are DOM/computed-style based.
- Cross-browser (Safari iOS especially, given intl-tel-input's fullscreen country picker).

## QA checklist (run on the Cloudflare Pages preview)

- [ ] Clear localStorage; click each CTA type: header Book Now, home hero, services cards, Maintenance Plans, ceramic hero + sticky bar → modal opens each time, page doesn't navigate
- [ ] Modal shows only First Name + Phone; Last Name / Email / "How did you find us?" stay hidden
- [ ] Submit with first name **TEST DELETE** + your cell → lead appears in Fieldd admin with lastName "-", email noemail@polishedmidwest.com, source "Our Website", E.164 phone
- [ ] "Taking you to booking…" shows, then redirects (~0.8s) to the **same destination you clicked** (ceramic CTA → /service/-2)
- [ ] Meta Events Manager (Test Events): one deduped Lead pair (browser + server) on the successful submit, none on the initial gated click; PaintInspectionClick still dual-fires on ceramic CTA clicks
- [ ] Reload after submitting → clicking any CTA goes straight to Fieldd, no modal
- [ ] Block `fieldd.me` in DevTools (Network request blocking), clear localStorage, click a CTA → brief loading state, then lands on Fieldd anyway
- [ ] Phone validation: submit with a junk phone → inline error, no navigation
- [ ] Mobile: bottom sheet slides over content, backdrop blurs, X/backdrop close it, sticky Book bar still works
- [ ] ESC closes; Tab stays inside the modal; focus returns to the button you clicked
- [ ] Delete the TEST DELETE lead from Fieldd when done

🤖 Generated with [Claude Code](https://claude.com/claude-code)
