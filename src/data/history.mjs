/**
 * ============================================================================
 * DEVELOPMENT HISTORY
 * ============================================================================
 * Two separate things live here:
 *
 *   STAGES     — the loop every TYO system goes through. This is process, not
 *                claims, so it is safe to render as-is. Translations for the
 *                title/body are inline (en/ja) with English fallback.
 *
 *   MILESTONES — dated events in TYO's own history. This array is EMPTY on
 *                purpose: only add entries you can evidence. The page renders
 *                the milestones block only when the array is non-empty, so an
 *                empty array is a valid production state.
 * ============================================================================
 */

export const STAGES = [
  {
    id: 'idea',
    n: '01',
    key: 'IDEA',
    en: {
      title: 'Idea',
      body: 'A behaviour is noticed in the market. At this point it is nothing more than an observation and a question: could this be written down as a rule?',
    },
    ja: {
      title: '着想',
      body: '相場である挙動に気づく。この時点ではまだ観察と問いにすぎない。これはルールとして書き下せるか。',
    },
  },
  {
    id: 'research',
    n: '02',
    key: 'RESEARCH',
    en: {
      title: 'Research',
      body: 'The observation is tested against history, across volatility regimes and sessions, before a single line of trading code is written. Most ideas end here.',
    },
    ja: {
      title: 'リサーチ',
      body: 'トレードコードを1行も書く前に、過去データ・ボラティリティ局面・セッションを跨いで観察を検証する。多くのアイデアはここで終わる。',
    },
  },
  {
    id: 'prototype',
    n: '03',
    key: 'PROTOTYPE',
    en: {
      title: 'Prototype',
      body: 'The rule is implemented in its crudest possible form — entries only, no risk layer, no optimisation. The goal is not profit; it is to find out whether the behaviour is measurable at all.',
    },
    ja: {
      title: 'プロトタイプ',
      body: '最も粗い形で実装する。エントリーのみ、リスク層なし、最適化なし。目的は利益ではなく、その挙動がそもそも測定可能かを知ること。',
    },
  },
  {
    id: 'backtest',
    n: '04',
    key: 'BACKTEST',
    en: {
      title: 'Backtest',
      body: 'Tick-level testing over multiple years and market conditions, with spread and commission modelled. The test conditions are recorded at the same time as the result — a number without its conditions is not evidence.',
    },
    ja: {
      title: 'バックテスト',
      body: 'スプレッドと手数料を織り込み、複数年・複数の相場環境でティックレベル検証を行う。結果と同時に検証条件も記録する。条件のない数値は証拠にならない。',
    },
  },
  {
    id: 'failure',
    n: '05',
    key: 'FAILURE',
    en: {
      title: 'Failure',
      body: 'Most prototypes fail here, and this is the most valuable stage in the loop. A model that only worked because it described its own sample is identified and discarded rather than optimised into looking correct.',
    },
    ja: {
      title: '失敗',
      body: 'ほとんどのプロトタイプはここで失敗する。そしてこれがループの中で最も価値のある段階だ。自分のサンプルを記述していただけのモデルを特定し、最適化で「正しく見せる」のではなく破棄する。',
    },
  },
  {
    id: 'improvement',
    n: '06',
    key: 'IMPROVEMENT',
    en: {
      title: 'Improvement',
      body: 'The logic is rebuilt around what the failure exposed — usually a definition that was too loose. The risk layer is designed here, before the entry logic is finalised, not bolted on afterwards.',
    },
    ja: {
      title: '改善',
      body: '失敗が露呈させたもの——多くは緩すぎた定義——を軸にロジックを作り直す。リスク層はこの段階で、エントリーロジック確定より前に設計する。後付けではない。',
    },
  },
  {
    id: 'optimization',
    n: '07',
    key: 'OPTIMIZATION',
    en: {
      title: 'Optimisation',
      body: 'Parameters are explored systematically, then judged by the stability of the surrounding region rather than by the single best result. A peak that collapses when a parameter moves one step is not a setting; it is an artefact.',
    },
    ja: {
      title: '最適化',
      body: 'パラメータを体系的に探索し、単一の最良値ではなく周辺領域の安定性で評価する。1目盛りずらしただけで崩れる山は「設定値」ではなく「人工物」だ。',
    },
  },
  {
    id: 'forward',
    n: '08',
    key: 'FORWARD TEST',
    en: {
      title: 'Forward Test',
      body: 'The system runs on data it has never been fitted to, under live execution conditions. This is where backtest and reality are allowed to disagree, and where that disagreement gets recorded.',
    },
    ja: {
      title: 'フォワードテスト',
      body: '一度もフィットさせていないデータ上で、実際の執行条件下で稼働させる。バックテストと現実が食い違ってよい場所であり、その食い違いを記録する場所でもある。',
    },
  },
  {
    id: 'release',
    n: '09',
    key: 'RELEASE',
    en: {
      title: 'Release',
      body: 'Published on MQL5 with its documentation: what it does, what it risks, and the conditions its results were produced under. A release without that documentation is not a release.',
    },
    ja: {
      title: 'リリース',
      body: 'ドキュメントとともにMQL5で公開する。何をするか、何をリスクとして取るか、その結果がどの条件で得られたか。この文書を欠いたものはリリースとは呼ばない。',
    },
  },
  {
    id: 'update',
    n: '10',
    key: 'UPDATE',
    en: {
      title: 'Update',
      body: 'Live behaviour, user reports and changing market structure feed back into the loop. Every version is traceable to its source, and the loop starts again at research.',
    },
    ja: {
      title: 'アップデート',
      body: '実運用での挙動、ユーザー報告、変化する市場構造がループへ還る。すべてのバージョンはソースまで追跡可能で、ループはリサーチから再び始まる。',
    },
  },
];

/**
 * Dated milestones in TYO's history.
 * EMPTY BY DESIGN — add only what you can evidence. Shape:
 *
 *   { date: '2024-01', en: { title: '...', body: '...' },
 *                      ja: { title: '...', body: '...' } }
 *
 * The milestones section is hidden entirely while this array is empty.
 */
export const MILESTONES = [];
