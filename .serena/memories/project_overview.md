## プロジェクト概要
- Astro 4 + TypeScript ベースの静的サイト。日本語の医療ダイエット比較サイトで、膨大な HTML/CSS/JS を `src/pages/*.astro` に直接保持している。
- Tailwind CSS を利用したユーティリティスタイルと、インライン CSS/JavaScript による動的挙動を併用。
- `src/layouts/BaseLayout.astro` が全ページの共通レイアウトを提供し、config.js などの外部スクリプトを読み込む設計。

## ディレクトリ構成の要点
- `src/pages/index.astro` / `redirect.astro` / `search-results.astro`: 主要ページ。大量のインラインスタイルと DOM 操作ロジックを含む。
- `src/layouts/BaseLayout.astro`: HTML テンプレート・メタタグ定義とベースとなるスクリプト設定。
- `src/styles/global.css`: Tailwind のレイヤー定義と一部カスタムユーティリティ。
- `public/`: 画像や外部スクリプト (`app.js`, `common_data/` など) を配置するアセット領域。
- `tests/`: Vitest による簡易テストとセットアップ (`happy-dom` 環境)。