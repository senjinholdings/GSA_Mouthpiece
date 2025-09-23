# Base Path Handling

このリポジトリでは Astro でビルドした静的ファイルをサブディレクトリ配下に配置するケースが増えています。そのため、`public/app.js` などブラウザ側のバンドルでも `window.__BASE_PATH__` を考慮しつつ JSON や画像へのパスを解決する仕組みを追加しました。

- 追加した `resolveAssetPath`/`withBasePath` は、スキーム付き URL や `data:` URI には影響を与えません。
- ベースパスが `/` の場合は従来通りのパスを返し、`/foo/bar/` のような構成では `/foo/bar/...` に正規化します。
- テスト (`tests/asset-path.test.ts`) で代表的なパターンを検証しています。

これにより、`/common_data/...` などの静的 JSON を利用する初期描画が、サブディレクトリ配備後も安定して機能します。
