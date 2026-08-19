/**
 * ============================================================================
 * EXPERT ADVISOR CATALOG — 12 systems
 * ============================================================================
 *
 * COVER IMAGE
 *   Put the square cover art at:  public/assets/images/ea/<slug>.png
 *   (.jpg / .jpeg / .webp also work — the build auto-detects the extension).
 *   No image on disk = the card and hero render without artwork, nothing
 *   breaks. Drop the file in, rebuild, done.
 *
 * TEXT COMES LATER
 *   Every entry currently ships with EMPTY copy (tagline/overview/…).
 *   Empty sections are simply not rendered, so the site is presentable now.
 *   Fill i18n.en (and optionally i18n.ja etc.) per system, then remove
 *   `placeholder: true` to clear the build warning.
 *
 * FIELD RULES (enforced by the templates)
 *   status:  'released' | 'upcoming' (Coming-soon badge) | 'draft' (not built)
 *   price:   'free' | 'paid' | null (badge hidden while unknown)
 *   any spec field = null → that row is not rendered
 *   backtests: [] → the whole backtest section shows "Data pending publication"
 *   mql5Url: '' → every MQL5 CTA for that system is hidden
 * ============================================================================
 */

/** Shared defaults so each entry only states what differs. */
const make = (o) => {
  const base = {
    status: 'released',
    placeholder: true, // copy not written yet — remove per entry when done
    image: null, // auto-resolved by the build from public/assets/images/ea/<slug>.*
    mql5Url: '',
    video: { type: null, id: null, src: null, poster: null },
    backtests: [],
    parameters: [],
    versions: [],
    timeline: [],
    ...o,
  };
  base.spec = {
    market: 'Forex',
    symbol: null,
    timeframe: null,
    strategy: 'Scalping',
    risk: null,
    version: null,
    releaseDate: null,
    price: null,
    platform: 'MetaTrader 5',
    minDeposit: null,
    accountType: null,
    leverage: null,
    vps: null,
    ...(o.spec || {}),
  };
  base.i18n = {
    ...(o.i18n || {}),
    en: {
      tagline: '',
      overview: '',
      concept: '',
      strategy: '',
      logic: '',
      riskManagement: '',
      environment: '',
      params: {},
      versionNotes: {},
      timelineNotes: {},
      ...((o.i18n || {}).en || {}),
    },
  };
  return base;
};

export const EA = [
  make({
    slug: 'joker',
    name: 'JOKER',
    number: '01',
    /** Cover: green/orange cyber — GOLD scalper. */
    spec: { market: 'Gold', symbol: 'XAUUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'jayro',
    name: 'JAYRO',
    number: '02',
    /** Cover: red/teal — dual-pair martingale. Risk is set high by design. */
    spec: { symbol: 'GBPUSD / USDJPY', strategy: 'Ultra Martingale', risk: 'high' },
    /** Chart replay of the backtest. Encoded by tools/encode-ea-video.mjs. */
    video: {
      type: 'file',
      src: '/assets/videos/ea/jayro.mp4',
      poster: '/assets/posters/ea/jayro.jpg',
    },
  }),

  make({
    slug: 'grandslam',
    name: 'GRANDSLAM',
    number: '03',
    /** Cover: gold samurai — BTCUSD scalper. */
    spec: { market: 'Crypto', symbol: 'BTCUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'godspeed',
    name: 'GODSPEED',
    number: '04',
    spec: { symbol: 'GBPJPY', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'galoa',
    name: 'GALOA',
    number: '05',
    spec: { symbol: 'USDJPY', strategy: 'Japan Original Scalping' },
    /** 21-minute chart replay with the equity curve in the lower pane. */
    video: { type: 'file', src: '/assets/videos/ea/galoa.mp4', poster: '/assets/posters/ea/galoa.jpg' },
  }),

  make({
    slug: 'cosmos',
    name: 'COSMOS',
    number: '06',
    spec: { market: 'Crypto', symbol: 'BTCUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'kokomo',
    name: 'KOKOMO',
    number: '07',
    spec: { symbol: 'EURUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'metro',
    name: 'METRO',
    number: '08',
    spec: { symbol: 'GBPUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'mirumo',
    name: 'MIRUMO',
    number: '09',
    spec: { symbol: 'USDJPY', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'sena',
    name: 'SENA',
    number: '10',
    spec: { market: 'Gold', symbol: 'XAUUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'rina',
    name: 'RINA',
    number: '11',
    spec: { market: 'Gold', symbol: 'XAUUSD', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'nexus',
    name: 'NEXUS',
    number: '12',
    spec: { market: 'Crypto', symbol: 'BTCUSD', strategy: 'Japan Original Scalping' },
    video: { type: 'file', src: '/assets/videos/ea/nexus.mp4', poster: '/assets/posters/ea/nexus.jpg' },
  }),

  make({
    slug: 'evergreen',
    name: 'EVERGREEN',
    number: '13',
    spec: { symbol: 'EURJPY', strategy: 'Japan Original Scalping' },
  }),

  make({
    slug: 'supremacy',
    name: 'SUPREMACY',
    number: '14',
    spec: { market: 'Crypto', symbol: 'BTCUSD', strategy: 'Japan Original Scalping' },
  }),

  /* ------------------------------------------------------------------ *
   * Template — copy this block to add a system.
   * status:'draft' keeps it out of the build entirely.
   * ------------------------------------------------------------------ */
  make({
    slug: 'ea-template',
    name: 'EA TEMPLATE',
    number: '00',
    status: 'draft',
  }),
];

/** Systems that appear in listings and get pages built. */
export const publishedEA = () => EA.filter((e) => e.status !== 'draft');

export const findEA = (slug) => EA.find((e) => e.slug === slug) || null;
