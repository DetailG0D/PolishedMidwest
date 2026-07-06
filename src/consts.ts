/**
 * Single source of truth for business info + booking links.
 * Edit here — every page reads from this file.
 */

/**
 * ⚠️ BOOKING URLS — every CTA on the site points at one of these three Fieldd
 * destinations. They are intentionally independent — don't collapse them.
 */
/** General "Book Now" CTAs */
export const FIELDD_BOOKING_URL = 'https://polishedmidwest.fieldd.co/';
/** "Book a Free Paint Inspection" CTAs (ceramic page + its sticky bar) */
export const CERAMIC_BOOKING_URL = 'https://polishedmidwest.fieldd.co/service/-2';
/** Recurring maintenance plans — Fieldd subscriptions deep link */
export const MAINTENANCE_BOOKING_URL = 'https://polishedmidwest.fieldd.co/subscriptions';

export const SITE = {
  name: 'Polished Midwest',
  legalName: 'Polished Midwest LLC',
  url: 'https://www.polishedmidwest.com',
  /** Default social-share image — replace file in /public/images/ (see CONTENT.md) */
  ogImage: '/images/og-default.jpg',
};

export const NAP = {
  name: 'Polished Midwest',
  phone: '(618) 900-1511',
  phoneHref: 'tel:+16189001511',
  email: 'luke.holas@gmail.com',
  city: 'Belleville',
  state: 'IL',
  stateFull: 'Illinois',
  zip: '62220', // TODO: confirm ZIP for schema (see CONTENT.md)
  /** Mobile / service-area business — no street address shown publicly */
  hours: 'Mon–Sat: 8 AM – 8 PM · Sun: Closed',
};

/** Towns listed for local SEO + the service-area sections */
export const SERVICE_AREAS = [
  'Belleville',
  'O’Fallon',
  'Shiloh',
  'Swansea',
  'Fairview Heights',
  'Mascoutah',
  'Millstadt',
  'Freeburg',
  'Columbia',
  'Waterloo',
  'Collinsville',
  'Edwardsville',
  'Glen Carbon',
  'Maryville',
  'Troy',
  'Caseyville',
];

export const INSTAGRAM_URL = 'https://www.instagram.com/polishedmidwest/';

export const GOOGLE_RATING = {
  value: '5.0',
  /** "35+" on purpose — doesn't go stale as reviews come in. Bump the floor occasionally. */
  count: '35+',
  /** Link to the Google Business Profile review page — powers "See More Reviews" */
  url: 'https://share.google/fr3D1s5NOndidcyNc',
};
