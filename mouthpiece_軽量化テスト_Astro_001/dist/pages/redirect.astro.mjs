import { c as createComponent, r as renderComponent, a as renderTemplate, F as Fragment, m as maybeRenderHead } from '../chunks/astro/server_6cs0tMQa.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BupssEwr.mjs';
/* empty css                                    */
export { renderers } from '../renderers.mjs';

const $$Redirect = createComponent(async ($$result, $$props, $$slots) => {
  const pageTitle = "\u516C\u5F0F\u30B5\u30A4\u30C8\u3078\u79FB\u52D5\u4E2D...";
  const pageDescription = "\u516C\u5F0F\u30B5\u30A4\u30C8\u3078\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8\u3057\u3066\u3044\u307E\u3059\u3002";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": pageTitle, "description": pageDescription, "data-astro-cid-b3zmuepv": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="redirect-container" data-astro-cid-b3zmuepv> <img id="clinic-logo" class="clinic-logo" src="" alt="" style="display:none;" data-astro-cid-b3zmuepv> <div class="loading-animation" data-astro-cid-b3zmuepv></div> <h1 id="redirect-message" class="redirect-message" data-astro-cid-b3zmuepv>公式サイトへ移動中...</h1> <p id="redirect-description" class="redirect-description" data-astro-cid-b3zmuepv>
まもなく自動的に公式サイトへリダイレクトします。<br data-astro-cid-b3zmuepv>
移動しない場合は下のボタンをクリックしてください。
</p> <div class="countdown" id="countdown" data-astro-cid-b3zmuepv>2秒後に移動します...</div> <a href="#" id="manual-link" class="manual-link" style="display:none;" data-astro-cid-b3zmuepv>公式サイトへ</a> </div>  `, "head": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "head" }, { "default": async ($$result3) => renderTemplate` <meta name="referrer" content="unsafe-url"> <link rel="icon" type="image/png" href="/common_data/images/favicon.png"> <meta http-equiv="Content-Security-Policy" content="referrer unsafe-url">  ` })}` })}`;
}, "/Users/hattaryoga/Library/CloudStorage/GoogleDrive-naoyuki.uebayashi@senjinholdings.com/\u30DE\u30A4\u30C8\u3099\u30E9\u30A4\u30D5\u3099/GoogleSearchAdsSite/\u77EF\u6B63\u6B6F\u79D1\u304A\u3059\u3059\u3081\u6BD4\u8F03/GSA_Mouthpiece/mouthpiece_\u8EFD\u91CF\u5316\u30C6\u30B9\u30C8_Astro_001/src/pages/redirect.astro", void 0);

const $$file = "/Users/hattaryoga/Library/CloudStorage/GoogleDrive-naoyuki.uebayashi@senjinholdings.com/マイドライブ/GoogleSearchAdsSite/矯正歯科おすすめ比較/GSA_Mouthpiece/mouthpiece_軽量化テスト_Astro_001/src/pages/redirect.astro";
const $$url = "/redirect.html";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Redirect,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
