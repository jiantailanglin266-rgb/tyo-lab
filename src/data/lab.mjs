/**
 * ============================================================================
 * BACKTEST LAB — research articles
 * ============================================================================
 *
 * HOW TO ADD AN ARTICLE
 *   1. Copy the sample block. `slug` becomes /<locale>/lab/<slug>/.
 *   2. `type` must be one of the keys under `lab.types` in the i18n files:
 *      backtestReport | optimization | parameterStudy | marketResearch |
 *      comparison | versionTest
 *   3. `status: 'draft'` keeps an article out of the build.
 *   4. Body content is an array of blocks so a non-developer can extend it:
 *        { p: '...' }                 paragraph
 *        { h: '...' }                 sub-heading
 *        { list: ['...', '...'] }     bullet list
 *        { note: '...' }              highlighted note / caveat
 *        { table: { head: [...], rows: [[...]] } }
 *        { image: { src, alt, caption } }
 *   5. `metrics` uses exactly the same shape as an EA backtest — nulls hide.
 *
 * Every article page automatically carries the backtest disclaimer.
 * ============================================================================
 */

export const ARTICLES = [
  {
    slug: 'why-we-publish-failed-models',
    date: '2024-06-01',
    type: 'marketResearch',
    status: 'released',

    /** ⚠ Structural sample. Replace with a real research note, then remove. */
    placeholder: true,

    ea: null, // slug of a related EA, or null
    market: null,
    period: null,
    video: { type: null, id: null, src: null, poster: null },
    metrics: null,

    i18n: {
      en: {
        title: 'Why we publish models that failed',
        summary:
          'A note on why the discarded versions of a system belong in its documentation, and what a reader should look for in any published backtest.',
        hypothesis:
          'A published result is only interpretable when the reader also knows what was rejected on the way to it.',
        method:
          'We compare how a result reads with and without its rejected predecessors and its test conditions attached.',
        result:
          'Without conditions and rejected versions, a result is indistinguishable from a curve that was fitted to the data it is being shown on.',
        conclusion:
          'Publish the conditions, publish the failures, and let the reader judge. Anything less asks for trust that has not been earned.',
        body: [
          { p: 'A backtest is a measurement, and like every measurement it is meaningless without its conditions. The same strategy, tested on different tick data, with a different spread assumption and a different modelling method, will produce results that disagree with each other by more than most people expect.' },
          { h: 'What a reader should demand' },
          {
            list: [
              'The exact test period, and whether it includes the period the idea came from.',
              'The data source and its modelling quality.',
              'Spread and commission assumptions, stated as numbers.',
              'How many parameter combinations were tried before this one was shown.',
              'What the version before this one did, and why it was discarded.',
            ],
          },
          { h: 'Why the failures matter most' },
          { p: 'A model that survived ten rejected predecessors is a different object from a model that worked the first time. The rejections are the evidence that the surviving version was selected for a reason rather than found by searching until something looked good.' },
          { note: 'This article is a methodology note. It contains no performance claim and no result for any TYO system.' },
        ],
      },
      ja: {
        title: '失敗したモデルを公開する理由',
        summary:
          '破棄されたバージョンがなぜドキュメントの一部であるべきか。そして公開されたバックテストを読むとき、読み手が何を確認すべきか。',
        hypothesis:
          '公開された結果は、そこへ至る過程で「何が棄却されたか」を読み手が知って初めて解釈可能になる。',
        method: '検証条件と棄却された前バージョンの有無で、同じ結果の読まれ方がどう変わるかを比較する。',
        result:
          '条件と棄却履歴を欠いた結果は、提示されているデータにフィットさせただけの曲線と区別がつかない。',
        conclusion:
          '条件を公開し、失敗を公開し、読み手に判断させる。それ以下は、獲得していない信用を要求していることになる。',
        body: [
          { p: 'バックテストは測定である。そしてあらゆる測定と同じく、条件なしでは意味を持たない。同じ戦略でも、異なるティックデータ、異なるスプレッド前提、異なるモデリング方式で検証すれば、多くの人が想像する以上に食い違う結果が出る。' },
          { h: '読み手が要求すべきもの' },
          {
            list: [
              '正確な検証期間。そのアイデアの着想元となった期間を含んでいるかどうか。',
              '使用データとそのモデリング品質。',
              'スプレッドと手数料の前提。数値として明示されているか。',
              'この結果が提示されるまでに、いくつのパラメータ組み合わせが試されたか。',
              'ひとつ前のバージョンが何をしていて、なぜ破棄されたか。',
            ],
          },
          { h: 'なぜ失敗が最も重要なのか' },
          { p: '10回の棄却を経て残ったモデルと、一発で機能したモデルは、別の object である。棄却の履歴こそが、そのバージョンが「良く見えるものが出るまで探した結果」ではなく「理由をもって選ばれた」ことの証拠になる。' },
          { note: '本記事は方法論に関する記事であり、いかなる成績の主張も、TYOの特定システムの結果も含みません。' },
        ],
      },
    },
  },

  /* ------------------------------------------------------------------ *
   * Template — copy to add an article. status:'draft' excludes it.
   * ------------------------------------------------------------------ */
  {
    slug: 'article-template',
    date: '2024-01-01',
    type: 'backtestReport',
    status: 'draft',
    placeholder: true,
    ea: null,
    market: null,
    period: null,
    video: { type: null, id: null, src: null, poster: null },
    metrics: {
      period: null,
      initialDeposit: null,
      netProfit: null,
      maxDrawdown: null,
      profitFactor: null,
      totalTrades: null,
      winRate: null,
      recoveryFactor: null,
      expectedPayoff: null,
      sharpe: null,
      conditions: { broker: null, spread: null, commission: null, modeling: null, dataSource: null, quality: null },
    },
    i18n: {
      en: { title: '', summary: '', hypothesis: '', method: '', result: '', conclusion: '', body: [] },
    },
  },
];

export const publishedArticles = () =>
  ARTICLES.filter((a) => a.status !== 'draft').sort((a, b) => (a.date < b.date ? 1 : -1));

export const findArticle = (slug) => ARTICLES.find((a) => a.slug === slug) || null;
