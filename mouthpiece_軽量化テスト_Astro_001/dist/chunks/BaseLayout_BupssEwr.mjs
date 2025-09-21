import { c as createComponent, b as createAstro, d as addAttribute, e as renderSlot, f as renderHead, a as renderTemplate } from './astro/server_6cs0tMQa.mjs';
import 'kleur/colors';
import 'html-escaper';
import 'clsx';

const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title = "",
    description = "",
    lang = "ja",
    bodyClass = ""
  } = Astro2.props;
  return renderTemplate`<html${addAttribute(lang, "lang")}> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${title && renderTemplate`<title>${title}</title>`}${description && renderTemplate`<meta name="description"${addAttribute(description, "content")}>`}${renderSlot($$result, $$slots["head"])}${renderHead()}</head> <body${addAttribute(bodyClass, "class")}> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/hattaryoga/Library/CloudStorage/GoogleDrive-naoyuki.uebayashi@senjinholdings.com/\u30DE\u30A4\u30C8\u3099\u30E9\u30A4\u30D5\u3099/GoogleSearchAdsSite/\u77EF\u6B63\u6B6F\u79D1\u304A\u3059\u3059\u3081\u6BD4\u8F03/GSA_Mouthpiece/mouthpiece_\u8EFD\u91CF\u5316\u30C6\u30B9\u30C8_Astro_001/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
