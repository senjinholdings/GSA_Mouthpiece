// where: public/app-lite.js
// what: Lightweight DataManager for critical path rendering.
// why: Add base-path-aware asset resolution so JSON loads when served from subdirectories.

(function() {
    'use strict';

    const BASE_PATH_RAW = window.__BASE_PATH__ ?? window.SITE_CONFIG?.basePath ?? '/';
    const BASE_PATH_PREFIX = BASE_PATH_RAW === '/' || BASE_PATH_RAW === '' ? '' : BASE_PATH_RAW.replace(/\/+$/, '');
    const withBasePath = (resource) => {
        if (typeof resource !== 'string' || resource.length === 0) {
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


    const RegionUtils = window.RegionUtils ?? (() => {
        const normalizeRegionId = (value) => {
            if (value == null) {
                return null;
            }
            const match = String(value).match(/\d+/);
            if (!match) {
                return null;
            }
            return match[0].padStart(3, '0');
        };

        const stripBasePath = (pathname) => {
            if (typeof pathname !== 'string' || pathname.length === 0) {
                return '/';
            }
            if (BASE_PATH_PREFIX && pathname.startsWith(BASE_PATH_PREFIX)) {
                const remainder = pathname.slice(BASE_PATH_PREFIX.length);
                return remainder.startsWith('/') ? remainder : `/${remainder}`;
            }
            return pathname;
        };

        const detectRegionIdFromPath = (pathname) => {
            if (typeof pathname !== 'string') {
                return null;
            }
            const relative = stripBasePath(pathname).replace(/^\/+/, '');
            if (!relative) {
                return null;
            }
            const segments = relative.split('/').filter(Boolean);
            if (segments.length === 0) {
                return null;
            }
            if (segments[0].toLowerCase() === 'r' && segments[1]) {
                return normalizeRegionId(segments[1]);
            }
            const match = segments[0].match(/^r[-_]?(\d{1,3})$/i);
            if (match) {
                return normalizeRegionId(match[1]);
            }
            return null;
        };

        const detectRegionIdFromQuery = (search) => {
            if (typeof search !== 'string') {
                return null;
            }
            try {
                const params = new URLSearchParams(search);
                return normalizeRegionId(params.get('region_id'));
            } catch (_) {
                return null;
            }
        };

        const rememberRegionId = (regionId) => {
            const normalized = normalizeRegionId(regionId);
            if (!normalized) {
                return null;
            }
            if (typeof window !== 'undefined') {
                window.__REGION_ID__ = normalized;
            }
            return normalized;
        };

        const determineRegionId = ({ fallback = '013', prefer = 'path' } = {}) => {
            if (typeof window === 'undefined') {
                return fallback;
            }
            const stored = normalizeRegionId(window.__REGION_ID__);
            if (stored) {
                return stored;
            }
            const fromPath = detectRegionIdFromPath(window.location.pathname || '');
            const fromQuery = detectRegionIdFromQuery(window.location.search || '');
            const candidate = prefer === 'query'
                ? (fromQuery || fromPath)
                : (fromPath || fromQuery);
            if (candidate) {
                rememberRegionId(candidate);
                return candidate;
            }
            return fallback;
        };

        return {
            normalizeRegionId,
            detectRegionIdFromPath,
            detectRegionIdFromQuery,
            determineRegionId,
            rememberRegionId,
        };
    })();

    if (typeof window !== 'undefined' && !window.RegionUtils) {
        window.RegionUtils = RegionUtils;
    }

    // DataManager - 最小限の実装
    class DataManager {
        constructor() {
            this.commonTexts = {};
            this.clinics = [];
            this.rankings = {};
            this.clinicTexts = {};
            this.loaded = false;
        }

        async loadData(regionId = '013') {
            try {
                // 並列でデータを取得
                const [commonTexts, clinicsData] = await Promise.all([
                    fetch(withBasePath('/common_data/data/site-common-texts.json')).then(r => r.json()),
                    fetch(withBasePath('/common_data/data/mouthpiece_clinics_data_001.json')).then(r => r.json())
                ]);

                this.commonTexts = commonTexts;
                this.clinics = clinicsData.clinics || [];
                this.rankings = clinicsData.rankings || {};
                this.clinicTexts = clinicsData.clinicTexts || {};
                this.loaded = true;

                // イベントを発火
                window.dispatchEvent(new CustomEvent('dataManagerReady'));
                return true;
            } catch (error) {
                console.error('Data loading error:', error);
                return false;
            }
        }

        getText(key, defaultValue = '') {
            return this.commonTexts[key] || defaultValue;
        }

        getClinicById(clinicId) {
            return this.clinics.find(c => c.id === clinicId);
        }

        getClinicCodeById(clinicId) {
            const clinic = this.getClinicById(clinicId);
            return clinic ? clinic.code : null;
        }

        getClinicText(clinicCode, key, defaultValue = '') {
            const clinic = this.clinics.find(c => c.code === clinicCode);
            return clinic && clinic[key] ? clinic[key] : defaultValue;
        }

        getClinicHeaderConfig() {
            const config = this.clinicTexts && this.clinicTexts['比較表ヘッダー設定'];
            return config && typeof config === 'object' ? config : {};
        }

        getRankingsByRegion(regionId = '013') {
            return this.rankings[regionId] || [];
        }
    }

    // URLパラメータハンドラ - 最小限の実装
    class UrlParamHandler {
        getParam(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        }

        getRegionId() {
            return RegionUtils.determineRegionId();
        }
    }

    // グローバルに公開
    window.DataManager = DataManager;
    window.dataManager = new DataManager();
    window.urlParamHandler = new UrlParamHandler();

    // ページ読み込み時にデータを自動ロード
    document.addEventListener('DOMContentLoaded', function() {
        const regionId = window.urlParamHandler.getRegionId();
        window.dataManager.loadData(regionId);
    });

    // 基本的なユーティリティ関数
    window.getClinicUrlFromConfig = function(clinicId, rank = 1) {
        if (window.dataManager) {
            const clinicCode = window.dataManager.getClinicCodeById(clinicId);
            if (clinicCode) {
                const urlKey = `遷移先URL（${rank}位）`;
                const url = window.dataManager.getClinicText(clinicCode, urlKey, '');
                if (url) return url;
            }
        }
        return '#';
    };

})();
