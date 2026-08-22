# TYO LAB — Phase 16A 完了報告（EA DISTRIBUTION, SUBSCRIPTION & CUSTOM DEVELOPMENT LAYER）

日付：2026-08-22 · コミット：`de1368d` · 本番：https://jiantailanglin266-rgb.github.io/tyo-lab/ja/access/ · https://jiantailanglin266-rgb.github.io/tyo-lab/ja/development/

---

## 1. COMMERCIAL ARCHITECTURE

```
TYO LAB（静的リサーチサイト / GitHub Pages）
  ↓ 説明・比較・導線のみ
TYO ACCOUNT（認証 + 課金）            … Phase 16B/16C
  ↓
TYO DOWNLOAD API（署名付きダウンロード） … Phase 16B
```

- 静的サイトは決済・ログイン・ファイル配布を一切持たない（§16, §132, §133）
- 接続点は `src/site.config.mjs` → `COMMERCIAL.{inquiryEndpoint, accountUrl, downloadApiUrl, paymentProvider, contactEmailConfirmed}`
- Payment / Subscription / License の3プロバイダ抽象を定義（未接続）

## 2. EA ACCESS PAGE（`/access/`）

構成：HERO「あなたに合った方法で、TYOのEAを。」→ 4モデルのカード → 戦略×プラン表（14戦略、`?ea=<slug>` で該当行をフォーカス）→ IB ACCESS → TYO PRO → TYO PRIVATE（問い合わせフォーム）→ CUSTOM 導線 → 比較表（モバイルはカード化）→ FAQ（5問）→ 「EVIDENCE BEFORE SALES」

- すべての戦略行から証拠（バックテスト / OOS / WF / フォワード）へ戻れる
- 全プランは **PLANNED（準備中）** 表示。「このサイト上で課金は発生しない」と明記

## 3. IB ACCESS

| 項目 | 実装 |
|---|---|
| 表記 | 「EA利用料 0」（「無料」と断定しない、§4・§50） |
| 開示 | 「TYOは対象ブローカーから紹介報酬を受け取ることがある」を常時表示（§52–53） |
| フロー | TYO LAB → ブローカー口座 → TYO IB登録 → 認証 → EAアクセス |
| 状態 | NOT_CONNECTED / PENDING_VERIFICATION / VERIFIED / ACTIVE / SUSPENDED |
| 認証 | 手動（申請 → TYO確認 → 付与）。口座認証情報は要求・保存しない |
| スイッチ | `IB_ACCESS.enabled` で全体 ON/OFF、`brokersPublished=false` で `/supported-brokers/` 非公開 |
| データ | 対象ブローカー / URL / 適用条件 / 対象国 → **DATA_REQUIRED**（捏造なし） |

## 4. PRO $10 SUBSCRIPTION

- 表示：`$10 / month`、USD、月額のみ（年払いなし）
- 機能：上位EA / プレミアムパラメータ / 優先アップデート / リサーチプリセット / ポートフォリオアクセス（存在する機能のみ）
- 状態：TRIAL / ACTIVE / PAST_DUE / CANCELLED / EXPIRED
- ダウンロードは有効期間中のみ・署名付きAPI経由（直リンク不可）と明記
- 決済プロバイダ / 解約条件 / 返金 → **DATA_REQUIRED**、「課金は未稼働」を明示

## 5. PRIVATE $5,000

- 存在のみ公開（名称・ロジック・ファイル・成績は非公開、§129–130）
- **購入ボタンなし**。Inquiry → 用途確認 → オンライン面談 → 契約条件 → 支払い → ライセンス提供
- 価格根拠：限定性・ライセンス範囲・ダイレクトサポート・カスタマイズ（成績ではない）＋免責
- フォーム：Name / Company / Country / Email / Platform / Experience / Capital（任意）/ Market / Purpose / Message / NDA

## 6. CUSTOM DEVELOPMENT（`/development/`）

§89 構成：HERO「あなたのアイデアを、EAにする。」→ WHY TYO「ただコードを書くのではなく、ロジックを検証する。」→ 対象10種 → 開発タイプ4種（BASIC / RESEARCH / ADVANCED QUANT / AI SYSTEM、すべて要見積もり）→ 標準7段階＋上位検証5段階 → 技術スタック10 → 既存EA改修8例 → 事例（顧客事例なし・リサーチログ参照）→ FAQ（6問）→ 依頼フォーム

## 7. EA CTA CHANGES

- EA詳細ヒーロー：「このEAを利用する」→ `/access/?ea=<slug>`
- EA詳細本文末：「このEAの利用方法」パネル（提供ステータス / プラン / リサーチステータスを分離表示）
- EA一覧カード：プランバッジ、「アクセス」フィルタ（割当がある場合のみ表示）
- トップ最終セクション・メニュー・フッターに導線（ヘッダーは満杯のため追加せず、§42）

## 8. DATA MODEL

```
src/data/commercial/
  plans.mjs        PLANS(4) / COMPARISON / 状態enum
  products.mjs     戦略ごと access{ib,pro,private,directPurchase:false} / status / version / checksum
  access.mjs       IB設定・対象国（すべて DATA_REQUIRED）
  development.mjs  開発サービス定義・フォーム項目・件名
```
- 全EAは `DRAFT`・プラン未割当で開始（オーナーが決定）
- `model.commercial` は `researchStatus` と別系統（§74）

## 9. I18N

ja / en / zh / hi / id / th / vi。`commercial / access / development / account` ブロックのキー構造が7言語で同一であることを自動検証。

## 10. LEGAL GAPS（決済開始前に必須）

| 文書 | 状態 |
|---|---|
| Terms of Service | 未作成 |
| Privacy Policy | 未作成 |
| Risk Disclosure（単独ページ） | フッターのみ |
| Subscription Terms | 未作成（解約条件 DATA_REQUIRED） |
| Refund Policy | 未作成（DATA_REQUIRED） |
| IB Disclosure（単独ページ） | /access/ 内のみ |
| License Agreement（EULA） | 未作成 |
| 開発契約テンプレ | 未作成 |

詳細：`docs/COMMERCIAL_LEGAL_GAPS.md`

## 11. PAYMENT READINESS

`PaymentProvider / SubscriptionProvider / LicenseProvider` インターフェース定義済み（Stripe / Paddle / Lemon Squeezy 接続可能）。プロバイダ未選定のため未接続。架空決済なし。

## 12. DOWNLOAD SECURITY

- public / dist に EA バイナリ（.ex4/.ex5/.mq4/.mq5/.set）が存在しないことをテストで強制
- 設計：private リリースパイプライン → private ストレージ → Download API（権利チェック＋監査）→ 署名URL（TTL ≤ 10分）
- SHA-256 チェックサム表示、異常DL検出ルール、MT5ライセンスチェック（将来）を文書化
- 詳細：`docs/SECURE_DOWNLOAD_ARCHITECTURE.md`

## 13. DATA REQUIRED FROM OWNER

| 項目 | 入力先 |
|---|---|
| 対象ブローカー / IB URL / 適用条件 / 対象国 | `src/data/commercial/access.mjs` |
| IB 認証方法（手動 / API） | 同上 `verificationMethod` |
| PRO 対象EA一覧 / IB 対象EA一覧 | `src/data/commercial/products.mjs`（`access.pro / ib`） |
| Private EA の範囲・ソース提供有無・口座/デバイス上限 | `products.mjs` → `PRIVATE_PRODUCT` |
| **連絡先メールの確認**（`contact@tyo-lab.com` が監視されているか） | `site.config.mjs` → `COMMERCIAL.contactEmailConfirmed` |
| 問い合わせ送信先（フォームサービス / Contact API） | `COMMERCIAL.inquiryEndpoint` |
| 決済プロバイダ | `COMMERCIAL.paymentProvider` |
| 返金ポリシー / 解約条件 | 法務ページ＋i18n |
| 法務ページ一式 | 新規ルート |

## 14. TEST RESULTS

| スイート | 結果 |
|---|---|
| test-forward.mjs | 28 / 28 |
| test-protocol.mjs | 12 / 12 |
| test-mcp.mjs | 10 / 10 |
| test-xau-research.mjs | 8 / 8 |
| **test-commercial.mjs（新規）** | **25 / 25** |
| tools/check.mjs | リンク切れ 0 · head欠落 0 · 471ファイル |

新規テストの主な項目：mailto 不使用 / BUY NOW 不使用 / EA バイナリ不在 / DATA_REQUIRED の文字通り表示 / EA CTA リンク / 提供ステータスとリサーチステータスの分離 / /account/ に偽ログインなし・noindex / 7言語ビルド。

## 15. PHASE 16B READINESS

設計完了：`docs/SUBSCRIPTION_ARCHITECTURE.md`、`docs/SECURE_DOWNLOAD_ARCHITECTURE.md`、`docs/IB_ACCESS_MODEL.md`、`docs/PRIVATE_LICENSE_MODEL.md`、`docs/CUSTOM_DEVELOPMENT_MODEL.md`、`docs/EA_ACCESS_MODEL.md`、`docs/PHASE16_COMMERCIAL_AUDIT.md`

着手条件：① 問い合わせエンドポイントの決定 ② 決済プロバイダの選定 ③ 連絡先メールの確認 ④ 法務ページの作成。

---

TYO — RESEARCH. VERIFY. ACCESS.
EVIDENCE BEFORE SALES.
