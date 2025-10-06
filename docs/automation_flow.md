# LLM駆動LP自動生成フロー設計

## ゴール
入力: 設定キーワード（例: "矯正歯科"）
出力: 
1. 新規ディレクトリ（例: `mouthpiece_矯正歯科`）に配置されたLPファイル一式
2. `process_templates/generated/` 配下のワークフローYAML
3. Tips/ヒーローコピー/比較表コメントが最新市場調査を反映した自然なテキスト
4. 実行ログ・検証結果

## 全体アーキテクチャ
```
┌────────────┐      ┌─────────────────┐      ┌────────────┐
│ CLI/オーケストレータ │────▶│ DevTools MCP (SERP) │────▶│ 生データ(JSON) │
└────────────┘      └─────────────────┘      └──────┬─────┘
                                                       │
                                                       ▼
                                                ┌────────────┐
                                                │ LLM API 呼出 │
                                                └──────┬─────┘
                                                       │
                                                       ▼
                                          ┌─────────────────────────┐
                                          │ コピー生成結果（JSON/YAML）│
                                          └──────┬──────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │ ファイル反映 (CSV/HTML) + ワークフロー生成 │
                            └─────────────────────────────────────────────┘
```

## コンポーネント詳細

### 1. CLI / オーケストレータ
- 既存 `scripts/generate_lp_from_template.py` を拡張し、`--auto-content` フラグで自動フロー起動
- 主な処理:
  1. 入力KWの検証（文字種、禁則KWなど）
  2. DevTools MCPへSERP取得ジョブを送信
  3. 取得結果をLLMへ渡すプロンプト生成
  4. LLM出力を整形し、テンプレートへ書き込み
  5. ワークフローYAML生成
  6. ログ出力・失敗時のロールバック

### 2. DevTools MCP
- 実装：`mcp/devtools_serp_scraper.ts` 等にブラウザ自動化ロジック
- 入力: KW, 取得したい件数, 追加クエリ（例: "痛み", "費用"）
- 出力: JSON
  ```json
  {
    "keyword": "矯正歯科",
    "serp": {
      "organic": [
        {
          "rank": 1,
          "title": "矯正歯科の費用比較｜○○歯科",
          "url": "https://example.com/",
          "snippet": "…"
        }
      ],
      "peopleAlsoAsk": ["矯正歯科 痛み いつまで", …]
    },
    "timestamp": "2025-08-11T00:00:00Z"
  }
  ```
- 各URLの一部本文や主要見出しを取得し、LLMプロンプトで使える形に整形目標（必要ならテキスト量制限）

### 3. LLM API 呼び出し
- `scripts/llm_content_generator.py` を新規作成
- 入力: SERP JSON, 既存テンプレート（Tipsテーマ、比較項目、CTA要件）
- プロンプト例
  ```
  [SYSTEM] あなたは医療広告の専門ライターです。…
  [USER] 入力データ: {SERP_JSON}。
  出力フォーマット:
  {
    "hero": {"headline": "…", "subcopy": "…"},
    "tips": [ … ],
    "comparison": {"項目キー": "テキスト"},
    "notes": "注意事項"
  }
  ```
- 出力JSONの検証（スキーマチェック）

### 4. ファイル反映ロジック
- `generate_lp_from_template.py` 内で以下を呼び出す
  - `apply_generated_content()` … LLM生成結果を `data/site-common-texts.csv`, `data/clinic-texts.csv`, `columns/columns.js` へ反映
  - 既存テンプレートの固定文言はプレースホルダ → フォールバック文言へ（例: `{{TIPS_TAB1}}`）
  - 反映後、自動整形（Prettier/CSV整形）を実施

### 5. ワークフローYAML生成
- 既存テンプレートを利用
- LLM出力のサマリ（競合差別化ポイントなど）を追記
- SERP取得時刻、参照URLリストを `research.serp_snapshot` に差し込む

### 6. ログ / 検証フロー
- `logs/auto_lp/<keyword>-<timestamp>.json` に以下を保存
  - SERP生データ
  - LLM入出力
  - 生成されたファイル一覧
  - エラー情報
- QAステップを `post_launch_checklist` に追記し、半自動テスト（リンクチェック、HTMLバリデーション等）実行スクリプトを別途用意可能

## 実装ステップ
1. **テンプレート修正**
   - `data/site-common-texts.csv` などに `{{PLACEHOLDER}}` を導入し、スクリプト側で埋める
2. **DevTools MCP スクリプト作成**
   - `mcp/devtools-serp/index.mjs` に検索 → HTML解析 → JSON出力を実装
   - CLIから `node mcp/devtools-serp/index.mjs --keyword "…"` で動作確認
   - `.mcp.json` に `devtools-serp` サーバーを登録し、`--stdio` で JSON-Line インタフェースを提供
3. **LLM コンテンツ生成モジュール**
   - APIキーやモデル選択を設定ファイルで管理（例: `.env`）
   - テンプレート JSON を読み込み、SERPデータを埋めてプロンプト送信
4. **`generate_lp_from_template.py` 拡張**
   - `--auto-content` フラグ追加
   - DevTools MCP → LLM → ファイル反映 の呼び出し順を組み込み
5. **テスト・検証**
   - Dry run モードでJSONのみ確認
   - 小さなKWで実際にLP生成し、文面や差し替え箇所を目視＋HTML/testを実施
6. **リリース運用**
   - Git管理: 生成されたLPとYAMLをコミット
   - Cron/CI等に組み込む場合はAPI利用制限・料金を考慮

## 運用留意点
- 医療広告表現の法規制遵守が必要なため、自動生成後のレビュー工程を明示（例: `docs/review_checklist.md`）
- LLM出力のホールユースを記録し、誤情報があった場合の責任範囲を整理
- SERPスクレイピングの利用規約順守、アクセス頻度の制御（リクエスト間隔調整）

---
この設計書をベースに、各モジュールの実装を進めていきます。
