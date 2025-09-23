"use strict";

// where: public/app-complete.js
// what: Critical path DataManager bootstrap for initial fold rendering.
// why: Normalize asset/data URLs to honour deployments under nested base paths.

(function() {
    "use strict";

    const BASE_PATH_RAW = window.__BASE_PATH__ ?? window.SITE_CONFIG?.basePath ?? '/';
    const BASE_PATH_PREFIX = BASE_PATH_RAW === '/' || BASE_PATH_RAW === '' ? '' : BASE_PATH_RAW.replace(/\/+$/, '');
    const withBasePath = resource => {
        if (typeof resource !== "string" || resource.length === 0) {
            return resource;
        }
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|mailto:|tel:)/i.test(resource)) {
            return resource;
        }
        if (!BASE_PATH_PREFIX) {
            return resource.startsWith('./') ? resource.slice(2) : resource;
        }
        let normalized = resource.startsWith('./') ? resource.slice(2) : resource;
        if (!normalized.startsWith('/')) {
            normalized = `/${normalized}`;
        }
        return `${BASE_PATH_PREFIX}${normalized}`;
    };
    class DataManager {
        constructor() {
            this.commonTexts = {}, this.clinics = [], this.rankings = {}, this.loaded = !1, this.clinicTexts = {};
        }
        async loadData(t = "013") {
            try {
                const [n, i] = await Promise.all([
                    fetch(withBasePath("/common_data/data/site-common-texts.json")).then(a => a.json()),
                    fetch(withBasePath("/common_data/data/mouthpiece_clinics_data_001.json")).then(a => a.json())
                ]);
                return this.commonTexts = n, this.clinics = i.clinics || [], this.rankings = i.rankings || {}, 
                this.clinicTexts = i.clinicTexts || {},
                this.loaded = !0, window.dispatchEvent(new CustomEvent("dataManagerReady")), this.updateDOM(), 
                !0;
            } catch (n) {
                return console.error("Data loading error:", n), !1;
            }
        }
        updateDOM() {
            if (!this.loaded) return;
            const t = this.getRankingsByRegion("013");
            if (t && t.length > 0) {
                const n = this.getClinicById(t[0]);
                if (n) {
                    const i = document.getElementById("first-choice-clinic-name");
                    i && (i.textContent = n.name || "");
                    const a = document.getElementById("first-choice-title-clinic-name");
                    a && (a.textContent = n.name || "");
                    const b = document.getElementById("first-choice-banner-image");
                    b && n["バナー画像"] && (b.src = withBasePath(n["バナー画像"]));
                    const c = document.getElementById("first-choice-info-logo");
                    c && n["ロゴ画像"] && (c.src = withBasePath(n["ロゴ画像"]));
                    const d = document.getElementById("first-choice-campaign-text");
                    d && n["キャンペーン内容（赤タグ内）"] && (d.innerHTML = n["キャンペーン内容（赤タグ内）"]);
                    const e = document.getElementById("first-choice-achievement-text");
                    e && n["実績テキスト（ボタン上）"] && (e.textContent = n["実績テキスト（ボタン上）"]);
                    const f = document.getElementById("first-choice-cta-text");
                    f && (f.textContent = n["CTAテキスト（ボタン内）"] || "公式サイトへ");
                    const g = document.getElementById("first-choice-cta-link");
                    if (g && n.code) {
                        const h = this.getClinicText(n.code, "遷移先URL（1位）", "");
                        h && (g.href = h);
                    }
                    const j = document.getElementById("first-choice-disclaimer-title");
                    j && n["注意事項タイトル"] && (j.textContent = n["注意事項タイトル"]);
                    const k = document.getElementById("first-choice-points");
                    if (k && n["ポイント1"]) {
                        k.innerHTML = "";
                        for (let l = 1; l <= 3; l++) {
                            const m = n[`ポイント${l}`];
                            const o = n[`ポイント説明${l}`];
                            if (m && o) {
                                const p = document.createElement("div");
                                p.className = "merit_card";
                                p.innerHTML = `<div class="merit_icon"><span class="point_no">${l}</span></div><div class="merit_header">${m}</div><div class="merit_description">${o}</div>`;
                                k.appendChild(p);
                            }
                        }
                    }
                }
            }
            t.forEach((n, i) => {
                const a = this.getClinicById(n);
                if (a) {
                    const r = i + 1;
                    const s = document.querySelector(`.ranking-${r}`);
                    if (s) {
                        const t = s.querySelector(".clinic-name");
                        t && (t.textContent = a.name || "");
                        const u = s.querySelector(".clinic-logo");
                        u && a["ロゴ画像"] && (u.src = withBasePath(a["ロゴ画像"]));
                        const v = s.querySelector(".clinic-description");
                        v && a["説明文"] && (v.textContent = a["説明文"]);
                        const w = s.querySelector(".clinic-link");
                        if (w && a.code) {
                            const x = this.getClinicText(a.code, `遷移先URL（${r}位）`, "");
                            x && (w.href = x);
                        }
                    }
                }
            });
        }
        getText(t, n = "") {
            return this.commonTexts[t] || n;
        }
        getClinicById(t) {
            return this.clinics.find(n => n.id === t);
        }
        getClinicCodeById(t) {
            const n = this.getClinicById(t);
            return n ? n.code : null;
        }
        getClinicText(t, n, i = "") {
            const a = this.clinics.find(c => c.code === t);
            return a && a[n] ? a[n] : i;
        }
        getClinicHeaderConfig() {
            const config = this.clinicTexts && this.clinicTexts["比較表ヘッダー設定"];
            return config && typeof config === "object" ? config : {};
        }
        getRankingsByRegion(t = "013") {
            return this.rankings[t] || [];
        }
    }
    class UrlParamHandler {
        getParam(t) {
            return new URLSearchParams(window.location.search).get(t);
        }
        getRegionId() {
            return this.getParam("region_id") || "013";
        }
    }
    window.DataManager = DataManager, window.dataManager = new DataManager, window.urlParamHandler = new UrlParamHandler, 
    document.addEventListener("DOMContentLoaded", function() {
        const e = window.urlParamHandler.getRegionId();
        window.dataManager.loadData(e);
    }), window.getClinicUrlFromConfig = function(e, t = 1) {
        if (window.dataManager) {
            const n = window.dataManager.getClinicCodeById(e);
            if (n) {
                const i = `遷移先URL（${t}位）`, a = window.dataManager.getClinicText(n, i, "");
                if (a) return a;
            }
        }
        return "#";
    };
})();
