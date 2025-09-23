## コーディングスタイルとガイドライン
- Astro/TypeScript/JavaScript の混在。Astro ファイルでは `const` 関数・アロー関数でツール関数を定義し、直接 DOM 操作を行うスタイル。
- Tailwind ユーティリティを基本としつつ、複雑な見た目はインライン `<style>` か `@layer` で定義。
- 日本語向けのシステムフォントスタックを優先 (`Noto Sans JP`, `Hiragino Sans` 等)。
- `BaseLayout` で `lang="ja"`、メタ情報、`normalizedBasePath` を共有するため、新規ページも同様の補助関数 (`asset`) を再利用する想定。
- Vitest のテストは `describe/it/expect`（globals）形式。`tests/setup.ts` で `@testing-library/jest-dom` を読み込む。