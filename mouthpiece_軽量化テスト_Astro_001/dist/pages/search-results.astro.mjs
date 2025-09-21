import { c as createComponent, r as renderComponent, a as renderTemplate, F as Fragment, m as maybeRenderHead } from '../chunks/astro/server_6cs0tMQa.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BupssEwr.mjs';
/* empty css                                          */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$SearchResults = createComponent(async ($$result, $$props, $$slots) => {
  const pageTitle = "\u691C\u7D22\u7D50\u679C | \u533B\u7642\u30C0\u30A4\u30A8\u30C3\u30C8\u6BD4\u8F03.com";
  const pageDescription = "\u533B\u7642\u30C0\u30A4\u30A8\u30C3\u30C8\u30AF\u30EA\u30CB\u30C3\u30AF\u306E\u691C\u7D22\u7D50\u679C\u30DA\u30FC\u30B8\u3067\u3059\u3002\u5BFE\u5FDC\u90E8\u4F4D\u3001\u5730\u57DF\u3001\u5E97\u8217\u6570\u3067\u7D5E\u308A\u8FBC\u3093\u3067\u6700\u9069\u306A\u30AF\u30EA\u30CB\u30C3\u30AF\u3092\u898B\u3064\u3051\u3089\u308C\u307E\u3059\u3002";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": pageTitle, "description": pageDescription, "data-astro-cid-6ouf65ld": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="search-results-page" data-astro-cid-6ouf65ld> <div class="search-header" data-astro-cid-6ouf65ld> <h1 class="search-title" data-astro-cid-6ouf65ld>検索結果</h1> <p class="search-subtitle" data-astro-cid-6ouf65ld>対応部位、地域、店舗数で絞り込めます</p> </div> <form id="search-form" class="filters-container" data-astro-cid-6ouf65ld> <div class="filter-section" data-astro-cid-6ouf65ld> <label class="filter-label" data-astro-cid-6ouf65ld>キーワード</label> <input id="keyword" type="text" class="input" placeholder="例: リフトアップ、東京など" data-astro-cid-6ouf65ld> </div> <div class="actions" data-astro-cid-6ouf65ld> <button type="submit" class="btn btn-primary" data-astro-cid-6ouf65ld>この条件で検索</button> <button type="button" id="reset" class="btn" data-astro-cid-6ouf65ld>リセット</button> </div> </form> <div id="results" class="search-results" data-astro-cid-6ouf65ld></div> </div> `, "head": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "head" }, { "default": async ($$result3) => renderTemplate(_a || (_a = __template([' <link rel="preconnect" href="https://fonts.googleapis.com"> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet"> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"> <link rel="stylesheet" href="/styles.css"> <link rel="icon" type="image/png" href="/common_data/images/favicon.png">    <script defer src="/app.js"><\/script> <script defer src="/force-center-alignment.js"><\/script> <script defer src="/tracking-params.js"><\/script> <script defer src="/url-tracking.js"><\/script>  ']))) })}` })}`;
}, "/Users/hattaryoga/Library/CloudStorage/GoogleDrive-naoyuki.uebayashi@senjinholdings.com/\u30DE\u30A4\u30C8\u3099\u30E9\u30A4\u30D5\u3099/GoogleSearchAdsSite/\u77EF\u6B63\u6B6F\u79D1\u304A\u3059\u3059\u3081\u6BD4\u8F03/GSA_Mouthpiece/mouthpiece_\u8EFD\u91CF\u5316\u30C6\u30B9\u30C8_Astro_001/src/pages/search-results.astro", void 0);

const $$file = "/Users/hattaryoga/Library/CloudStorage/GoogleDrive-naoyuki.uebayashi@senjinholdings.com/マイドライブ/GoogleSearchAdsSite/矯正歯科おすすめ比較/GSA_Mouthpiece/mouthpiece_軽量化テスト_Astro_001/src/pages/search-results.astro";
const $$url = "/search-results.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$SearchResults,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
