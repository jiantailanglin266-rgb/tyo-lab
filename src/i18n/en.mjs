/**
 * English — the source of truth for every translation key.
 *
 * Every other locale is deep-merged ON TOP of this object at build time, so a
 * locale file only needs the keys it actually translates. Anything missing
 * falls back to the English string here. Never delete a key from this file
 * without removing it from the templates too.
 *
 * Convention: large display headlines stay in English across all locales
 * (they are brand typography, not body copy). Supporting copy is translated.
 */
export default {
  meta: {
    siteName: 'TYO',
    brandLine: 'Algorithmic Trading Lab',
    defaultDesc:
      'TYO is an independent algorithmic trading lab. We research, engineer and test MetaTrader 5 Expert Advisors using AI-assisted development, quantitative analysis and rigorous backtesting.',
  },

  nav: {
    home: 'Home',
    ea: 'Expert Advisors',
    history: 'Development History',
    technology: 'Technology',
    lab: 'Backtest Lab',
    about: 'About TYO',
    contact: 'Contact',
  },

  ui: {
    menu: 'Menu',
    close: 'Close',
    language: 'Language',
    selectLanguage: 'Select language',
    skipToContent: 'Skip to content',
    scroll: 'Scroll',
    backToTop: 'Back to top',
    exploreEAs: 'Explore Our EAs',
    ourStory: 'Our Development Story',
    viewOnMql5: 'View on MQL5',
    mql5Profile: 'MQL5 Profile',
    downloadEA: 'Download EA',
    readMore: 'Read more',
    viewAll: 'View all',
    viewDetail: 'View details',
    free: 'Free',
    paid: 'Paid',
    comingSoon: 'Coming soon',
    inDevelopment: 'In development',
    released: 'Released',
    dataPending: 'Data pending publication',
    dataPendingNote:
      'We publish verified figures only. This section appears once the corresponding test report is finalised.',
    notPublished: 'Not published',
    updated: 'Updated',
    published: 'Published',
    version: 'Version',
    back: 'Back',
    externalLink: 'Opens in a new tab',
    playVideo: 'Play video',
    pauseVideo: 'Pause video',
    reduceMotionNote: 'Motion is reduced according to your system preference.',
  },

  home: {
    hero: {
      brand: 'TYO',
      line1: 'Algorithmic Trading,',
      line2: 'Engineered Differently.',
      sub: 'AI-powered research. Quantitative logic. Automated execution.',
      eyebrow: 'Independent Algorithmic Trading Lab',
    },

    intro: {
      eyebrow: 'Philosophy',
      h1: 'We Build Algorithms,',
      h2: 'Not Predictions.',
      body1:
        'We do not claim to know where the market is going. Nobody does. What can be engineered is the process around that uncertainty.',
      body2:
        'Data. Probability. Rules. Risk control. Automated execution. TYO approaches the market with algorithms instead of emotion — and treats every result as evidence, not proof.',
      pillars: [
        { k: 'Data', v: 'Observed, not assumed' },
        { k: 'Probability', v: 'Distributions, not certainties' },
        { k: 'Rules', v: 'Written before the trade' },
        { k: 'Risk', v: 'Defined before the entry' },
        { k: 'Execution', v: 'Automated, repeatable' },
      ],
    },

    stats: {
      eyebrow: 'Community',
      h: 'Used by traders worldwide.',
      body:
        'Our free Expert Advisors are distributed through MQL5, the official MetaTrader marketplace. Every download is an independent trader choosing to run our code.',
      labels: {
        downloads: 'Global EA Downloads',
        countries: 'Countries Reached',
        releases: 'EA Releases',
        backtests: 'Backtests Executed',
        years: 'Years of Research',
      },
      source: 'Source: MQL5 marketplace, cumulative free downloads.',
    },

    global: {
      eyebrow: 'Global Community',
      h1: 'Built in Japan.',
      h2: 'Tested by Traders Around the World.',
      body:
        'TYO is developed in Tokyo, but the code runs on terminals in India, Thailand, Indonesia, Vietnam, China and beyond. Different brokers. Different spreads. Different market hours. That diversity is the most honest stress test an algorithm can get.',
      legend: 'Active community regions',
    },

    ai: {
      eyebrow: 'AI Accelerated Development',
      h1: 'AI is not the strategy.',
      h2: 'AI is the accelerator.',
      body:
        'We use AI where it genuinely compounds engineering output — reading data, drafting code, structuring tests, summarising results, exploring parameter space. The trading logic itself stays explicit, readable and auditable.',
      note:
        'AI does not predict markets, and no model here is presented as a forecast of future prices.',
      items: [
        { k: 'Code Assistance', v: 'Faster MQL5 implementation and refactoring' },
        { k: 'Research', v: 'Literature, market structure and behaviour review' },
        { k: 'Data Analysis', v: 'Tick and bar data processing at scale' },
        { k: 'Parameter Exploration', v: 'Systematic search instead of guesswork' },
        { k: 'Testing', v: 'Automated test matrices across conditions' },
        { k: 'Documentation', v: 'Consistent, reproducible test records' },
      ],
    },

    algorithm: {
      eyebrow: 'From Idea to Algorithm',
      h1: 'From Idea',
      h2: 'to Algorithm.',
      body:
        'A market observation is not a strategy. It becomes one only after it survives definition, quantification, implementation and test.',
      steps: [
        { n: '01', k: 'Market Data', v: 'Raw price, volume and time series' },
        { n: '02', k: 'Quantification', v: 'The behaviour expressed as measurable conditions' },
        { n: '03', k: 'Logic', v: 'Entry, exit, sizing and risk rules' },
        { n: '04', k: 'Code', v: 'Deterministic MQL5 implementation' },
        { n: '05', k: 'Algorithm', v: 'A complete, testable trading system' },
        { n: '06', k: 'Expert Advisor', v: 'Automated execution on MetaTrader 5' },
      ],
    },

    ea: {
      eyebrow: 'Expert Advisors',
      h: 'Systems we have shipped.',
      body:
        'Each Expert Advisor is documented with its concept, logic, risk model and test conditions. No black boxes, no unexplained results.',
      cta: 'View all Expert Advisors',
    },

    backtest: {
      eyebrow: 'Backtest Lab',
      lines: ['Test.', 'Break.', 'Improve.', 'Repeat.'],
      body:
        'Most ideas fail. That is the point. A backtest is not a sales asset — it is the instrument that tells us which ideas deserve more of our time.',
      cta: 'Enter the Backtest Lab',
    },

    history: {
      eyebrow: 'Development History',
      h: 'Every EA starts with a question.',
      questions: [
        'Can this behaviour be quantified?',
        'Can this risk be controlled?',
        'Can this logic survive different market conditions?',
      ],
      body: 'Then we test. And test again. And rebuild.',
      cta: 'Read the development timeline',
    },

    tech: {
      eyebrow: 'Technology',
      h1: 'Markets Exist in Probability,',
      h2: 'Not Certainty.',
      body:
        'We borrow the language of probability — distributions, uncertainty, superposition of outcomes — as a design philosophy, not as a prediction engine. A trade is a position inside a distribution, never a known outcome.',
      cta: 'Explore the technology',
      words: ['ALGORITHM', 'LOGIC', 'STATE', 'EXECUTION', 'LATENCY', 'DATA', 'AUTOMATION'],
    },

    final: {
      brand: 'TYO',
      line: 'Algorithmic Trading Lab',
      signature: 'powered by TYO',
      body: 'Code. Data. Probability. Iteration.',
      cta: 'Explore Our EAs',
      cta2: 'Contact',
    },
  },

  ea: {
    index: {
      eyebrow: 'Expert Advisors',
      h1: 'Expert',
      h2: 'Advisors',
      lead:
        'Automated trading systems built for MetaTrader 5 and distributed through MQL5. Every system below is documented with the logic it uses, the risk it takes and the conditions it was tested under.',
      empty: 'No Expert Advisors are published yet. New releases appear here first.',
      filterAll: 'All',
      count: 'systems',
    },
    labels: {
      market: 'Market',
      symbol: 'Symbol',
      timeframe: 'Timeframe',
      strategy: 'Strategy Type',
      risk: 'Risk Level',
      version: 'Version',
      releaseDate: 'Release Date',
      price: 'Availability',
      platform: 'Platform',
      minDeposit: 'Suggested Minimum Deposit',
      accountType: 'Account Type',
      leverage: 'Leverage',
      vps: 'VPS',
      status: 'Status',
    },
    risk: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      variable: 'Configurable',
    },
    detail: {
      overview: 'Overview',
      concept: 'Concept',
      strategy: 'Strategy',
      logic: 'Logic',
      riskManagement: 'Risk Management',
      backtest: 'Backtest',
      video: 'Backtest Video',
      parameters: 'Parameters',
      environment: 'Recommended Environment',
      history: 'Development History',
      versions: 'Version History',
      download: 'Download',
      disclaimer: 'Disclaimer',
      paramName: 'Parameter',
      paramDefault: 'Default',
      paramDesc: 'Description',
      versionCol: 'Version',
      dateCol: 'Date',
      changeCol: 'Changes',
      downloadBody:
        'This Expert Advisor is distributed through MQL5, the official MetaTrader marketplace. Downloads, updates and reviews are handled entirely on that platform.',
      backToList: 'All Expert Advisors',
      nextEa: 'Next system',
    },
    metrics: {
      title: 'Backtest Summary',
      period: 'Backtest Period',
      initialDeposit: 'Initial Deposit',
      netProfit: 'Net Profit',
      maxDrawdown: 'Maximal Drawdown',
      profitFactor: 'Profit Factor',
      totalTrades: 'Total Trades',
      winRate: 'Win Rate',
      recoveryFactor: 'Recovery Factor',
      expectedPayoff: 'Expected Payoff',
      sharpe: 'Sharpe Ratio',
      broker: 'Broker / Server',
      spread: 'Spread',
      commission: 'Commission',
      modeling: 'Modeling Method',
      dataSource: 'Data Source',
      quality: 'Modeling Quality',
      conditions: 'Test Conditions',
      curveAlt: 'Balance and equity curve from the tester report',
      curveCaption: 'Balance / equity curve exported directly from the Strategy Tester report.',
      ddBasis: 'Drawdown Basis',
      ddBasis_equity: 'Equity (includes open positions)',
      ddBasis_balance: 'Balance (closed trades only)',
    },
  },

  history: {
    eyebrow: 'Development History',
    h1: 'Development',
    h2: 'Timeline',
    lead:
      'This is not a company history. It is how a trading system actually gets built — including the parts that did not work.',
    quote1: 'Every EA Starts With a Question.',
    questions: [
      'Can this behaviour be quantified?',
      'Can this risk be controlled?',
      'Can this logic survive different market conditions?',
    ],
    quote2: 'Then we test. And test again. And rebuild.',
    processTitle: 'The loop we run on every system',
    failureTitle: 'Failure is part of the record',
    failureBody:
      'A research brand that only shows wins is a marketing brand. Discarded models, rebuilt logic and abandoned assumptions are listed here because they are the reason the surviving systems exist.',
    milestonesTitle: 'Selected milestones',
    stage: 'Stage',
  },

  technology: {
    eyebrow: 'Technology',
    h1: 'Technology',
    h2: '& Method',
    lead:
      'The stack and the thinking behind every TYO system. Nothing here is proprietary magic — it is standard engineering discipline applied consistently to trading software.',
    aiTitle: 'Artificial Intelligence',
    aiLead:
      'AI is a development accelerator at TYO, not a forecasting oracle. It shortens the distance between an idea and a testable implementation.',
    aiWarning:
      'We do not use AI to predict prices, and we do not present any model output as a forecast of future market direction.',
    quantumTitle: 'Probability, Not Certainty',
    quantumLead:
      'We take our visual and conceptual language from probability theory — distributions, uncertainty, superposed outcomes, particle systems. It shapes how we design and how we present results. It is a philosophy of humility about the future, not a claim of physical prediction.',
    quantumPoints: [
      { k: 'Probability', v: 'Every trade is a draw from a distribution.' },
      { k: 'Uncertainty', v: 'Confidence intervals, not price targets.' },
      { k: 'Distribution', v: 'Judge the shape of outcomes, not one outcome.' },
      { k: 'Variance', v: 'Drawdown is a feature of the system, not an accident.' },
    ],
    csTitle: 'Trading Systems Are Software.',
    csTitle2: 'Software Must Be Engineered.',
    csLead:
      'An Expert Advisor is a real-time program handling money under latency, partial information and hostile edge cases. We treat it like production software.',
    csItems: [
      { k: 'Algorithm', v: 'Explicit, readable decision procedures' },
      { k: 'Logic', v: 'Deterministic conditions with no hidden state' },
      { k: 'State', v: 'Positions, orders and recovery after disconnects' },
      { k: 'Execution', v: 'Slippage, requotes and partial fills handled' },
      { k: 'Latency', v: 'Tick handling that does not block the terminal' },
      { k: 'Data', v: 'Tick-level history with documented quality' },
      { k: 'Automation', v: 'Reproducible test and release pipelines' },
    ],
    stackTitle: 'Stack & Disciplines',
    stack: [
      { k: 'MetaTrader 5', v: 'Target platform for execution and testing' },
      { k: 'MQL5', v: 'Implementation language for every released system' },
      { k: 'Strategy Tester', v: 'Tick-level backtesting and optimisation' },
      { k: 'Quantitative Analysis', v: 'Statistical evaluation of results' },
      { k: 'Machine Learning Research', v: 'Exploratory, research-stage only' },
      { k: 'Risk Management', v: 'Position sizing, exposure and stop design' },
      { k: 'Automation', v: 'Scripted test matrices and report generation' },
      { k: 'Version Control', v: 'Every release traceable to its source' },
    ],
  },

  lab: {
    eyebrow: 'Backtest Lab',
    h1: 'Backtest',
    h2: 'Lab',
    lead:
      'Research notes, test reports and experiments. Published as they are — including the ones that ended with a rejected hypothesis.',
    empty: 'The first research notes are being prepared for publication.',
    labels: {
      date: 'Date',
      ea: 'System',
      market: 'Market',
      period: 'Test Period',
      hypothesis: 'Hypothesis',
      method: 'Method',
      result: 'Result',
      conclusion: 'Conclusion',
      type: 'Type',
      readingTime: 'min read',
    },
    types: {
      backtestReport: 'Backtest Report',
      optimization: 'Optimization Experiment',
      parameterStudy: 'Parameter Study',
      marketResearch: 'Market Research',
      comparison: 'EA Comparison',
      versionTest: 'Version Test',
    },
    backToList: 'All research notes',
  },

  about: {
    eyebrow: 'About TYO',
    h1: 'About',
    h2: 'TYO',
    lead:
      'TYO is a small independent team in Japan building automated trading systems. We are engineers and researchers first, and we publish our work so it can be judged on its documentation rather than its promises.',
    whoTitle: 'Who we are',
    whoBody:
      'A compact independent team — not a fund, not a broker, not a signal service. We combine software engineering, AI-assisted development, quantitative research and algorithmic trading to design, test and release Expert Advisors for MetaTrader 5.',
    whoNote:
      'We deliberately do not present ourselves as larger than we are. The value is in the method and the documentation, not in the size of the organisation.',
    philosophyTitle: 'Our Philosophy',
    philosophyNo: ['No Magic.', 'No Predictions.', 'No Guarantees.'],
    philosophyOnly: 'Only',
    philosophyYes: ['Logic.', 'Testing.', 'Risk.', 'Iteration.'],
    philosophyBody:
      'Anyone can publish an equity curve. Far fewer will publish the conditions it was produced under, the versions that failed before it, and the risks it carries. That difference is the entire brand.',
    principlesTitle: 'How we work',
    principles: [
      { k: 'Document the conditions', v: 'A result without its test conditions is not a result.' },
      { k: 'Publish the failures', v: 'Discarded models explain the surviving ones.' },
      { k: 'Never guarantee outcomes', v: 'No system can, and any brand that claims otherwise is selling something else.' },
      { k: 'Keep the logic readable', v: 'If we cannot explain why a trade was taken, we do not ship it.' },
      { k: 'Respect risk first', v: 'Drawdown is designed before profit is measured.' },
    ],
    contactCta: 'Get in touch',
  },

  contact: {
    eyebrow: 'Contact',
    h1: 'Contact',
    h2: '& MQL5',
    lead:
      'Questions about a system, a test report, or a collaboration. Downloads, updates and product support are handled through MQL5.',
    mql5Title: 'MQL5',
    mql5Body:
      'Every TYO Expert Advisor is published on MQL5, the official MetaTrader marketplace. Download, version updates, reviews and product comments all live there.',
    formTitle: 'Send a message',
    formName: 'Name',
    formEmail: 'Email',
    formSubject: 'Subject',
    formMessage: 'Message',
    formSend: 'Send message',
    formSubjects: ['General question', 'About an Expert Advisor', 'Backtest / research', 'Collaboration', 'Other'],
    formNote:
      'We answer in English and Japanese. Please do not send account credentials, broker passwords or investment account details.',
    emailTitle: 'Email',
    noSupportTitle: 'What we cannot do',
    noSupportBody:
      'We do not provide investment advice, managed accounts, signal subscriptions or profit guarantees, and we cannot advise on whether a system suits your personal financial situation.',
  },

  footer: {
    tagline: 'Algorithmic Trading Lab',
    navTitle: 'Navigation',
    langTitle: 'Language',
    linksTitle: 'Links',
    madeIn: 'Built in Tokyo, Japan.',
    rights: 'All rights reserved.',
    disclaimerTitle: 'Risk Disclaimer',
    disclaimer: [
      'Trading foreign exchange, CFDs and cryptocurrency carries a high level of risk and may not be suitable for every investor. You can lose more than your initial deposit. Leverage magnifies both gains and losses.',
      'TYO develops and publishes automated trading software. We do not provide investment advice, portfolio management or trading signals, and nothing on this site is a recommendation to buy or sell any instrument.',
      'No Expert Advisor, algorithm or optimisation guarantees profit. Any performance figure shown on this site is historical and does not guarantee, imply or predict future results.',
      'Backtest results are simulations. Live results differ due to spread, slippage, commission, liquidity, execution speed, requotes, broker conditions and market regime changes.',
      'You are solely responsible for evaluating whether any system is appropriate for your circumstances, and for any decision you take using it. Seek independent licensed advice where appropriate.',
    ],
    backtestDisclaimerTitle: 'About backtest results',
    backtestDisclaimer:
      'Past performance does not guarantee future results. Backtest results may differ from live trading due to spreads, slippage, liquidity, execution conditions and broker environments.',
  },

  seo: {
    home: {
      title: 'TYO — Algorithmic Trading, Engineered Differently',
      desc:
        'An independent algorithmic trading lab. AI-accelerated research, quantitative logic and automated execution for MetaTrader 5. Over 5,000 free EA downloads worldwide.',
    },
    ea: {
      title: 'Expert Advisors — TYO Algorithmic Trading Lab',
      desc:
        'MetaTrader 5 Expert Advisors developed by TYO. Every system documented with concept, logic, risk model and backtest conditions.',
    },
    history: {
      title: 'Development History — TYO Algorithmic Trading Lab',
      desc:
        'How a TYO Expert Advisor is actually built: idea, research, prototype, backtest, failure, rebuild, optimisation, forward test, release.',
    },
    technology: {
      title: 'Technology — TYO Algorithmic Trading Lab',
      desc:
        'AI-assisted development, quantitative analysis, computer science and risk engineering behind TYO Expert Advisors for MetaTrader 5.',
    },
    lab: {
      title: 'Backtest Lab — TYO Algorithmic Trading Lab',
      desc:
        'Backtest reports, optimisation experiments, parameter studies and market research published by TYO.',
    },
    about: {
      title: 'About — TYO Algorithmic Trading Lab',
      desc:
        'TYO is a small independent team in Japan engineering automated trading systems. No magic, no predictions, no guarantees.',
    },
    contact: {
      title: 'Contact & MQL5 — TYO Algorithmic Trading Lab',
      desc: 'Contact TYO, or find our Expert Advisors on the MQL5 marketplace.',
    },
  },
};
