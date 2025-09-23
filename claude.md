# CLAUDE.md - マウスピース比較サイト最適化プロジェクト

## 🎯 最優先オーダー
**Lighthouse Performance Score 90点以上を達成する**

## 📊 現在の状況
- **現在のスコア**: 78点（目標まであと12点）
- **初期スコア**: 52点（26点改善済み）
- **目標スコア**: 90点以上

## 🚨 主要な問題点
1. **LCP (Largest Contentful Paint)**: 4.6秒 → 目標: 2.5秒以下
2. **FCP (First Contentful Paint)**: 1.4秒 → 目標: 1.0秒以下
3. **Speed Index**: 2.7秒 → 目標: 2.0秒以下
4. **CLS**: 0.122（許容範囲内）
5. **TBT**: 0ms（良好）

## 📋 実行すべきタスク（優先順位順）

### Phase 1: 即座の改善（目標: 85点）
- [ ] **LCP画像の最適化**
  - hero-image.webpのサイズを50%削減
  - 低品質プレースホルダー画像の実装
  - fetchpriorityとdecodingの最適化

- [ ] **Critical CSSの抽出**
  - Above-the-fold CSSのみインライン化
  - 残りのCSSを非同期読み込み

- [ ] **初期HTMLの軽量化**
  - DOM要素を500以下に削減
  - 非表示要素の遅延生成

### Phase 2: JavaScript最適化（目標: 88点）
- [ ] **app-lite.min.jsの極小化**
  - 現在1.4KB → 1KB以下へ
  - 不要な機能を完全削除

- [ ] **動的インポート実装**
  - コンポーネントごとの分割
  - IntersectionObserverで必要時のみ読み込み

### Phase 3: 根本的改善（目標: 90点+）
- [ ] **Service Worker実装**
  - 静的リソースのキャッシュ
  - オフライン対応

- [ ] **画像の事前最適化**
  - srcsetとpicture要素の実装
  - AVIF形式への移行検討

## 💻 実行コマンド

```bash
# ビルドと測定を一括実行
npm run build && npx lighthouse http://localhost:4325/ --only-categories=performance

# 詳細なメトリクス確認
npx lighthouse http://localhost:4325/ --only-categories=performance --output=json | jq '.audits | {fcp: .["first-contentful-paint"].displayValue, lcp: .["largest-contentful-paint"].displayValue, cls: .["cumulative-layout-shift"].displayValue, tbt: .["total-blocking-time"].displayValue, si: .["speed-index"].displayValue}'

# バンドルサイズ確認
ls -lh dist/_astro/ public/*.js public/*.min.js
```

## ⚠️ 重要な制約事項
**絶対に守るべきこと:**
1. **データ読み込みを必ず実装** - DataManagerが正常動作すること
   - ⚠️ **現在、データ読み込みができておらず、サイトが表示されていない**
   - `/common_data/data/site-common-texts.json`の読み込み必須
   - `/common_data/data/mouthpiece_clinics_data_001.json`の読み込み必須
2. **サイト表示の維持** - クリニックデータが正しく表示されること
3. **ユーザー体験の維持** - 機能が正常に動作すること

## 🔴 現在の重大な問題
**データ読み込みが機能していないため、サイトが正常に表示されていません。**
- app-lite.min.jsでDataManagerの初期化と読み込みが必要
- JSONデータの取得とDOM更新の連携が必要
- これを修正しないと、パフォーマンス改善の意味がありません

## 🎖️ 成功基準
- Lighthouse Performance Score: **90点以上**
- FCP: **1.0秒以下**
- LCP: **2.5秒以下**
- Speed Index: **2.0秒以下**
- CLS: **0.1以下**
- TBT: **200ms以下**

## 📈 これまでの改善内容
1. ✅ Font Awesome CDN削除（絵文字に置き換え）
2. ✅ app-lite.min.js作成（268KB → 1.4KB、99.5%削減）
3. ✅ 画像のWebP化とlazy loading実装
4. ✅ CSSインライン化（render-blocking削除）
5. ✅ requestIdleCallbackによる遅延読み込み
6. ✅ Terser最適化（3パス圧縮）
7. ✅ HTTPキャッシュヘッダー設定

## 🚀 次のアクション
1. **🔴 最優先: データ読み込みの修正**
   - app-lite.min.jsが正しくDataManagerを初期化しているか確認
   - JSONデータが正常に取得されているか確認
   - DOMへの反映が正しく行われているか確認
2. **データ読み込み修正後、LCP画像の最適化を実施**
3. **各改善後に必ずLighthouse測定**
4. **90点達成まで継続的に改善**

---
*最終更新: 2025-09-22*
*作成者: Claude*
*目的: Lighthouse Performance Score 90点達成*


## Setup
- pip install -U pytest ruff mypy
- pip install -e .

## Run tests
- pytest -q

## Lint / Type check
- ruff check .
- mypy .

**Motto:** "Small, clear, safe steps — always grounded in real docs."

---

## Principles

* Keep changes minimal, safe, and reversible.
* Prefer clarity over cleverness; simplicity over complexity.
* Avoid new dependencies unless necessary; remove when possible.

---

## Knowledge & Libraries

* Use `context7` (MCP server) to fetch current docs before coding.
* Call `resolve-library-id`, then `get-library-docs` to verify APIs.
* If uncertain, pause and request clarification.

---

## Workflow

* **Plan:** Share a short plan before major edits; prefer small, reviewable diffs.
* **Read:** Identify and read all relevant files fully before changing anything.
* **Verify:** Confirm external APIs/assumptions against docs; after edits, re-read affected code to ensure syntax/indentation is valid.
* **Implement:** Keep scope tight; write modular, single-purpose files.
* **Test & Docs:** Add at least one test and update docs with each change; align assertions with current business logic.
* **Reflect:** Fix at the root cause; consider adjacent risks to prevent regressions.

---

## Code Style & Limits

* **Files:** ≤ 300 LOC; keep modules single-purpose.
* **Comments:** Add a brief header at the top of every file (where, what, why). Prefer clear, simple explanations; comment non-obvious logic.
* **Commenting habit:** Err on the side of more comments; include rationale, assumptions, and trade-offs.
* **Configuration:** Centralize runtime tunables in `config.py`; avoid magic numbers in code and tests. Pull defaults from config when wiring dependencies.
* **Simplicity:** Implement exactly what's requested—no extra features.

---

## Collaboration & Accountability

* Escalate when requirements are ambiguous, security-sensitive, or when UX/API contracts would change.
* Tell me when you are not confident about your code, plan, or fix. Ask questions or help, when your confidence level is below 80%.
    * Assume that you get -4 points for wrong code and/or breaking changes. +1 point for successful changes. 0 point when you honestly tell me you're uncertain.
* Value correctness over speed (a wrong change costs more than a small win).

---

## Quick Checklist

Plan → Read files → Verify docs → Implement → Test + Docs → Reflect