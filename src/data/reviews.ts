/**
 * REAL Google reviews — verbatim from the "Polished Midwest" Google Business
 * Profile. Edit/add reviews here only. Never paraphrase or invent review text.
 * All are 5-star reviews.
 */
export interface Review {
  quote: string;
  name: string;
}

/** Home page — 3-card reviews section */
export const HOME_REVIEWS: Review[] = [
  {
    name: 'Julia Yank',
    quote:
      'Lucas does an amazing job! The process is seamless from start to finish. I would highly recommend Polished Midwest. I have a pup who sheds and my car is spotless. They also come directly to you!',
  },
  {
    name: 'Shawn Cunningham',
    quote:
      'Lucas from Polished Midwest did an exceptional full detail and engine bay clean on my Audi Q5. His attention to detail and thoroughness rivals the brick and mortar detail shops. I will be booking him again to do the same on my Mercedes.',
  },
  {
    name: 'Connie Kappert',
    quote:
      'I highly recommend Polished Midwest & Lucas. He is such a hard worker. My car looks brand new. As a Realtor, I live in my car. It was a real mess. I can now allow people to ride with me. lol',
  },
];

/**
 * Ceramic page trust quote. NOTE: this is a real GENERAL detailing review —
 * no existing review mentions ceramic coating, so it is deliberately presented
 * as a plain customer review, NOT labeled as a ceramic review. Swap in a real
 * ceramic-customer review when one exists.
 */
export const CERAMIC_PAGE_REVIEW: Review = {
  name: 'Jonathan Scribner',
  quote:
    "I had my truck detailed by Polished Midwest (Lucas), and I couldn't be more impressed. He did an outstanding job, extremely thorough and detail-oriented from start to finish.",
};
