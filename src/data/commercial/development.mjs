/**
 * ============================================================================
 * CUSTOM EA DEVELOPMENT — service definition (Phase 16 §30–40, §89–99, §124)
 * ============================================================================
 * Structure only; copy is in i18n `development`. No fixed prices (§94),
 * no client case studies (§41, §128). Case studies will be drawn from the
 * public Research Log once the owner marks entries as showable.
 * ============================================================================
 */

export const DEVELOPMENT = {
  pricing: 'CONTACT_FOR_QUOTE', // §37
  scope: [
    'originalEA',
    'existingEAModification',
    'mt4ToMt5Migration',
    'indicators',
    'riskManagement',
    'portfolioTools',
    'tradingDashboards',
    'backtestAutomation',
    'aiMt5Integration',
    'mcpIntegration',
  ],
  types: ['BASIC', 'RESEARCH', 'ADVANCED_QUANT', 'AI_SYSTEM'], // §36, §93
  flow: ['consultation', 'strategyDesign', 'specification', 'development', 'backtest', 'revision', 'delivery'], // §33
  advancedFlow: ['research', 'oos', 'walkForward', 'monteCarlo', 'shadowForward'], // §34 — the Phase 14/13.5 engines
  stack: ['MT4', 'MT5', 'MQL4', 'MQL5', 'Python', 'AI', 'MCP', 'Backtesting', 'Monte Carlo', 'Portfolio Analysis'], // §90 — all in use in this repo
  modificationExamples: ['sltp', 'martingaleControl', 'trendFilter', 'mt4ToMt5', 'sessionFilter', 'newsFilter', 'portfolioControl', 'aiMonitoring'], // §40
  caseStudies: [], // §41 — research-log backed only; none marked showable yet
  whiteLabel: false, // §96 — not offered; hidden
  nda: true, // §97 — NDA can be discussed; the form carries the flag
  b2b: true, // §95
};

/** Inquiry / request field sets (§28, §38, §123–124). Backend schema mirrors these. */
export const PRIVATE_INQUIRY_FIELDS = ['name', 'company', 'country', 'email', 'platform', 'experience', 'capitalRange', 'preferredMarket', 'purpose', 'message'];
export const DEVELOPMENT_REQUEST_FIELDS = ['name', 'company', 'email', 'country', 'platform', 'symbol', 'timeframe', 'strategyType', 'existingSource', 'desiredFeatures', 'budgetRange', 'deadline', 'message'];
export const OPTIONAL_FIELDS = ['company', 'capitalRange', 'budgetRange', 'deadline', 'existingSource'];

export const INQUIRY_SUBJECTS = {
  private: 'TYO PRIVATE EA Inquiry',
  development: 'Custom EA Development Inquiry',
  modification: 'Existing EA Modification Inquiry',
  ib: 'IB Access Verification',
};
