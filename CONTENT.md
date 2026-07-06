# CONTENT.md — Everything you must fill in before launch

Nothing on this site ships with fake data. Every placeholder below is clearly
bracketed `[LIKE THIS]` in the code/pages so you can find it with a project-wide
search. **Search the repo for `[` and `TODO:` to verify nothing is left.**

---

## 1. Business info (src/consts.ts — one file, feeds every page)

| Item | Current value | What's needed |
|---|---|---|
| Phone | `(618) 900-1511` | ✅ Pulled from your old site — confirm it's still correct |
| Email | `luke.holas@gmail.com` | ✅ Set (contact page, footer schema source, /privacy, /terms) |
| Hours | Mon–Sat 8 AM–8 PM, Sun closed | ✅ Set (footer, contact page, and JSON-LD schema) |
| ZIP | `62220` | Confirm the ZIP used in the LocalBusiness schema |
| Service area towns | 16 Metro East towns | Review `SERVICE_AREAS` list — remove any you don't serve, add any missing |
| Google rating count | `35+` | ✅ Set. Shown as "35+" so it doesn't go stale — bump the floor in `src/consts.ts` as reviews grow (40+, 50+…) |
| Google reviews URL | share.google/fr3D1s5NOndidcyNc | ✅ Set — powers the "See More Reviews" button |

## 2. Fieldd booking links (src/consts.ts)

- `FIELDD_BOOKING_URL` — currently the Fieldd root: `https://polishedmidwest.fieldd.co/`
- `CERAMIC_BOOKING_URL` — currently the same root. **When you create a
  "Ceramic Coating / Free Paint Inspection" booking type in Fieldd, paste its
  deep link here** so ceramic ad traffic lands on the right service.
- `MAINTENANCE_BOOKING_URL` — ✅ done: Maintenance Plans CTAs (services page +
  home strip) go to `https://polishedmidwest.fieldd.co/subscriptions`.
- `public/_redirects` sends old `/get-quote` and `/bookonline` URLs to Fieldd —
  update those two lines too if the URL ever changes.

## 3. Photos — ✅ mostly done (real photos placed July 2026)

Real photos from your Site Files folder are optimized into `src/assets/photos/`
(originals untouched in Downloads). To add more: drop originals in the folder,
add a line to `scripts/optimize-images.mjs`, run `node scripts/optimize-images.mjs`.

**Photos you should still shoot (real gaps on the site):**
- **Water-beading close-up on a coated panel** — the classic ceramic money shot.
  The ceramic page currently proves gloss + water-spot removal but has no beading
  macro. Spray a coated hood, shoot the beads low-angle in sun.
- **Face-forward owner portrait** — the About page currently uses a work-in-action
  shot (washing the TRX). A friendly portrait next to the van converts better.
- **Machine-polishing under lights** — would strengthen the ceramic page's
  "prep is half the job" section.

**Service-area map:** ✅ done — lazy-loaded Google Maps embed on the home page
centered on Belleville with the Metro East / St. Louis metro in view, with the
town list kept as text for local SEO.

**Instagram:** ✅ gallery links to instagram.com/polishedmidwest (new tab).
Confirm that's the right handle.

**Logo:** ✅ placed in header + footer (optimized transparent WebP at
`public/images/polished-midwest-logo.webp`, generated from
`Downloads\Untitled design (3)_edited.png` by the optimize script).
**Confirm this is the final logo file.** The favicon is still the generic "P"
mark — want a favicon cut from the badge?

**Unused / flagged from your folder:**
- `IMG_9277.HEIC` — corrupt file, couldn't be opened. Re-export it if it matters.
- `3567040A-…JPEG` (+ its edited PNG) — dark split-shot of a truck panel with blue
  tape; couldn't tell what it shows confidently, so it wasn't used.
- `04 - IMG_0803(1).MOV` — video; not used (a static site hero video would hurt
  load speed). Could become social content.

**Site-wide**
- `public/images/og-default.jpg` — ✅ done (generated from the Supra hero shot)
- Favicons — ✅ done: badge favicon in all sizes (favicon.svg, logo_16/32/180.png),
  generated from the transparent logo by the optimize script

## 4. Reviews — ✅ done

Real verbatim Google reviews (Julia Yank, Shawn Cunningham, Connie Kappert on
the home page; Jonathan Scribner as the ceramic-page trust quote) live in
`src/data/reviews.ts` — edit/add there only, always verbatim. The
"See More Reviews" button links to the real Google reviews page
(share.google/fr3D1s5NOndidcyNc, set in `src/consts.ts`).

Notes:
- The ceramic-page quote is deliberately a *general* review presented without a
  service label — no existing review mentions ceramic coating. When a real
  ceramic customer leaves one, swap it into `CERAMIC_PAGE_REVIEW` (and consider
  asking your next coating client for a review that mentions the coating).
- Trust element reads "5.0 · 35+ Google reviews" — bump the floor in
  `src/consts.ts` as reviews grow.
- Optional later: replace the cards with a live Google-reviews widget
  (Elfsight/Trustmary) — note in `GoogleReviews.astro`.

## 5. Pricing — confirm the "starting at" numbers

The site intentionally shows NO itemized menu — high-level categories with
"starting at" prices only; the full menu lives in Fieldd. Numbers currently
on the site (confirm each before launch):

| Where | Item | Current | Status |
|---|---|---|---|
| Ceramic page | Clay & Coat | Starting at **$447** | Confirm |
| Ceramic page | 3 Year Protection | Starting at **$947** | Confirm |
| Services + Home ceramic card | Ceramic starting price | **$447** | ⚠️ I used the lowest ceramic package (Clay & Coat). If you want the featured ceramic price to be something else, change it in `src/pages/services.astro` and `src/pages/index.astro` |
| Services + Home | Interior Detailing | Starting at $127 | Confirm |
| Services + Home | Exterior Detailing | Starting at $127 | Confirm |
| Services + Home | Full Detail | Starting at $207 | Confirm |
| Services + Home | Maintenance Plans | Starting at $97 | Confirm |
| Services + Home | Dealership / Fleet | Custom · 3+ vehicles | Confirm wording |
| Ceramic page | Glass Coating add-on | $149 | ✅ Given — flat price shown (confirm it doesn't vary by vehicle) |
| Ceramic page | Wheel Coating add-on | $129 | ✅ Given — flat price shown (confirm it doesn't vary by vehicle) |

**Ceramic FAQ wording to confirm with the owner:**
- Shade question: answer says application needs a garage, carport, or shaded
  spot, and that a well-shaded area is fine if there's no garage — confirm
  that matches how Lucas actually handles it.
- Cure time: answer says ~24 hours to cure, keep the car dry and out of rain
  during that first day. Confirm any additional aftercare he gives customers
  (e.g. no washing for X days) — only the 24-hour/keep-dry facts are on the site.

## 6. Copy that needs the owner's voice

- **About page**: ✅ done — Lucas's bio (3 paragraphs, verbatim) is live
- **Home guarantee band**: wording is "walkthrough before we leave / we make it
  right" — confirm this matches the guarantee you actually offer (the /terms
  version is now the Service Agreement wording; the home band is looser)
- **Trust bar / claims**: the site claims "fully mobile", "25-mile service
  area", "owner answers the phone" — confirm all true

## 7. SEO odds and ends

- Domain in `astro.config.mjs` + `src/consts.ts` is `https://www.polishedmidwest.com`
  (www). If you serve the apex instead, change it in both places.
- `public/_redirects` holds the 301 map from the old Wix URLs — already done,
  review before launch.
- Old Wix Terms/Privacy PDFs (`/_files/ugd/...`) will 404 after migration. If
  you want them, add the PDFs to `public/` and link them in the footer.
- After launch: submit the sitemap in Google Search Console and update the
  website link on your Google Business Profile.

## 8. Legal pages (/privacy and /terms) — placeholders to fill

Both pages exist and are linked in the footer. They accurately describe the
stack (Meta Pixel, GoHighLevel chat, Fieldd booking, SMS with STOP opt-out,
Illinois governing law) but need these filled before launch — search each page
for `[PLACEHOLDER`:

| Item | Where | Status |
|---|---|---|
| Legal entity name | both pages | ✅ Polished Midwest LLC |
| Contact email | both pages + contact page | ✅ luke.holas@gmail.com |
| Cancellation/rescheduling policy | `/terms` | ✅ From the Service Agreement: $40 reschedule fee within 48 hrs; deposit non-refundable if cancelled within 4 days |
| Payment terms | `/terms` | ✅ From the Service Agreement: agreed Total Cost; $50 possible overrun fee (customer informed); deposits non-refundable per cancellation terms |
| Guarantee wording | `/terms` | ✅ From the Service Agreement: walkthrough before we leave; best-condition-possible standard (no full-restoration guarantee); 24-hour window to raise concerns |
| Effective dates | both pages | Currently July 5, 2026 — update if you launch later |
| Attorney review | both pages | Template only, not legal advice — have a lawyer review, especially SMS/TCPA + Meta Pixel disclosures |

**Intentionally left OUT of /terms** (not covered by the Service Agreement —
define these with the owner later, then add them to both the agreement and the
site):
- **Weather/rain policy** for a mobile service (what happens when it storms on
  appointment day).
- **Accepted payment methods and payment timing** (when payment is due,
  card/cash/app, ceramic deposits amount).
- **Ceramic coating warranty terms** — the site markets 1-year and 3-year
  coating warranties on the ceramic page, but the Service Agreement doesn't
  define warranty conditions or maintenance requirements. Worth formalizing so
  the marketing claim has terms behind it.

Note: the Privacy Policy states the site uses the Meta Pixel (✅ now installed
— see §9) and a GoHighLevel chat widget (still NOT installed — add it, or tell
me to, so the policy matches reality at launch).

## 9. Meta Pixel tracking — ✅ installed

- **Pixel ID:** `1495570652308586` (base code in `src/layouts/BaseLayout.astro`)
- **PageView** fires on every page of the site.
- **Lead** fires when any booking CTA is clicked (any link to
  polishedmidwest.fieldd.co — hero buttons, package CTAs, sticky mobile bar,
  header/footer booking links), just before the visitor is sent to Fieldd.
- **Limitation:** final bookings complete on Fieldd's separate domain, so this
  site can only track the *click* (Lead), not the confirmed booking. Tracking
  actual completed bookings (e.g. a "Schedule" or "Purchase" event) would
  require installing the pixel inside Fieldd, if their platform allows custom
  tracking scripts — worth asking Fieldd support.
- Verify events after launch with Meta's Events Manager / Test Events tab or
  the Meta Pixel Helper browser extension.
