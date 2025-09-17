// クリニックURLをCSVデータベースから動的に取得
function getClinicUrlFromConfig(clinicId, rank = 1) {
    // DataManagerから動的に取得
    if (window.dataManager) {
        const clinicCode = window.dataManager.getClinicCodeById(clinicId);
        if (clinicCode) {
            // CSVデータベースから遷移先URLを取得
            const urlKey = `遷移先URL（${rank}位）`;
            const url = window.dataManager.getClinicText(clinicCode, urlKey, '');
            if (url) {
                return url;
            }
        }
    }
    
    // デフォルトURL（データが見つからない場合）
    return 'https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=a6640dkh37648h88&param2=[ADID_PLACEHOLDER]&param3=[GCLID_PLACEHOLDER]';
}

// URLパラメータ処理クラス
class UrlParamHandler {
    getParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    setParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }

    getAllParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    getRegionId() {
        return this.getParam('region_id') || '013'; // デフォルトは東京
    }

    updateRegionId(regionId) {
        this.setParam('region_id', regionId);
    }

    // クリニックURLを取得（CSVから直接URLを取得し、パラメータを適切に処理）
    getClinicUrlWithRegionId(clinicId, rank = 1) {
        // DataManagerが初期化されているか確認
        if (!window.dataManager) {
            return '#';
        }
        
        // パラメータをlocalStorageに保存（サーバーがURLパラメータを削除する対策）
        const regionId = this.getRegionId();
        const redirectParams = {
            clinic_id: clinicId,
            rank: rank,
            region_id: regionId || '013'
        };
        
        // クリックイベントでlocalStorageに保存するため、データ属性として埋め込む
        // 実際の保存はクリック時に行う
        const redirectUrl = new URL('./redirect.html', window.location.origin + window.location.pathname);
        
        // URLパラメータも念のため設定（サーバーが保持する場合に備えて）
        redirectUrl.searchParams.set('clinic_id', clinicId);
        redirectUrl.searchParams.set('rank', rank);
        if (regionId) {
            redirectUrl.searchParams.set('region_id', regionId);
        }
        
        // データ属性用のJSON文字列を作成
        const dataJson = JSON.stringify(redirectParams);
        
        // カスタムデータ属性として埋め込むため、特殊なハッシュを使用
        redirectUrl.hash = `params=${encodeURIComponent(dataJson)}`;
        
        return redirectUrl.toString();
    }

    // クリニック名からURLを生成してregion_idパラメータを付与するヘルパー関数（リダイレクトページ経由）
    getClinicUrlByNameWithRegionId(clinicName) {
        // DataManagerから動的にクリニックコードを取得
        let clinicCode = clinicName;
        
        // グローバルのdataManagerを使用
        const dataManager = window.dataManager;
        
        // clinicNameがクリニック名の場合、クリニックコードに変換
        if (dataManager) {
            const clinics = dataManager.clinics || [];
            const clinic = clinics.find(c => c.name === clinicName || c.code === clinicName);
            if (clinic) {
                clinicCode = clinic.code;
            }
        }
        
        // redirect.htmlへのパスを生成
        if (!clinicCode) return '#';
        
        // DataManagerからクリニックIDを取得
        let clinicId = null;
        let rank = 1; // デフォルトは1位
        
        if (dataManager) {
            const clinics = dataManager.clinics || [];
            const clinic = clinics.find(c => c.code === clinicCode);
            if (clinic) {
                clinicId = clinic.id;
                // ランキングから順位を取得（getRankingsByRegionメソッドを直接使用）
                try {
                    if (dataManager.getRankingsByRegion && typeof dataManager.getRankingsByRegion === 'function') {
                        const rankings = dataManager.getRankingsByRegion(this.getRegionId());
                        const rankInfo = rankings.find(r => r.clinicId == clinicId);
                        if (rankInfo) {
                            rank = rankInfo.rank;
                        }
                    } else {
                        // getRankingsByRegionが存在しない場合は、rankingsから直接取得
                        const regionId = this.getRegionId();
                        if (dataManager.rankings && dataManager.rankings[regionId]) {
                            const regionRankings = dataManager.rankings[regionId];
                            // regionRankingsから該当するクリニックの順位を探す
                            const rankingEntries = Object.entries(regionRankings.ranks || {});
                            for (const [position, cId] of rankingEntries) {
                                if (cId == clinicId) {
                                    rank = parseInt(position.replace('no', '')) || 1;
                                    break;
                                }
                            }
                        }
                    }
                } catch (e) {
                    rank = 1; // エラー時はデフォルトで1位
                }
            }
        }
        
        if (!clinicId) return '#';
        
        // redirect.htmlへのパスを生成
        const regionId = this.getRegionId();
        let redirectUrl = `./redirect.html?clinic_id=${clinicId}&rank=${rank}`;
        if (regionId) {
            redirectUrl += `&region_id=${regionId}`;
        }
        
        // UTMパラメータなどを追加
        const urlParams = new URLSearchParams(window.location.search);
        const utmCreative = urlParams.get('utm_creative');
        const gclid = urlParams.get('gclid');
        
        if (utmCreative) {
            redirectUrl += `&utm_creative=${encodeURIComponent(utmCreative)}`;
        }
        if (gclid) {
            redirectUrl += `&gclid=${encodeURIComponent(gclid)}`;
        }
        
        return redirectUrl;
    }

    // 直フォームの遷移先URL（存在しない場合は通常のリダイレクトURLにフォールバック）
    getDirectFormUrl(clinicId, rank = 1) {
        try {
            const dm = window.dataManager;
            if (!dm) return this.getClinicUrlWithRegionId(clinicId, rank);
            const clinicCode = dm.getClinicCodeById(clinicId);
            if (!clinicCode) return this.getClinicUrlWithRegionId(clinicId, rank);
            // ランク別キーを最優先で参照
            const rankKeys = [
                `直フォームの遷移先URL（${rank}位）`,
                `直フォーム遷移先URL（${rank}位）`,
                `直フォームURL（${rank}位）`
            ];
            for (let i=0;i<rankKeys.length;i++){
                const v = dm.getClinicText(clinicCode, rankKeys[i], '').trim();
                if (v) return v;
            }
            // 共通キー
            const candidates = ['直フォームURL','直フォーム遷移先URL','無料相談フォームURL','予約フォームURL','フォームURL','問い合わせフォームURL','CTA直リンクURL'];
            for (let i = 0; i < candidates.length; i++) {
                const val = dm.getClinicText(clinicCode, candidates[i], '').trim();
                if (val) return val;
            }
            return this.getClinicUrlWithRegionId(clinicId, rank);
        } catch (_) {
            return this.getClinicUrlWithRegionId(clinicId, rank);
        }
    }
}

// 表示管理クラス
class DisplayManager {
    constructor(urlHandler) {
        this.urlHandler = urlHandler;
        this.regionSelect = document.getElementById('sidebar-region-select');
        this.searchInput = document.getElementById('sidebar-clinic-search');
        this.selectedRegionName = document.getElementById('selected-region-name');
        this.rankingList = document.getElementById('ranking-list');
        this.storesList = document.getElementById('stores-list');
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.heroRegionBadge = document.getElementById('hero-region-badge');
        
        // ハンバーガーメニュー要素
        this.hamburgerMenu = document.getElementById('hamburger-menu');
        this.sidebarMenu = document.getElementById('sidebar-menu');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.closeSidebar = document.getElementById('close-sidebar');
    }

    // 地域セレクターを更新（検索用、現在の地域選択は反映しない）
    updateRegionSelector(regions, selectedRegionId) {
        if (!this.regionSelect) {
            console.warn('Region selector not found');
            return;
        }
        this.regionSelect.innerHTML = '';
        
        // 「全地域」オプションを追加
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = '全地域';
        allOption.selected = true; // デフォルトで「全地域」を選択
        this.regionSelect.appendChild(allOption);
        
        // 各地域を追加
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            // 現在の地域選択は反映しない
            this.regionSelect.appendChild(option);
        });
    }

    // 選択された地域名を表示（アクセシビリティ対応）
    updateSelectedRegionName(regionName) {
        if (this.selectedRegionName) {
            this.selectedRegionName.textContent = regionName || '該当店舗なし';
        }
        // ヒーローバッジも更新
        if (this.heroRegionBadge) {
            this.heroRegionBadge.textContent = regionName ? `${regionName}版` : '東京版';
        }
    }

    updateRankingDisplay(clinics, ranking) {
        this.rankingList.innerHTML = '';

        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            this.rankingList.innerHTML = '<div class="empty-state"><p>この地域のランキングデータはありません</p></div>';
            return;
        }

        // ランキング順に表示（no1, no2, no3...の順番でソート）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        });

        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = clinics.find(c => c.id === clinicId);
            if (!clinic) return;

            const rankNum = parseInt(position.replace('no', ''));
            
            // 5位までに制限
            if (rankNum > 5) return;
            
            // ランキングアイテムのコンテナ
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item rank-${rankNum}`;
            // 追従モーダル等で参照できるように属性を付与
            rankingItem.setAttribute('data-rank', String(rankNum));
            rankingItem.setAttribute('data-clinic-id', String(clinic.id));

            // メダルクラスの設定
            let medalClass = '';
            let medalText = `No.${rankNum}`;
            if (rankNum === 1) medalClass = 'gold-medal';
            else if (rankNum === 2) medalClass = 'silver-medal';
            else if (rankNum === 3) medalClass = 'bronze-medal';

            // 評価スコアをclinic-texts.jsonから取得
            const clinicCodeForRating = window.dataManager.getClinicCodeById(clinic.id);
            const ratingScore = clinicCodeForRating 
                ? parseFloat(window.dataManager.getClinicText(clinicCodeForRating, '総合評価', '4.5'))
                : 4.5;
            const rating = { 
                score: ratingScore, 
                stars: ratingScore 
            };

            // スターのHTML生成
            let starsHtml = '';
            const fullStars = Math.floor(rating.stars);
            const decimalPart = rating.stars % 1;
            
            // 完全な星を表示
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fas fa-star"></i>';
            }
            
            // 小数部分の処理
            if (decimalPart > 0) {
                const percentage = Math.round(decimalPart * 100);
                starsHtml += `<i class="fas fa-star" style="background: linear-gradient(90deg, #6bd1d0 ${percentage}%, transparent ${percentage}%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"></i>`;
            }
            
            // 残りの空の星を表示
            for (let i = Math.ceil(rating.stars); i < 5; i++) {
                starsHtml += '<i class="far fa-star"></i>';
            }

            // バナー画像をclinic-texts.jsonから取得
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            const clinicCodeForImage = window.dataManager.getClinicCodeById(clinic.id);
            let bannerImage = `../common_data/images/clinics/tcb/tcb-logo.webp`; // デフォルト
            
            if (clinicCodeForImage) {
                // clinic-texts.jsonからパスを取得
                const imagePath = window.dataManager.getClinicText(clinicCodeForImage, 'クリニックロゴ画像パス', '');
                if (imagePath) {
                    bannerImage = imagePath;
                } else {
                    // フォールバック：コードベースのパス
                    bannerImage = `../common_data/images/clinics/${clinicCodeForImage}/${clinicCodeForImage}-logo.webp`;
                }
            }

            // 押しメッセージをclinic-texts.jsonから取得
            const clinicCode = window.dataManager.getClinicCodeById(clinic.id);
            const pushMessage = clinicCode 
                ? window.dataManager.getClinicText(clinicCode, 'ランキングプッシュメッセージ', '人気のクリニック')
                : '人気のクリニック';

            // ランキング1位時のみ、dataLayerに送信（ページ内で一度だけ）
            if (rankNum === 1 && !window.__topRankEventPushed) {
                window.__topRankEventPushed = true;
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    event: 'ranking_ready',
                    topClinicName: clinic.name,
                    topClinicCode: clinicCode || ''
                });
                // GTM側でフィルタが設定できない場合のため、コード別のイベント名も送信
                if ((clinicCode || '').toLowerCase() === 'dio') {
                    window.dataLayer.push({ event: 'ranking_ready_dio' });
                }
            }

            // クリニックロゴのパスを取得
            let clinicLogoPath = '';
            if (clinicCode) {
                const logoPathFromJson = window.dataManager.getClinicText(clinicCode, 'ロゴ画像パス', '');
                if (logoPathFromJson) {
                    clinicLogoPath = logoPathFromJson;
                } else {
                    // フォールバック：コードベースのパス
                    // キレイラインの特別処理
                    const logoFolder = clinicCode;
                    clinicLogoPath = `../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.webp`;
                }
            }

            rankingItem.innerHTML = `
                <div class="rank-medal ${medalClass}">
                    <img src="../common_data/images/badges/rank-${rankNum}.svg" alt="${medalText}" class="medal-image">
                </div>
                <div class="clinic-card">
                    <div class="satisfaction-badge">
                        <span class="satisfaction-label">満足度</span>
                    </div>
                    <div class="rating-section">
                        <div class="stars">
                            ${starsHtml}
                        </div>
                        <div class="rating-score">${rating.score}<span class="score-max">/5.0</span></div>
                    </div>
                    <div class="clinic-logo-section">
                        <h3>${clinic.name}</h3>
                    </div>
                    <div class="clinic-banner">
                        <img src="${clinicLogoPath}" alt="${clinic.name}バナー" onerror="this.style.display='none'">
                    </div>
                    <div class="push-message" style="padding: 0px; text-align: center; font-size: clamp(10px, 2.3vw, 15px); line-height: 1.4; color: #333; font-weight: bold; margin: 4px 0; height: 15%;">
                        ${window.dataManager?.processDecoTags ? window.dataManager.processDecoTags(pushMessage) : pushMessage}
                    </div>
                    <p class="btn btn_second_primary">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, rankNum)}" target="_blank" rel="noopener">
                            <span class="bt_s">公式サイト</span>
                            <span class="btn-arrow">▶</span>
                        </a>
                    </p>
                </div>
            `;

            this.rankingList.appendChild(rankingItem);
        });
    }

    updateStoresDisplay(stores, clinicsWithStores) {
        
        // brand-section-wrapperを取得（複数の方法で試行）
        let brandSectionWrapper = document.querySelector('.brand-section-wrapper');
        
        if (!brandSectionWrapper) {
            // 要素が見つからない場合、bodyの最後に新しく作成
            brandSectionWrapper = document.createElement('section');
            brandSectionWrapper.className = 'brand-section-wrapper';
            
            // ランキングセクションの後に挿入
            const rankingSection = document.querySelector('.ranking-section');
            if (rankingSection && rankingSection.parentNode) {
                rankingSection.parentNode.insertBefore(brandSectionWrapper, rankingSection.nextSibling);
            } else {
                // rankingセクションが見つからない場合はbodyの最後に追加
                document.body.appendChild(brandSectionWrapper);
            }
        }
        
        // 店舗データがない場合は非表示にする
        if (!stores || stores.length === 0) {
            brandSectionWrapper.innerHTML = '<div style="text-align:center; padding:20px;">この地域には店舗がありません</div>';
            return;
        }
        
        if (!clinicsWithStores || clinicsWithStores.size === 0) {
            brandSectionWrapper.innerHTML = '<div style="text-align:center; padding:20px;">この地域には店舗がありません</div>';
            return;
        }
        
        
        // 店舗情報を表示
        let html = '<div class="brand-section" style="max-width: 1200px; margin: 0 auto;">';
        html += '<h3 style="text-align:center; margin-bottom: 30px; font-size: 24px; color: #333;">東京の店舗一覧</h3>';
        
        // クリニックごとに店舗をグループ化して表示
        let hasAnyStores = false;
        clinicsWithStores.forEach((clinicStores, clinic) => {
            if (clinicStores && clinicStores.length > 0) {
                hasAnyStores = true;
                html += `
                    <div class="clinic-stores-section" style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h4 style="color: #2CC7C5; margin-bottom: 15px; font-size: 20px;">${clinic.name}の【東京】の店舗</h4>
                        <div class="stores-list" style="display: grid; gap: 15px;">
                `;
                
                clinicStores.forEach(store => {
                    html += `
                        <div class="store-item" style="padding: 15px; background: #f8f9fa; border-left: 3px solid #2CC7C5;">
                            <div class="store-name" style="font-weight: bold; margin-bottom: 5px;">${store.storeName || store.name || '店舗名不明'}</div>
                            <div class="store-address" style="color: #666; margin-bottom: 5px;">${store.address || '住所不明'}</div>
                            <div class="store-access" style="color: #888; font-size: 14px;">${store.access || ''}</div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        if (!hasAnyStores) {
            html += '<div style="text-align:center; padding:20px;">この地域には店舗がありません</div>';
        }
        
        html += '</div>';
        brandSectionWrapper.innerHTML = html;
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        // 既存のタイマーをクリア
        if (this.errorTimeout) {
            clearTimeout(this.errorTimeout);
        }
        // 新しいタイマーを設定
        this.errorTimeout = setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    updateFooterClinics(clinics, ranking) {
        // フッター内のすべてのulタグを取得
        const footerUls = document.querySelectorAll('#footer ul');
        let footerClinicsContainer = null;
        
        // "人気クリニック"を含むh5を持つulを探す
        for (const ul of footerUls) {
            const h5 = ul.querySelector('h5');
            if (h5 && h5.textContent === '人気クリニック') {
                footerClinicsContainer = ul;
                break;
            }
        }
        
        if (!footerClinicsContainer) return;

        // 既存のクリニックリンクを削除（h5タイトルは残す）
        const clinicLinks = footerClinicsContainer.querySelectorAll('li');
        clinicLinks.forEach(link => link.remove());

        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            return;
        }

        // ランキング順にソート（最大5件）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        }).slice(0, 5);

        // フッターにクリニックリンクを追加
        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = clinics.find(c => c.id === clinicId);
            if (!clinic) return;

            const rankNum = parseInt(position.replace('no', ''));
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = this.urlHandler.getClinicUrlWithRegionId(clinic.id, rankNum);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = clinic.name;
            li.appendChild(link);
            footerClinicsContainer.appendChild(li);
        });
    }
}
// データ管理クラス
class DataManager {
    constructor() {
        this.regions = [];
        this.clinics = [];
        this.stores = [];
        this.rankings = [];
        this.storeViews = [];
        this.campaigns = [];
        this.siteTexts = {}; // サイトテキストデータ（旧）
        this.clinicTexts = {}; // クリニック別テキストデータ
        // Handle subdirectory paths
        if (window.SITE_CONFIG) {
            this.dataPath = window.SITE_CONFIG.dataPath + '/';
        } else {
            this.dataPath = './data/';
        }
        // 地域データ用のパス（data/rankingを使用）
        this.regionDataPath = './data/ranking/';
        // 共通データ用のパス（common_data/data を使用）
        this.commonDataPath = '../common_data/data/';
    }

    async init() {
        try {
            // CSV群から各データを読み込み
            await this.loadRegions();
            await this.loadClinics();
            await this.loadRankings();
            await this.loadStoreViews();
            await this.loadStores();
            // キャンペーンは任意。存在しなければスキップ
            // キャンペーンCSVは任意。存在しないので読み込みをスキップ
            // try { await this.loadCampaigns(); } catch (_) {}
            
            // 共通テキストデータの読み込み
            this.commonTexts = {};
            
            // 共通テキスト（appeal_text）をCSVから読み込み
            await this.loadCommonTextsFromCsv();
            
            // 画像パスを動的に設定（DOMの構築を待つ）
            setTimeout(() => {
                // MV画像
                if (this.commonTexts['MV画像パス']) {
                    const heroImage = document.querySelector('.hero-image');
                    const heroSource = document.querySelector('.hero-image-wrapper source');
                    if (heroImage) {
                        heroImage.src = this.commonTexts['MV画像パス'];
                    }
                    if (heroSource) {
                        heroSource.srcset = this.commonTexts['MV画像パス'];
                    }
                }
                
                // ランキングバナー画像
                if (this.commonTexts['ランキングバナー画像パス']) {
                    const rankingBanners = document.querySelectorAll('.ranking-banner-image');
                    rankingBanners.forEach(img => {
                        img.src = this.commonTexts['ランキングバナー画像パス'];
                    });
                }
                
                // Tips1画像
                if (this.commonTexts['Tips1画像パス']) {
                    const tips1Img = document.querySelector('.tab-content[data-tab="0"] img');
                    if (tips1Img) {
                        tips1Img.src = this.commonTexts['Tips1画像パス'];
                    }
                }
                
                // Tips2画像
                if (this.commonTexts['Tips2画像パス']) {
                    const tips2Img = document.querySelector('.tab-content[data-tab="1"] img');
                    if (tips2Img) {
                        tips2Img.src = this.commonTexts['Tips2画像パス'];
                    }
                }
                
                // Tips3画像
                if (this.commonTexts['Tips3画像パス']) {
                    const tips3Img = document.querySelector('.tab-content[data-tab="2"] img');
                    if (tips3Img) {
                        tips3Img.src = this.commonTexts['Tips3画像パス'];
                    }
                }
                
                // 詳細バナー画像
                if (this.commonTexts['詳細バナー画像パス']) {
                    const detailsBanner = document.querySelector('.details-banner-image');
                    if (detailsBanner) {
                        detailsBanner.src = this.commonTexts['詳細バナー画像パス'];
                    }
                }
            }, 100);
            
            // クリニック別テキストデータの読み込み（CSVを直接読み込んで構築）
            await this.loadClinicTextsFromCsv();
            
            // 旧: compiled-data.jsonの clinic.stores から抽出していた処理
            // 新: stores.csvから読み込むため、未設定の場合のみ抽出を試みる
            if (!this.stores || this.stores.length === 0) {
                try {
                    this.stores = [];
                    this.clinics.forEach(clinic => {
                        if (!clinic.stores) return;
                        clinic.stores.forEach(store => {
                            this.stores.push({
                                id: store.id,
                                clinicName: clinic.name,
                                storeName: store.name,
                                name: store.name,
                                address: store.address,
                                zipcode: store.zipcode,
                                access: store.access,
                                regionId: this.getRegionIdFromAddress(store.address)
                            });
                        });
                    });
                } catch (_) {}
            }
            
        } catch (error) {
            throw error;
        }
    }

    // site-common-texts.csv を読み込んで key->value のオブジェクトに変換
    async loadCommonTextsFromCsv() {
        this.commonTexts = {};
        try {
            const primary = this.dataPath + 'site-common-texts.csv';
            const legacy = this.dataPath + 'appeal_text/site-common-texts.csv';
            let respLocal = await fetch(primary);
            if (!respLocal.ok) {
                respLocal = await fetch(legacy);
            }
            if (respLocal.ok) {
                const obj = await this.readSiteCommonCsvFromResponse(respLocal);
                this.commonTexts = { ...this.commonTexts, ...obj };
            }
        } catch (e) {
            console.warn('⚠️ ローカル site-common-texts.csv 読込エラー:', e);
        }
        // 次に common_data/data のJSONがあれば上書き（従来の上書き仕様維持）
        try {
            const respCommon = await fetch('../../../common_data/data/site-common-texts.json');
            if (respCommon.ok) {
                const jsonText = await respCommon.text();
                try {
                    const override = JSON.parse(jsonText);
                    this.commonTexts = { ...this.commonTexts, ...override };
                } catch (err) {
                    console.warn('⚠️ common_dataのsite-common-texts.jsonパースエラー:', err);
                }
            }
        } catch (e) {
            // 共通の上書きがない場合は無視
        }

        // ファビコンとヘッダーロゴを反映
        if (this.commonTexts['ファビコン画像パス']) {
            const faviconElement = document.getElementById('favicon');
            if (faviconElement) {
                faviconElement.href = this.commonTexts['ファビコン画像パス'];
            }
            const headerLogoIcon = document.getElementById('header-logo-icon');
            if (headerLogoIcon) {
                headerLogoIcon.src = this.commonTexts['ファビコン画像パス'];
            }
        }
    }

    async readSiteCommonCsvFromResponse(response) {
        const buffer = await response.arrayBuffer();
        let text = '';
        try { text = new TextDecoder('utf-8').decode(buffer); } catch (_) {}
        const replacementCount = (text.match(/\uFFFD|�/g) || []).length;
        if (!text || replacementCount > 5) {
            try { text = new TextDecoder('shift_jis').decode(buffer); } catch (_) {}
        }
        // BOM除去
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length <= 1) return {};
        const result = {};
        // ヘッダー: 1列目=キー, 3列目=値（CSVの構造に合わせる）
        for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCsvLineWithQuotes(lines[i]);
            if (cols.length >= 3) {
                const key = (cols[0] || '').trim();
                let value = (cols[2] || '').trim();
                if (!key) continue;
                // 引用符で囲まれていれば外す（エスケープ二重引用符も復元）
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1).replace(/""/g, '"');
                }
                result[key] = value;
            }
        }
        return result;
    }

    // 1行用CSVパーサ（ダブルクオート対応）
    parseCsvLineWithQuotes(line) {
        const row = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            const next = line[i + 1];
            if (ch === '"') {
                if (inQuotes && next === '"') { cur += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
                row.push(cur); cur = '';
            } else {
                cur += ch;
            }
        }
        row.push(cur);
        return row;
    }

    // clinic-texts.csv を直接読み込んで clinicTexts 構造を生成
    async loadClinicTextsFromCsv() {
        try {
            const primary = this.dataPath + 'clinic-texts.csv';
            const legacy = this.dataPath + 'clinic_text/clinic-texts.csv';
            let resp = await fetch(primary);
            if (!resp.ok) {
                resp = await fetch(legacy);
            }
            if (!resp.ok) throw new Error(`Failed to load clinic-texts.csv: ${resp.status}`);

            // 文字コードを自動判定（UTF-8優先、ダメならShift_JIS）
            const buffer = await resp.arrayBuffer();
            let text = '';
            try {
                text = new TextDecoder('utf-8').decode(buffer);
            } catch (_) {
                // ignore
            }
            // 置換文字が多い（�）場合はShift_JISで再デコード
            const replacementCount = (text.match(/\uFFFD|�/g) || []).length;
            if (!text || replacementCount > 10) {
                try {
                    text = new TextDecoder('shift_jis').decode(buffer);
                } catch (_) {
                    // shift_jis未対応環境の場合はそのまま
                }
            }

            const records = this.parseCsvWithQuotes(text);
            if (!records || records.length === 0) {
                console.warn('⚠️ clinic-texts.csv にレコードがありません');
                this.clinicTexts = {};
                return;
            }

            // 先頭行: list_name, 項目名, 目的・注意事項, クリニック名...
            const headers = records[0];
            const clinicNames = headers.slice(3).map(h => (h || '').trim()).filter(Boolean);

            const clinicsData = {};
            const comparisonHeaders = {};
            const detailFields = {};

            clinicNames.forEach(name => {
                clinicsData[name] = {};
            });

            for (let i = 1; i < records.length; i++) {
                const row = records[i];
                if (!row || row.length === 0) continue;
                const listName = (row[0] || '').trim();
                const fieldName = (row[1] || '').trim();
                if (!listName || !fieldName) continue;

                if (listName.startsWith('comparison')) {
                    // 比較表ヘッダー設定
                    const num = listName.replace('comparison', '');
                    comparisonHeaders[`比較表ヘッダー${num}`] = fieldName;
                    for (let j = 0; j < clinicNames.length; j++) {
                        const clinicName = clinicNames[j];
                        const value = row[j + 3] || '';
                        clinicsData[clinicName][fieldName] = value;
                    }
                } else if (listName.startsWith('detail')) {
                    // 詳細セクション
                    let mappingKey = '';
                    switch (fieldName) {
                        case '費用': mappingKey = 'priceDetail'; break;
                        case '目安期間': mappingKey = 'periods'; break;
                        case '矯正範囲': mappingKey = 'ranges'; break;
                        case '営業時間': mappingKey = 'hours'; break;
                        case '店舗': mappingKey = 'stores'; break;
                        case '特徴タグ': mappingKey = 'featureTags'; break;
                        default: mappingKey = fieldName; break;
                    }
                    if (mappingKey && mappingKey !== '特徴タグ') {
                        detailFields[mappingKey] = fieldName;
                    }
                    for (let j = 0; j < clinicNames.length; j++) {
                        const clinicName = clinicNames[j];
                        const value = row[j + 3] || '';
                        clinicsData[clinicName][`詳細_${fieldName}`] = value;
                    }
                } else if (listName.startsWith('tags')) {
                    // タグ（詳細に含める）
                    for (let j = 0; j < clinicNames.length; j++) {
                        const clinicName = clinicNames[j];
                        const value = row[j + 3] || '';
                        clinicsData[clinicName][`詳細_${fieldName}`] = value;
                    }
                } else if (listName.startsWith('meta')) {
                    // メタ情報
                    for (let j = 0; j < clinicNames.length; j++) {
                        const clinicName = clinicNames[j];
                        const value = row[j + 3] || '';
                        clinicsData[clinicName][fieldName] = value;
                    }
                } else {
                    // 特定コード→クリニック名の特例（未使用でも互換のため残す）
                    const clinicCodeToName = {
                        'ohmyteeth': 'Oh my teeth',
                        'invisalign': 'インビザライン',
                        'kireilign': 'キレイライン矯正',
                        'zenyum': 'ゼニュム',
                        'wesmile': 'ウィスマイル'
                    };
                    if (clinicCodeToName[listName]) {
                        const target = clinicCodeToName[listName];
                        if (clinicsData[target]) {
                            clinicsData[target][fieldName] = row[3] || '';
                        }
                    } else {
                        for (let j = 0; j < clinicNames.length; j++) {
                            const clinicName = clinicNames[j];
                            const value = row[j + 3] || '';
                            clinicsData[clinicName][fieldName] = value;
                        }
                    }
                }
            }

            const result = {};
            result['比較表ヘッダー設定'] = comparisonHeaders;
            result['詳細フィールドマッピング'] = detailFields;
            // 公式サイトURLも詳細側に含める
            result['詳細フィールドマッピング']['officialSite'] = '公式サイトURL';
            Object.keys(clinicsData).forEach(name => {
                result[name] = clinicsData[name];
            });

            this.clinicTexts = result;
        } catch (e) {
            console.warn('⚠️ clinic-texts.csv の読み込み/変換に失敗しました:', e);
            this.clinicTexts = {};
        }
    }

    // 口コミタブのラベルをCSV（項目名）から抽出（クリニック別に順序付きで取得）
    // 返却: ラベル配列（例: ['特典','スタッフ','サービス']）。n=1→3の順。重複は最初のみ。
    // 括弧は全角/半角の両方に対応。
    getReviewTabLabels(clinicCode) {
        try {
            // 指定クリニックのデータを取得
            const codeToNameMap = {
                'tcb': 'TCB',
                'TCB': 'TCB',
                'luna': 'LUNAビューティークリニック',
                'LUNAビューティークリニック': 'LUNAビューティークリニック',
                'rize': 'リゼクリニック',
                'リゼクリニック': 'リゼクリニック',
                'shinagawa': '品川美容外科',
                '品川美容外科': '品川美容外科',
                'seishin': '聖心美容クリニック',
                '聖心美容クリニック': '聖心美容クリニック'
            };
            let clinicName = codeToNameMap[clinicCode];
            if (!clinicName) {
                const clinic = this.clinics.find(c => c.code === clinicCode);
                clinicName = clinic ? clinic.name : null;
            }
            // fallback: 先頭のクリニック
            const specialKeys = new Set(['比較表ヘッダー設定', '詳細フィールドマッピング']);
            if (!clinicName) {
                const clinicKeys = Object.keys(this.clinicTexts || {}).filter(k => !specialKeys.has(k));
                clinicName = clinicKeys[0];
            }
            const clinicData = (this.clinicTexts && clinicName) ? (this.clinicTexts[clinicName] || {}) : {};

            // 全キーを上から走査し、カテゴリ（括弧内）を初出順に収集
            // かつ、各カテゴリの最小n（口コミnタイトル）を保持し、n昇順→初出順でソート
            const keys = Object.keys(clinicData);
            const meta = new Map(); // label -> { firstIndex, minN }
            for (let idx = 0; idx < keys.length; idx++) {
                const k = keys[idx];
                let m = k.match(/^口コミ([1-3])タイトル（(.+?)）$/);
                if (!m) m = k.match(/^口コミ([1-3])タイトル\((.+?)\)$/);
                if (!m) continue;
                const n = parseInt(m[1], 10);
                const label = m[2];
                if (!meta.has(label)) {
                    meta.set(label, { firstIndex: idx, minN: n });
                } else {
                    const obj = meta.get(label);
                    if (n < obj.minN) obj.minN = n;
                }
            }
            let labels = Array.from(meta.entries())
                .sort((a, b) => (a[1].minN - b[1].minN) || (a[1].firstIndex - b[1].firstIndex))
                .map(([label]) => label);
            if (labels.length === 0) labels = ['コスパ', 'スタッフ', 'サービス'];
            // 最大3つまでに制限（UI都合）
            return labels.slice(0, 3);
        } catch (_) {
            return ['コスパ', 'スタッフ', 'サービス'];
        }
    }

    // 指定ラベル（括弧内）に対応する口コミ配列を取得（タイトル/内容×1..3）
    getClinicReviewsByLabel(clinicCode, label) {
        const reviews = [];
        for (let i = 1; i <= 3; i++) {
            // 全角/半角括弧の両方を試す
            let title = this.getClinicText(clinicCode, `口コミ${i}タイトル（${label}）`, '');
            if (!title) title = this.getClinicText(clinicCode, `口コミ${i}タイトル(${label})`, '');
            let content = this.getClinicText(clinicCode, `口コミ${i}内容（${label}）`, '');
            if (!content) content = this.getClinicText(clinicCode, `口コミ${i}内容(${label})`, '');
            if (title || content) reviews.push({ title, content });
        }
        return reviews;
    }

    // ダブルクオートを考慮したCSVパーサ
    parseCsvWithQuotes(csvText) {
        const lines = csvText.split(/\r?\n/);
        const records = [];
        for (let li = 0; li < lines.length; li++) {
            const raw = lines[li];
            if (raw == null) continue;
            const line = String(raw);
            if (!line.trim()) continue;
            const row = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    // 連続するダブルクオートはエスケープとみなし、1つだけ追加
                    if (inQuotes && line[i + 1] === '"') {
                        cur += '"';
                        i++; // 次をスキップ
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (ch === ',' && !inQuotes) {
                    row.push(cur);
                    cur = '';
                } else {
                    cur += ch;
                }
            }
            row.push(cur);
            records.push(row);
        }
        return records;
    }
    
    // 住所から地域IDを取得するヘルパーメソッド
    getRegionIdFromAddress(address) {
        if (!address) return null;
        for (const region of this.regions) {
            if (address.includes(region.name)) {
                return region.id;
            }
        }
        return null;
    }

    // CSVファイルを読み込む汎用関数（エラーハンドリング付き）
    async loadCsvFile(filename) {
        try {
            // 読み込み候補（新配置優先 → 旧配置）
            const candidates = [];
            if (filename.includes('ranking.csv')) {
                // 新: data直下, 旧: data/ranking
                candidates.push(this.dataPath + filename);
                candidates.push(this.regionDataPath + filename);
            } else if (filename.includes('items.csv') || filename.includes('region.csv') || filename.includes('store_view.csv') || filename.includes('stores.csv')) {
                // 共通データはcommon_data固定
                candidates.push(this.commonDataPath + filename);
            } else {
                candidates.push(this.dataPath + filename);
            }

            let response = null;
            for (const url of candidates) {
                try {
                    const res = await fetch(url);
                    if (res.ok) { response = res; break; }
                } catch (_) { /* try next */ }
            }
            if (!response) {
                throw new Error(`Failed to load ${filename}`);
            }

            const buffer = await response.arrayBuffer();
            let text = '';
            try { text = new TextDecoder('utf-8').decode(buffer); } catch (_) {}
            const replacementCount = (text.match(/\uFFFD|�/g) || []).length;
            if (!text || replacementCount > 10) {
                try { text = new TextDecoder('shift_jis').decode(buffer); } catch (_) {}
            }
            // レコード配列
            const records = this.parseCsvWithQuotes(text);
            if (!records || records.length === 0) return [];
            const headers = records[0].map(h => (h || '').trim());
            const rows = [];
            for (let i = 1; i < records.length; i++) {
                const rec = records[i];
                if (!rec || rec.length === 0 || rec.every(v => (v || '').trim() === '')) continue;
                const obj = {};
                headers.forEach((h, idx) => {
                    obj[h] = (rec[idx] || '').trim();
                });
                rows.push(obj);
            }
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 地域データの読み込み
    async loadRegions() {
        const data = await this.loadCsvFile('出しわけSS - region.csv');
        this.regions = data.map(row => ({
            id: String(row.parameter_no).padStart(3, '0'),
            name: row.region
        }));
    }

    // クリニックデータの読み込み
    async loadClinics() {
        const data = await this.loadCsvFile('出しわけSS - items.csv');
        this.clinics = data.map(row => ({
            id: row.clinic_id,
            name: row.clinic_name,
            code: row.code
        }));
    }

    // 店舗データの読み込み
    async loadStores() {
        const data = await this.loadCsvFile('出しわけSS - stores.csv');
        this.stores = data.map(row => ({
            id: row.store_id,
            clinicName: row.clinic_name,
            storeName: row.store_name,
            name: row.store_name,  // 両方のフィールドで互換性を保つ
            zipcode: row.Zipcode,
            address: row.adress,
            access: row.access,
            regionId: null // 後で関連付け
        }));
    }

    // ランキングデータの読み込み
    async loadRankings() {
        const data = await this.loadCsvFile('出しわけSS - ranking.csv');
        
        // 地域ごとにランキングをグループ化
        const rankingMap = {};
        data.forEach(row => {
            const regionId = String(row.parameter_no).padStart(3, '0');
            if (!rankingMap[regionId]) {
                rankingMap[regionId] = {
                    regionId: regionId,
                    ranks: {}
                };
            }
            
            // 各順位のクリニックIDを設定（"-"は除外）
            Object.keys(row).forEach(key => {
                if (key.startsWith('no') && row[key] && row[key] !== '-') {
                    rankingMap[regionId].ranks[key] = row[key];
                }
            });
        });

        this.rankings = Object.values(rankingMap);
    }

    // 店舗ビューデータの読み込み
    async loadStoreViews() {
        const data = await this.loadCsvFile('出しわけSS - store_view.csv');
        
        this.storeViews = data.map(row => {
            const view = { regionId: String(row.parameter_no).padStart(3, '0'), clinicStores: {} };
            // 行の全キーから *_stores を動的に拾う
            Object.keys(row).forEach(key => {
                if (!key || !/_stores$/.test(key)) return;
                const val = row[key];
                if (!val || val === '-') return;
                view.clinicStores[key] = String(val).split('/');
            });
            return view;
        });
        
    }

    // キャンペーンデータの読み込み
    async loadCampaigns() {
        const data = await this.loadCsvFile('出しわけSS - campaigns.csv');
        this.campaigns = data.map(row => ({
            id: row.campaign_id,
            regionId: row.region_id,
            clinicId: row.clinic_id,
            title: row.title,
            headerText: row.header_text,
            logoSrc: row.logo_src,
            logoAlt: row.logo_alt,
            description: row.description,
            ctaText: row.cta_text,
            ctaUrl: row.cta_url,
            footerText: row.footer_text
        }));
    }

    // 店舗と地域の関連付け
    associateStoresWithRegions() {
        this.stores.forEach(store => {
            // 住所から地域を判断
            for (const region of this.regions) {
                if (store.address.includes(region.name)) {
                    store.regionId = region.id;
                    break;
                }
            }
        });
    }

    // 全地域を取得
    getAllRegions() {
        return this.regions;
    }

    // 全クリニックを取得
    getAllClinics() {
        return this.clinics;
    }
    
    // クリニックIDでクリニックを取得
    getClinicById(clinicId) {
        // 文字列と数値の両方に対応
        return this.clinics.find(c => c.id == clinicId);
    }

    // 地域IDで地域を取得
    getRegionById(regionId) {
        // region_id=000の場合は「全国」を返す（data/rankingには存在する）
        if (regionId === '000' || regionId === '0') {
            // まずregions配列から探す
            const zenkoku = this.regions.find(r => r.id === '0' || r.id === '000');
            if (zenkoku) return zenkoku;
            // 見つからない場合はハードコードで返す
            return { id: '000', name: '全国', parentId: null };
        }
        
        // Try both padded and unpadded formats
        const paddedId = String(regionId).padStart(3, '0');
        const unpaddedId = String(parseInt(regionId, 10));
        
        // data/rankingには非パディング形式で保存されている可能性が高い
        return this.regions.find(r => 
            r.id === unpaddedId || 
            r.id === paddedId || 
            r.id === String(regionId)
        );
    }

    // クリニックIDでクリニックコードを取得
    getClinicCodeById(clinicId) {
        const clinic = this.clinics.find(c => c.id === String(clinicId));
        return clinic ? clinic.code : null;
    }

    // 地域IDとエレメントIDでサイトテキストを取得（旧）
    getSiteText(regionId, elementId, defaultText = '') {
        if (this.siteTexts && this.siteTexts[regionId] && this.siteTexts[regionId][elementId]) {
            return this.siteTexts[regionId][elementId];
        }
        return defaultText;
    }

    // 共通テキストを取得（プレースホルダー置換機能付き）
    getCommonText(itemKey, defaultText = '', placeholders = {}) {
        let text = defaultText;
        if (this.commonTexts && this.commonTexts[itemKey]) {
            text = this.commonTexts[itemKey];
            // ログが多すぎる場合はコメントアウト
            // console.log(`✅ 共通テキスト使用: ${itemKey} = "${text}"`);
        } else {
            // ログが多すぎる場合はコメントアウト
            // console.log(`⚠️ 共通テキストが見つかりません: ${itemKey}, デフォルト値使用: "${defaultText}"`);
        }
        
        // プレースホルダーを置換
        Object.keys(placeholders).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            text = text.replace(regex, placeholders[key]);
        });
        
        return text;
    }

    // 比較表ヘッダー設定を取得（clinic-texts.jsonの「比較表ヘッダー設定」を動的参照）
    getClinicHeaderConfig() {
        if (this.clinicTexts && this.clinicTexts['比較表ヘッダー設定']) {
            return this.clinicTexts['比較表ヘッダー設定'];
        }
        return {};
    }
    
    // クリニックコードと項目名でクリニック別テキストを取得
    getClinicText(clinicCode, itemKey, defaultText = '') {
        
        // 比較表ヘッダー設定から動的にフィールド名を取得
        let actualItemKey = itemKey;
        
        // comparison1-9の場合は、比較表ヘッダー設定から実際のフィールド名を取得
        if (itemKey.startsWith('comparison')) {
            const headerConfig = this.clinicTexts && this.clinicTexts['比較表ヘッダー設定'];
            if (headerConfig) {
                const comparisonNum = itemKey.replace('comparison', '');
                const headerKey = `比較表ヘッダー${comparisonNum}`;
                if (headerConfig[headerKey]) {
                    actualItemKey = headerConfig[headerKey];
                }
            }
        }
        
        // クリニックコードからクリニック名を取得
        // コードマッピング（clinic-texts.jsonの実際のクリニックコードに合わせて修正）
        const codeToNameMap = {
            'tcb': 'TCB',  // ← 正しいクリニックコードに修正
            'TCB': 'TCB',
            'luna': 'LUNAビューティークリニック',
            'LUNAビューティークリニック': 'LUNAビューティークリニック',
            'rize': 'リゼクリニック',
            'リゼクリニック': 'リゼクリニック',
            'shinagawa': '品川美容外科',
            '品川美容外科': '品川美容外科',
            'seishin': '聖心美容クリニック',
            '聖心美容クリニック': '聖心美容クリニック'
        };
        
        // まずマッピングをチェック
        let clinicName = codeToNameMap[clinicCode];
        
        // マッピングになければ、clinicsから探す
        if (!clinicName) {
            const clinic = this.clinics.find(c => c.code === clinicCode);
            clinicName = clinic ? clinic.name : null;
        }
        
        // デバッグ：比較表の注意事項の場合のみログ
        if (actualItemKey === '比較表の注意事項') {
            // console.log(`DEBUG getClinicText: code=${clinicCode}, mapped name=${clinicName}, key=${actualItemKey}`);
            // console.log(`DEBUG clinicTexts keys:`, this.clinicTexts ? Object.keys(this.clinicTexts) : 'clinicTexts is null');
            if (clinicName && this.clinicTexts && this.clinicTexts[clinicName]) {
                // console.log(`DEBUG Found clinic data for ${clinicName}, has key? ${!!this.clinicTexts[clinicName][actualItemKey]}`);
                if (this.clinicTexts[clinicName][actualItemKey]) {
                    // console.log(`DEBUG Text length: ${this.clinicTexts[clinicName][actualItemKey].length}`);
                }
            }
        }
        
        if (clinicName && this.clinicTexts && this.clinicTexts[clinicName] && this.clinicTexts[clinicName][actualItemKey]) {
            const value = this.clinicTexts[clinicName][actualItemKey];
            return value;
        }
        
        // デバッグ用（本番環境では削除）
        // if (clinicName && (!this.clinicTexts[clinicName])) {
        //     console.warn(`No clinic texts found for: ${clinicName}`);
        // } else if (actualItemKey.includes('POINT') || actualItemKey === 'INFORMATIONサブテキスト' || actualItemKey === '費用' || actualItemKey === 'コスト') {
        //     console.warn(`⚠️ ${actualItemKey} not found for ${clinicName}, using default: "${defaultText}"`);
        // }
        
        return defaultText;
    }

    // クリニック評価を取得する関数
    getClinicRating(clinicCode, defaultRating = 4.5) {
        const rating = this.getClinicText(clinicCode, '総合評価', defaultRating.toString());
        return parseFloat(rating) || defaultRating;
    }
    // クリニック名を取得する関数
    getClinicName(clinicCode, defaultName = 'クリニック') {
        return this.getClinicText(clinicCode, 'クリニック名', defaultName);
    }

    // decoタグを処理してHTMLに変換する関数
    processDecoTags(text) {
        if (!text || typeof text !== 'string') return text;
        
        // <deco>タグを<span class="deco-text">に変換
        return text.replace(/<deco>(.*?)<\/deco>/g, '<span class="deco-text">$1</span>');
    }

    // クリニックの口コミデータを動的に取得
    getClinicReviews(clinicCode) {
        const reviews = {
            cost: [], // コスパタブの口コミ
            access: [], // 通いやすさタブの口コミ
            staff: [] // スタッフタブの口コミ
        };
        
        // コスパタブの口コミ（3つ）
        for (let i = 1; i <= 3; i++) {
            const title = this.getClinicText(clinicCode, `口コミ${i}タイトル（コスパ）`, '');
            const content = this.getClinicText(clinicCode, `口コミ${i}内容（コスパ）`, '');
            if (title && content) {
                reviews.cost.push({ title, content });
            }
        }
        
        // 通いやすさタブの口コミ（3つ）
        for (let i = 1; i <= 3; i++) {
            const title = this.getClinicText(clinicCode, `口コミ${i}タイトル（スタッフ）`, '');
            const content = this.getClinicText(clinicCode, `口コミ${i}内容（スタッフ）`, '');
            if (title && content) {
                reviews.access.push({ title, content });
            }
        }
        
        // スタッフタブの口コミ（3つ）
        for (let i = 1; i <= 3; i++) {
            const title = this.getClinicText(clinicCode, `口コミ${i}タイトル（サービス）`, '');
            const content = this.getClinicText(clinicCode, `口コミ${i}内容（サービス）`, '');
            if (title && content) {
                reviews.staff.push({ title, content });
            }
        }
        
        return reviews;
    }
    
    // 地域名を取得
    getRegionName(regionId) {
        const region = this.getRegionById(regionId);
        return region ? region.name : '';
    }
    
    // 店舗画像パスを取得
    getStoreImage(clinicCode, storeNumber) {
        // クリニックの設定に基づいて画像パスを動的に決定
        const clinic = this.clinics?.find(c => c.code === clinicCode);
        if (clinic) {
            // クリニック固有の画像設定がある場合はそれを使用
            const customImagePath = this.getClinicText(clinicCode, '店舗画像パス', '');
            if (customImagePath) {
                return customImagePath;
            }
        }
        
        // デフォルトの画像パス生成
        const paddedNumber = String(storeNumber).padStart(3, '0');
        return `/images/clinics/${clinicCode}/${clinicCode}_clinic/clinic_image_${paddedNumber}.webp`;
    }
    
    // Google Maps iframeを生成
    generateMapIframe(address) {
        if (!address) {
            return '<p>住所情報がありません</p>';
        }
        
        // 住所をエンコード
        const encodedAddress = encodeURIComponent(address);
        
        // Google Maps Embed APIのURL
        const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed&z=16`;
        
        return `
            <iframe src="${mapUrl}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Maps">
            </iframe>
        `;
    }
    
    // 店舗表示のHTML生成（medical-diet001スタイル）
    generateStoresDisplay(clinicId, regionId, providedStores = null) {
        // クリニックコードを取得
        const clinicCode = this.getClinicCodeById(clinicId);
        if (!clinicCode) {
            return '<div class="shops"><p class="no-stores">店舗情報がありません</p></div>';
        }
        
        // ランキング情報を取得してランクを特定
        const ranking = this.getRankingByRegionId(regionId);
        let rank = 1; // デフォルト値
        if (ranking && ranking.ranks) {
            // clinicIdからランクを取得
            for (const [position, id] of Object.entries(ranking.ranks)) {
                if (id === clinicId) {
                    rank = parseInt(position);
                    break;
                }
            }
        }
        
        // 遷移先URLを直接取得
        const urlFieldName = `遷移先URL（${rank}位）`;
        let targetUrl = this.getClinicText(clinicCode, urlFieldName, '');
        
        if (!targetUrl) {
            // フォールバック：1位のURLを使用
            targetUrl = this.getClinicText(clinicCode, '遷移先URL（1位）', '');
        }
        
        // 店舗データを取得（提供されたデータか、既存のメソッドから取得）
        const storeData = providedStores || this.getStoreDataForClinic(clinicCode, regionId);
        if (!storeData || storeData.length === 0) {
            return '<div class="shops"><p class="no-stores">この地域には店舗がありません</p></div>';
        }
        
        const visibleStores = storeData.slice(0, 3);
        const hiddenStores = storeData.slice(3);
        const storeId = `shops-${Date.now()}`; // ユニークなIDを生成
        
        let html = `<div class="shops" id="${storeId}">`;
        
        // 最初の3店舗を表示
        visibleStores.forEach((store, index) => {
            const storeName = store.name || store.storeName || '店舗名不明';
            const storeAddress = store.address || '住所情報なし';
            
            // ハッシュフラグメントを使用（サーバーのURL書き換えに影響されない）
            const redirectUrl = `./redirect.html#clinic_id=${clinicId}&rank=${rank}&region_id=${regionId}`;
            
            // localStorageを先に設定してから開く（サーバーがパラメータを削除する場合の対策）
            const onclickHandler = targetUrl ? 
                `onclick="localStorage.setItem('redirectParams', JSON.stringify({clinic_id: '${clinicId}', rank: '${rank}', region_id: '${regionId}'})); setTimeout(() => { window.open('${redirectUrl}', '_blank'); }, 10); return false;"` : '';
            
            html += `
                <div class='shop'>
                    <div class='shop-image'>
                        <img src="${this.getStoreImage(clinicCode, index + 1)}" alt="${storeName}" onerror="this.src='${this.getClinicLogoPath(clinicCode)}'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="#" ${onclickHandler} style="cursor: pointer;">${storeName}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${storeAddress}
                        </div>
                    </div>
                    <a class="shop-btn map-toggle-btn" href="javascript:void(0);" data-store-id="${storeId}-${index}">
                        <i class='fas fa-map-marker-alt btn-icon'></i>
                        地図
                    </a>
                </div>
            `;
        });
        
        // 4店舗以上ある場合は隠しコンテンツとして追加
        hiddenStores.forEach((store, index) => {
            const storeName = store.name || store.storeName || '店舗名不明';
            const storeAddress = store.address || '住所情報なし';
            
            // ハッシュフラグメントを使用（サーバーのURL書き換えに影響されない）
            const redirectUrl = `./redirect.html#clinic_id=${clinicId}&rank=${rank}&region_id=${regionId}`;
            
            // localStorageを先に設定してから開く（サーバーがパラメータを削除する場合の対策）
            const onclickHandler = targetUrl ? 
                `onclick="localStorage.setItem('redirectParams', JSON.stringify({clinic_id: '${clinicId}', rank: '${rank}', region_id: '${regionId}'})); setTimeout(() => { window.open('${redirectUrl}', '_blank'); }, 10); return false;"` : '';
            
            html += `
                <div class='shop hidden-content hidden'>
                    <div class='shop-image'>
                        <img src="${this.getStoreImage(clinicCode, index + 4)}" alt="${storeName}" onerror="this.src='${this.getClinicLogoPath(clinicCode)}'" />
                    </div>
                    <div class='shop-info'>
                        <div class='shop-name'>
                            <a href="#" ${onclickHandler} style="cursor: pointer;">${storeName}</a>
                        </div>
                        <div class='shop-address line-clamp'>
                            ${storeAddress}
                        </div>
                    </div>
                    <a class="shop-btn map-toggle-btn" href="javascript:void(0);" data-store-id="${storeId}-${index + 3}">
                        <i class='fas fa-map-marker-alt btn-icon'></i>
                        地図
                    </a>
                </div>
            `;
        });
        
        // もっと見るボタン
        if (hiddenStores.length > 0) {
            html += `
                <button class="more-button" data-target="#${storeId}" onclick="toggleStores(this)"><span class="button-text">他${hiddenStores.length}件のクリニックを見る</span></button>
            `;
        }
        
        html += '</div>';
        
        return html;
    }
    
    // クリニックの店舗データを取得（地域別）
    getStoreDataForClinic(clinicCode, regionId) {
        // 地域IDをマッピングして正規化（例: '13' -> '013'）
        const mappedRegionId = this.mapRegionId(regionId);
        let storeView = this.storeViews.find(sv => sv.regionId === mappedRegionId);
        if (!storeView) {
            const normalizedRegionId = String(parseInt(mappedRegionId, 10));
            storeView = this.storeViews.find(sv => sv.regionId === normalizedRegionId);
        }
        if (!storeView) return [];
        
        // ランキングデータを取得して、表示されているクリニックを特定
        const ranking = this.getRankingByRegionId(regionId);
        if (!ranking) return [];
        
        // クリニックコードからクリニックIDを動的に取得
        const clinic = this.clinics.find(c => c.code === clinicCode);
        if (!clinic) return [];
        
        const clinicId = clinic.id;
        if (!clinicId) return [];
        
        // 新しいヘッダー構造: クリニックコードベースのキー（dio_stores, eminal_stores等）
        const clinicKey = `${clinicCode}_stores`;
        
        const storeIdsToShow = storeView.clinicStores[clinicKey] || [];
        
        if (storeIdsToShow.length === 0) return [];
        
        // 店舗IDに基づいて実際の店舗情報を取得
        const allStoreIds = [];
        storeIdsToShow.forEach(storeId => {
            if (storeId.includes('/')) {
                // dio_009/dio_010 のような形式を分割
                const ids = storeId.split('/');
                allStoreIds.push(...ids);
            } else {
                allStoreIds.push(storeId);
            }
        });
        
        const result = this.stores.filter(store => 
            allStoreIds.includes(store.id)
        );
        
        // 結果を適切な形式に変換
        return result.map(store => ({
            name: store.storeName || store.name,
            address: store.address,
            access: store.access || '主要駅より徒歩圏内',
            hours: this.getClinicText(clinicCode, '営業時間', '10:00〜19:00')
        }));
    }
    
    // 地域に応じた住所を生成
    generateAddressForRegion(regionId, defaultAddress = '') {
        const region = this.getRegionById(regionId);
        if (!region) {
            return defaultAddress || '住所情報準備中';
        }
        
        return addressPatterns[regionId] || `${region.name}の主要エリア内`;
    }

    // クリニックロゴパスを取得
    getClinicLogoPath(clinicCode) {
        // キレイラインの特別処理
        const logoFolder = clinicCode === 'kireiline' ? 'kireiline' : clinicCode;
        return this.getClinicText(clinicCode, 'クリニックロゴ画像パス', `../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.webp`);
    }

    // クリニック詳細データを動的に取得
    getClinicDetailData(clinicId) {
        const clinic = this.getClinicById(clinicId);
        if (!clinic) return null;
        
        const clinicCode = clinic.code;
        const clinicName = clinic.name;
        
        // 詳細フィールドマッピングを取得
        const fieldMapping = this.clinicTexts['詳細フィールドマッピング'] || {};
        
        // priceDetailを動的に生成
        const priceDetail = {};
        
        // 日本語の表示名マッピング（詳細セクションの価格表用）
        const displayNameMap = {
            'priceDetail': '費用',
            'periods': '目安期間',
            'ranges': '矯正範囲',
            'hours': '営業時間',
            'stores': '店舗',
            'officialSite': '公式サイト'
        };
        
        // マッピングに基づいて動的にフィールドを設定
        Object.entries(fieldMapping).forEach(([displayKey, csvKey]) => {
            // 日本語の表示名を取得
            const japaneseKey = displayNameMap[displayKey] || displayKey;
            
            // 公式サイトURLは詳細_プレフィックスなし、それ以外は詳細_プレフィックス付き
            let detailValue;
            if (csvKey === '公式サイトURL') {
                detailValue = this.getClinicText(clinicCode, csvKey, '');
            } else {
                detailValue = this.getClinicText(clinicCode, `詳細_${csvKey}`, '');
            }
            
            // 値を設定
            priceDetail[japaneseKey] = detailValue;
        });
        
        // clinic-texts.jsonから詳細データを動的に構築
        const detailData = {
            title: this.getClinicText(clinicCode, '詳細タイトル', '医療痩せプログラム'),
            subtitle: this.getClinicText(clinicCode, '詳細サブタイトル', '効果的な痩身治療'),
            link: `${clinicName} ＞`,
            banner: this.getClinicText(clinicCode, '詳細バナー画像パス', (() => {
                const bannerFolder = clinicCode === 'kireiline' ? 'kireiline' : clinicCode;
                return `../common_data/images/clinics/${bannerFolder}/${bannerFolder}_detail_bnr.webp`;
            })()),
            features: (() => {
                const tagsText = this.getClinicText(clinicCode, '詳細_特徴タグ', '# 医療ダイエット<br># 医療痩身<br># リバウンド防止');
                // <br>で分割し、#と空白を削除
                return tagsText.split('<br>').map(tag => tag.replace(/^#\s*/, '').trim()).filter(tag => tag);
            })(),
            priceMain: this.getClinicText(clinicCode, '人気プラン', '医療痩身コース'),
            priceValue: (() => {
                // 料金フィールドから月々の金額を抽出
                const ryokin = this.getClinicText(clinicCode, '料金', '月々4,900円');
                const match = ryokin.match(/月々[\d,]+円/);
                return match ? match[0] : '月々4,900円';
            })(),
            priceDetail: priceDetail, // 動的に生成されたpriceDetailを使用
            points: [
                {
                    icon: 'lightbulb',
                    title: this.getClinicText(clinicCode, 'POINT1タイトル', 'ポイント1'),
                    description: this.getClinicText(clinicCode, 'POINT1内容', '詳細説明1')
                },
                {
                    icon: 'phone',
                    title: this.getClinicText(clinicCode, 'POINT2タイトル', 'ポイント2'),
                    description: this.getClinicText(clinicCode, 'POINT2内容', '詳細説明2')
                },
                {
                    icon: 'coin',
                    title: this.getClinicText(clinicCode, 'POINT3タイトル', 'ポイント3'),
                    description: this.getClinicText(clinicCode, 'POINT3内容', '詳細説明3')
                }
            ]
        };
        
        return detailData;
    }

    // 現在選択されているクリニックを判定する関数
    getCurrentClinic() {
        // URLパラメータから判定
        const urlParams = new URLSearchParams(window.location.search);
        const clinicParam = urlParams.get('clinic');
        if (clinicParam) {
            return clinicParam;
        }

        // 地域の1位クリニックをデフォルトとして使用
        const currentRegionId = this.getCurrentRegionId();
        const ranking = this.getRankingByRegionId(currentRegionId);
        if (ranking && ranking.ranks && ranking.ranks.no1) {
            const topClinicId = ranking.ranks.no1;
            // getClinicCodeByIdを使用して動的に取得
            const clinicCode = this.getClinicCodeById(topClinicId);
            if (clinicCode) return clinicCode;
        }
        
        // デフォルトは最初のクリニックのコードを使用
        const firstClinic = this.clinics && this.clinics[0];
        return firstClinic ? firstClinic.code : '';
    }

    // 現在の地域IDを取得
    getCurrentRegionId() {
        // URLパラメータから取得
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('region_id') || '000'; // デフォルトは全国
    }

    // 地域IDをマッピング（存在しない地域を適切な地域にマッピング）
    mapRegionId(regionId) {
        // 正規化（3桁にパディング）
        const paddedRegionId = String(regionId).padStart(3, '0');
        const unpaddedRegionId = String(parseInt(regionId, 10));
        
        // まず、実際にregions配列に存在するかチェック
        const existsInRegions = this.regions.find(r => 
            r.id === paddedRegionId || 
            r.id === unpaddedRegionId || 
            r.id === String(regionId)
        );
        
        // 実際のデータが存在する場合は、その地域IDを返す
        if (existsInRegions) {
            // ランキングデータが存在するかもチェック
            const hasRanking = this.rankings.find(r => 
                r.regionId === paddedRegionId || 
                r.regionId === unpaddedRegionId || 
                r.regionId === String(regionId)
            );
            
            if (hasRanking) {
                // ランキングデータが存在する場合はその地域IDを返す
                return hasRanking.regionId;
            }
            
            // 地域は存在するがランキングがない場合は、マッピングを行う
            console.log(`Region ${regionId} exists but has no ranking data, will map to another region`);
        }
        
        // 000は全国版
        if (regionId === '000' || regionId === '0' || String(regionId) === '0') {
            return '000';
        }
        
        
        // マッピングが存在する場合（グローバルregionMappingがあれば優先、なければデフォルト）
        const defaultRegionMapping = {
            // 例: 北海道(001)→東京(013)にフォールバック
            '001': '013'
        };
        const mapping = (typeof window !== 'undefined' && window.regionMapping && typeof window.regionMapping === 'object')
            ? window.regionMapping
            : defaultRegionMapping;
        if (mapping && mapping[paddedRegionId]) {
            console.log(`Region ${regionId} mapped to ${mapping[paddedRegionId]}`);
            return mapping[paddedRegionId];
        }
        
        // それでも見つからない場合は東京にフォールバック
        console.warn(`Unknown region ID: ${regionId}, falling back to Tokyo (013)`);
        return '013';
    }

    // 地域IDでランキングを取得
    getRankingByRegionId(regionId) {
        // 地域IDをマッピング
        const mappedRegionId = this.mapRegionId(regionId);
        
        // 全国版（000）の場合は東京（013）のランキングを使用
        // 北海道（001）の場合も東京（013）にフォールバック
        let targetRegionId = mappedRegionId;

        
        // データ構造がオブジェクト形式なので直接参照
        const paddedRegionId = String(targetRegionId).padStart(3, '0');
        
        // rankingsオブジェクトから直接取得（Object.entries変換後のデータ構造に対応）
        let ranking = this.rankings.find(r => r.regionId === paddedRegionId);
        if (!ranking) {
            // フォールバック: パディングなしでも検索
            ranking = this.rankings.find(r => r.regionId === String(targetRegionId));
        }
        
        // 見つからない場合は東京にフォールバック
        if (!ranking) {
            console.warn(`⚠️ region_id ${regionId} (mapped to ${targetRegionId}) のランキングが見つかりません。東京（013）にフォールバックします。`);
            ranking = this.rankings.find(r => r.regionId === '013');
        }
        
        return ranking;
    }

    // 地域IDで店舗を取得（store_viewデータを使用してランキングに対応した店舗を取得）
    getStoresByRegionId(regionId) {
        // 地域IDをマッピング（000→013, 001→013など）
        const mappedRegionId = this.mapRegionId(regionId);
        
        // store_viewから該当地域のデータを取得
        // storeViewsは3桁パディング形式で保存されている
        let storeView = this.storeViews.find(sv => sv.regionId === mappedRegionId);
        
        // 見つからない場合は、非パディング形式でも検索
        if (!storeView) {
            const normalizedRegionId = String(parseInt(mappedRegionId, 10));
            storeView = this.storeViews.find(sv => sv.regionId === normalizedRegionId);
        }
        
        if (!storeView) {
            console.warn(`⚠️ region_id ${regionId} (mapped to ${mappedRegionId}) の店舗ビューが見つかりません。`);
            return [];
        }
        
        // ランキングデータを取得して、表示されているクリニックを特定
        const ranking = this.getRankingByRegionId(regionId);
        
        if (!ranking) {
            console.warn(`⚠️ region_id ${regionId} のランキングが見つかりません。`);
            return [];
        }
        
        // 表示する店舗IDのリストを作成
        const storeIdsToShow = [];
        
        // ランキングに表示されているクリニックIDに対応する店舗IDを取得
        // 新しい構造: クリニックコードベースのキー（dio_stores, sbc_stores等）
        Object.entries(ranking.ranks).forEach(([position, clinicId]) => {
            // クリニックIDからクリニックを取得
            const clinic = this.clinics.find(c => c.id === clinicId);
            if (!clinic) {
                console.warn(`  ⚠️ Clinic not found for ID: ${clinicId}`);
                return;
            }
            
            // クリニックコードから対応するキーを作成
            const clinicKey = `${clinic.code}_stores`;
            
            if (storeView.clinicStores[clinicKey]) {
                storeIdsToShow.push(...storeView.clinicStores[clinicKey]);
            } else {
                // console.warn(`  ⚠️ No stores found for key: ${clinicKey} in region ${mappedRegionId}`);
            }
        });
        
        // 店舗IDに基づいて実際の店舗情報を取得
        // アンダースコアで区切られた複数店舗IDを処理
        const allStoreIds = [];
        
        storeIdsToShow.forEach(storeId => {
            if (storeId.includes('/')) {
                // dio_009/dio_010 のような形式を分割
                const ids = storeId.split('/');
                allStoreIds.push(...ids);
            } else {
                allStoreIds.push(storeId);
            }
        });
        
        
        const result = this.stores.filter(store => 
            allStoreIds.includes(store.id)
        );
        
        return result;
    }

    // クリニック名で店舗を取得
    getStoresByClinicName(clinicName) {
        return this.stores.filter(s => s.clinicName === clinicName);
    }

    // 地域IDとクリニック名で店舗を取得
    getStoresByRegionAndClinic(regionId, clinicName) {
        return this.stores.filter(s => 
            s.regionId === regionId && s.clinicName === clinicName
        );
    }

    // 地域IDでキャンペーンを取得
    getCampaignsByRegionId(regionId) {
        return this.campaigns.filter(c => c.regionId === regionId);
    }

    // 地域IDとクリニックIDでキャンペーンを取得
    getCampaignByRegionAndClinic(regionId, clinicId) {
        return this.campaigns.find(c => 
            c.regionId === regionId && c.clinicId === clinicId
        );
    }
}
// アプリケーションクラス
class RankingApp {
    constructor() {
        this.urlHandler = new UrlParamHandler();
        this.displayManager = new DisplayManager(this.urlHandler);
        this.dataManager = null;
        this.currentRegionId = null;
        this.textsInitialized = false;
    }

    normalizeRegionId(regionId) {
        if (regionId === undefined || regionId === null) return '';
        const raw = String(regionId).trim();
        if (!raw) return '';
        if (/^\d+$/.test(raw)) {
            const num = parseInt(raw, 10);
            if (Number.isNaN(num)) return '';
            return num.toString().padStart(3, '0');
        }
        return raw;
    }

    isNationalRegion(regionId, region = null) {
        const normalized = this.normalizeRegionId(regionId ?? region?.id);
        if (normalized === '000') return true;
        const regionName = region && region.name ? String(region.name).trim() : '';
        return regionName === '全国';
    }

    applyRegionLabels(region, options = {}) {
        if (!region && options.regionId === undefined && this.currentRegionId === null) {
            return;
        }

        const regionIdRaw = options.regionId !== undefined ? options.regionId : region?.id ?? this.currentRegionId;
        const normalizedId = this.normalizeRegionId(regionIdRaw);
        const regionName = region && region.name ? region.name : '';
        const isNational = this.isNationalRegion(normalizedId, region);

        const mvRegionElement = document.getElementById('mv-region-name');
        if (mvRegionElement) {
            mvRegionElement.textContent = isNational ? '最新' : regionName;
        }

        const detailRegionElement = document.getElementById('detail-region-name');
        if (detailRegionElement) {
            if (isNational) {
                detailRegionElement.textContent = '[最新版] 人気のクリニック';
                detailRegionElement.style.left = '3%';
            } else {
                detailRegionElement.textContent = `${regionName}で人気のクリニック`;
                const nameLength = regionName.length;
                let leftPosition = '3%';
                if (nameLength === 2) {
                    leftPosition = '4%';
                } else if (nameLength === 3) {
                    leftPosition = '1%';
                }
                detailRegionElement.style.left = leftPosition;
            }
        }

        const comparisonRegionElement = document.getElementById('comparison-region-name');
        if (comparisonRegionElement) {
            if (isNational) {
                comparisonRegionElement.textContent = '';
                comparisonRegionElement.style.display = 'none';
            } else {
                comparisonRegionElement.textContent = regionName;
                comparisonRegionElement.style.removeProperty('display');
            }
        }

        const rankRegionElement = document.getElementById('rank-region-name');
        if (rankRegionElement) {
            const baseText = (this.dataManager && typeof this.dataManager.getCommonText === 'function')
                ? this.dataManager.getCommonText('ランキング地域名テキスト', 'で人気の脂肪溶解注射はココ！')
                : 'で人気の脂肪溶解注射はココ！';
            if (isNational) {
                const suffix = baseText.replace(/^で/, '');
                rankRegionElement.textContent = `いま${suffix}`;
                rankRegionElement.style.left = '52%';
            } else {
                rankRegionElement.textContent = `${regionName}${baseText}`;
                const nameLength = regionName.length;
                let leftPosition = '52%';
                if (nameLength === 3) {
                    leftPosition = '51%';
                } else if (nameLength >= 4) {
                    leftPosition = '50%';
                }
                rankRegionElement.style.left = leftPosition;
            }
        }
    }

    async init() {
        try {
            // データマネージャーの初期化
            this.dataManager = new DataManager();
            await this.dataManager.init();
            
            // グローバルアクセス用にwindowオブジェクトに設定
            window.dataManager = this.dataManager;
            window.urlHandler = this.urlHandler;
            

            // 初期地域IDの取得（URLパラメータから取得、なければデフォルト）
            this.currentRegionId = this.urlHandler.getRegionId();

            // 地域セレクターの初期化
            const regions = this.dataManager.getAllRegions();
            this.displayManager.updateRegionSelector(regions, this.currentRegionId);

            // イベントリスナーの設定
            this.setupEventListeners();

            // 初期表示の更新
            this.updatePageContent(this.currentRegionId);
            // PR行の再描画（データ準備完了後に一度実行）
            try { if (typeof window.__renderPrLine === 'function') window.__renderPrLine(); } catch (_) {}
            
            // 地図モーダルの設定
            setTimeout(() => {
                this.setupMapAccordions();
            }, 100);
        } catch (error) {
            this.displayManager.showError('データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    setupEventListeners() {
        // 地域選択の変更イベント（検索フィルター用）
        if (this.displayManager.regionSelect) {
            this.displayManager.regionSelect.addEventListener('change', () => {
                this.handleClinicSearch(this.displayManager.searchInput?.value || '');
            });
        }

        // クリニック名検索機能
        if (this.displayManager.searchInput) {
            this.displayManager.searchInput.addEventListener('input', (e) => {
                this.handleClinicSearch(e.target.value);
            });
        }
        
        // 対応部位フィルター
        const specialtyFilter = document.getElementById('sidebar-specialty-filter');
        if (specialtyFilter) {
            specialtyFilter.addEventListener('change', () => {
                this.handleClinicSearch(this.displayManager.searchInput?.value || '');
            });
        }
        
        // 店舗数フィルター
        const hoursFilter = document.getElementById('sidebar-hours-filter');
        if (hoursFilter) {
            hoursFilter.addEventListener('change', () => {
                this.handleClinicSearch(this.displayManager.searchInput?.value || '');
            });
        }

        // サイドバー検索ボタンのイベント
        const sidebarSearchButton = document.querySelector('.sidebar-search-link');
        if (sidebarSearchButton) {
            sidebarSearchButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                // フィルター値を取得
                const params = new URLSearchParams();
                
                // 地域（検索フィルター用）
                const regionFilter = document.getElementById('sidebar-region-select');
                if (regionFilter && regionFilter.value) {
                    params.append('search-region', regionFilter.value);
                }
                
                // クリニック名
                const clinicSearch = document.getElementById('sidebar-clinic-search');
                if (clinicSearch && clinicSearch.value) {
                    params.append('clinic', clinicSearch.value);
                }
                
                // 対応部位
                const specialtyFilter = document.getElementById('sidebar-specialty-filter');
                if (specialtyFilter && specialtyFilter.value) {
                    params.append('bodyPart', specialtyFilter.value);
                }
                
                // 店舗数
                const hoursFilter = document.getElementById('sidebar-hours-filter');
                if (hoursFilter && hoursFilter.value) {
                    params.append('storeCount', hoursFilter.value);
                }
                
                // 現在のregion_idを追加
                params.append('region_id', this.currentRegionId);
                
                // 検索結果ページへ遷移
                const basePath = window.SITE_CONFIG ? window.SITE_CONFIG.basePath : '';
                // basePathが空なら相対パスで遷移（同ディレクトリ内）
                const prefix = basePath || '.';
                const searchUrl = `${prefix}/search-results.html?${params.toString()}`;
                window.location.href = searchUrl;
            });
        }
        
        // ハンバーガーメニューのイベント
        
        if (this.displayManager.hamburgerMenu) {
            this.displayManager.hamburgerMenu.addEventListener('click', (e) => {
                e.stopPropagation(); // イベントの伝播を停止
                
                this.displayManager.hamburgerMenu.classList.toggle('active');
                this.displayManager.sidebarMenu.classList.toggle('active');
                this.displayManager.sidebarOverlay.classList.toggle('active');
            });
        } else {
        }

        // サイドバーを閉じる
        if (this.displayManager.closeSidebar) {
            this.displayManager.closeSidebar.addEventListener('click', () => {
                this.displayManager.hamburgerMenu.classList.remove('active');
                this.displayManager.sidebarMenu.classList.remove('active');
                this.displayManager.sidebarOverlay.classList.remove('active');
            });
        }

        // オーバーレイクリックで閉じる
        if (this.displayManager.sidebarOverlay) {
            this.displayManager.sidebarOverlay.addEventListener('click', () => {
                this.displayManager.hamburgerMenu.classList.remove('active');
                this.displayManager.sidebarMenu.classList.remove('active');
                this.displayManager.sidebarOverlay.classList.remove('active');
            });
        }

    }

    changeRegion(regionId) {
        // URLパラメータの更新はしない（region_idを付与しない）
        // this.urlHandler.updateRegionId(regionId);
        this.currentRegionId = regionId;

        // ページコンテンツの更新
        this.updatePageContent(regionId);
    }

    // 指定地域にクリニックの店舗があるかチェック
    getClinicStoresByRegion(clinicName, regionId) {
        // クリニック名を正規化
        const normalizedClinicName = clinicName.replace(/の\d+$/, '').trim(); // 「ディオクリニックの1」→「ディオクリニック」
        
        // 該当地域の店舗を取得
        const regionStores = this.dataManager.getStoresByRegionId(regionId);
        
        // クリニック名はそのまま使用（マッピング不要）
        const storeClinicName = normalizedClinicName;
        
        // 該当するクリニックの店舗をフィルタリング
        return regionStores.filter(store => store.clinicName === storeClinicName);
    }

    // クリニック検索処理
    handleClinicSearch(searchTerm) {
        const searchTermLower = searchTerm.toLowerCase().trim();
        
        // フィルター条件を取得
        const regionFilter = document.getElementById('sidebar-region-select')?.value || '';
        const specialtyFilter = document.getElementById('sidebar-specialty-filter')?.value || '';
        const hoursFilter = document.getElementById('sidebar-hours-filter')?.value || '';

        // ランキングカードの検索
        const rankingItems = document.querySelectorAll('.ranking-item');
        let visibleRankingCount = 0;
        
        rankingItems.forEach(item => {
            const clinicNameElement = item.querySelector('.clinic-logo-section');
            const clinicName = clinicNameElement ? clinicNameElement.textContent.trim() : '';
            
            // クリニック名の条件
            const nameMatch = searchTermLower === '' || clinicName.toLowerCase().includes(searchTermLower);
            
            // 地域フィルタリングの条件
            let regionMatch = true;
            if (regionFilter) {
                // クリニックに対応する店舗が選択された地域にあるかチェック
                const clinicStores = this.getClinicStoresByRegion(clinicName, regionFilter);
                regionMatch = clinicStores.length > 0;
            }
            
            // フィルター条件の判定
            const specialtyMatch = specialtyFilter === '';
            const hoursMatch = hoursFilter === '';
            
            if (nameMatch && regionMatch && specialtyMatch && hoursMatch) {
                item.style.display = '';
                visibleRankingCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // テーブル内の行を検索（すべてのタブ）
        const allTableRows = document.querySelectorAll('#ranking-tbody tr, #treatment-tbody tr, #service-tbody tr');
        let visibleRowCount = 0;
        
        allTableRows.forEach(row => {
            const clinicName = row.querySelector('.clinic-main-name')?.textContent || '';
            
            // クリニック名の条件
            const nameMatch = searchTermLower === '' || clinicName.toLowerCase().includes(searchTermLower);
            
            // 地域フィルタリングの条件
            let regionMatch = true;
            if (regionFilter) {
                const clinicStores = this.getClinicStoresByRegion(clinicName, regionFilter);
                regionMatch = clinicStores.length > 0;
            }
            
            if (nameMatch && regionMatch) {
                row.style.display = '';
                visibleRowCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // 詳細セクションの検索
        const detailItems = document.querySelectorAll('.detail-item');
        detailItems.forEach(item => {
            const clinicName = item.querySelector('.clinic-name')?.textContent || '';
            
            // クリニック名の条件
            const nameMatch = searchTermLower === '' || clinicName.toLowerCase().includes(searchTermLower);
            
            // 地域フィルタリングの条件
            let regionMatch = true;
            if (regionFilter) {
                const clinicStores = this.getClinicStoresByRegion(clinicName, regionFilter);
                regionMatch = clinicStores.length > 0;
            }
            
            if (nameMatch && regionMatch) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // ランキングカードセクションの検索結果メッセージ
        const rankingList = document.getElementById('ranking-list');
        const existingMsg = document.getElementById('no-search-results');
        
        if (visibleRankingCount === 0 && searchTermLower !== '') {
            if (!existingMsg) {
                const noResultsMsg = document.createElement('div');
                noResultsMsg.id = 'no-search-results';
                noResultsMsg.className = 'empty-state';
                noResultsMsg.innerHTML = '<p>「' + searchTerm + '」に一致するクリニックが見つかりませんでした</p>';
                rankingList.appendChild(noResultsMsg);
            }
        } else if (existingMsg) {
            existingMsg.remove();
        }

        // テーブルの検索結果メッセージ
        const activeTabContent = document.querySelector('.tab-content.active tbody');
        const existingTableMsg = document.getElementById('no-search-results-row');
        
        if (visibleRowCount === 0 && searchTermLower !== '' && activeTabContent) {
            if (!existingTableMsg) {
                const noResultsRow = document.createElement('tr');
                noResultsRow.id = 'no-search-results-row';
                noResultsRow.innerHTML = '<td colspan="5" class="empty-state"><p>検索結果が見つかりませんでした</p></td>';
                activeTabContent.appendChild(noResultsRow);
            }
        } else if (existingTableMsg) {
            existingTableMsg.remove();
        }

    }

    updatePageContent(regionId) {
        try {
            
            // region_idを正規化（"014" → "14"のように、先頭の0を削除）
            const normalizedRegionId = String(parseInt(regionId, 10));
            
            // 地域IDマッピング（存在しない地域を適切な地域にマッピング）
            const mappedRegionId = this.dataManager.mapRegionId(regionId);
            
            let region;
            if (regionId === '000' || regionId === '0' || String(regionId) === '0') {
                // 全国版の場合は仮想的な地域データを作成（元のregionIdが000の場合）
                region = {
                    id: '000',
                    name: '全国',
                    parentId: null
                };
                console.log('Created 全国 region object:', region);
            } else {
                // 地域情報の取得
                region = this.dataManager.getRegionById(String(parseInt(mappedRegionId, 10)));
                if (!region) {
                    // それでも見つからない場合は東京にフォールバック
                    console.warn(`Region not found for mapped ID: ${mappedRegionId}, falling back to Tokyo`);
                    region = this.dataManager.getRegionById('13'); // 東京
                }
            }

            // 地域名の更新
            this.displayManager.updateSelectedRegionName(region.name);
            
            //SVGの地域テキストも更新
            const mvRegionTextElement = document.getElementById('mv-region-text');
            if (mvRegionTextElement) {
                mvRegionTextElement.textContent = region.name;
            }

            // 地域表記のバリエーションを適用
            this.applyRegionLabels(region, { regionId });

            // サイト全体のテキストを動的に更新
            // updateAllTextsは比較表などの更新を行うが、地域名は既に設定済み
            if (!this.textsInitialized) {
                setTimeout(() => {
                    this.updateAllTexts(regionId); // 元のregionIdを渡す（000の場合の処理のため）
                    this.textsInitialized = true;
                    // updateAllTexts後に地域名を確実に設定（上書き防止のため強制的に再設定）
                    setTimeout(() => {
                        this.forceUpdateRegionNames(region);
                    }, 50);
                }, 100);
            } else {
                this.updateAllTexts(regionId); // 元のregionIdを渡す（000の場合の処理のため）
                // updateAllTexts後に地域名を確実に設定（上書き防止のため強制的に再設定）
                setTimeout(() => {
                    this.forceUpdateRegionNames(region);
                }, 50);
            }

            // ランキングヘッダーのテキストも地域仕様に合わせる
            this.applyRegionLabels(region, { regionId });
            
            // ランキングバナーのalt属性も動的に更新
            const rankingBannerImages = document.querySelectorAll('.ranking-banner-image');
            if (rankingBannerImages.length > 0) {
                const altText = this.dataManager.getCommonText('ランキングバナーAltテキスト', 'で人気の脂肪溶解注射はココ！');
                rankingBannerImages.forEach(img => {
                    img.alt = region.name + altText;
                });
            }

            // ランキングの取得と表示 (マッピングされた地域IDを使用)
            const ranking = this.dataManager.getRankingByRegionId(regionId);
            const allClinics = this.dataManager.getAllClinics();
            this.displayManager.updateRankingDisplay(allClinics, ranking);

            // フッターの人気クリニックを更新
            this.displayManager.updateFooterClinics(allClinics, ranking);

            // 店舗リストの取得と表示（クリニックごとにグループ化）
            // 店舗一覧表示は無効化（不要なUIのため）
            // const stores = this.dataManager.getStoresByRegionId(normalizedRegionId);
            // const clinicsWithStores = this.groupStoresByClinics(stores, ranking, allClinics);
            // this.displayManager.updateStoresDisplay(stores, clinicsWithStores);

            // 比較表ヘッダーの更新
            this.updateComparisonHeaders();
            
            // 比較表の更新
            this.updateComparisonTable(allClinics, ranking);
            
            // 比較表タブ機能の初期化
            this.setupComparisonTabs();
            
            // 詳細コンテンツの更新 (正規化されたIDを使用)
            this.updateClinicDetails(allClinics, ranking, normalizedRegionId);

            // ランキング詳細DOM挿入後にバナースライダーを確実に初期化
            // （initializeBannerSlidersは多重初期化ガード付き）
            setTimeout(() => {
                try { initializeBannerSliders(); } catch (_) {}
            }, 0);
            
            // 比較表の注釈を更新（1位〜5位）
            setTimeout(() => {
                initializeDisclaimers();
            }, 100);

            // 地図モーダルの設定
            setTimeout(() => {
                this.setupMapAccordions();
            }, 100);

            // エラーメッセージを隠す
            this.displayManager.hideError();
        } catch (error) {
            console.error('Error in updatePageContent:', error);
            this.displayManager.showError('データの表示に問題が発生しました。');
            
            // デフォルト地域にフォールバック
            if (regionId !== '000') {
                this.changeRegion('000');
            }
        }
    }

    // 地域名を復元（updateAllTexts後の上書き防止）
    restoreRegionNames(region) {
        this.applyRegionLabels(region, { regionId: region?.id ?? this.currentRegionId });
    }

    forceUpdateRegionNames(region) {
        this.applyRegionLabels(region, { regionId: region?.id ?? this.currentRegionId });
    }

    // サイト全体のテキストを動的に更新（クリニック別対応）
    updateAllTexts(regionId) {
        try {
            const currentClinic = this.dataManager.getCurrentClinic();

            const mappedRegionIdRaw = this.dataManager.mapRegionId(regionId);
            const normalizedMappedRegionId = this.normalizeRegionId(mappedRegionIdRaw ?? regionId);
            let regionForDisplay = null;
            if (normalizedMappedRegionId === '000') {
                regionForDisplay = { id: '000', name: '全国' };
            } else {
                const regionCandidate = this.dataManager.getRegionById(String(parseInt(normalizedMappedRegionId || '0', 10)));
                if (regionCandidate) {
                    regionForDisplay = {
                        id: this.normalizeRegionId(regionCandidate.id),
                        name: regionCandidate.name
                    };
                }
            }
            if (!regionForDisplay) {
                regionForDisplay = {
                    id: normalizedMappedRegionId || '',
                    name: ''
                };
            }
            const isNational = this.isNationalRegion(regionId, regionForDisplay);

            // ページタイトルの更新
            // メタディスクリプションの更新
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                const metaDescText = this.dataManager.getClinicText(currentClinic, 'メタディスクリプション', 'あなたの地域の優良クリニックを探そう。');
                metaDesc.setAttribute('content', metaDescText);
            }

            // サイトロゴの更新（共通テキスト）
            const siteLogo = document.querySelector('.site-logo');
            if (siteLogo) {
                const logoText = this.dataManager.getCommonText('サイト名', '医療ダイエット比較.com');
                siteLogo.textContent = logoText;
            } else {
                console.warn('⚠️ サイトロゴ要素が見つかりません');
            }

            // MVアピールテキストの更新（共通テキスト）
            const appealText1Element = document.getElementById('mv-left-appeal-text');
            if (appealText1Element) {
                const text1 = this.dataManager.getCommonText('MVアピールテキスト1', 'コスパ');
                appealText1Element.textContent = text1;
            }


            // SVGテキストの更新（共通テキスト）
            const svgText1Element = document.querySelector('#mv-main-svg-text text');
            if (svgText1Element) {
                const svgText1 = this.dataManager.getCommonText('MVSVGテキスト1', '脂肪溶解注射');
                svgText1Element.textContent = svgText1;
            }

            // SVGテキスト2の更新（共通テキスト、ランキング数を動的に計算）
            const svgText2Element = document.querySelector('#mv-appeal1-text text');
            if (svgText2Element) {
                // 現在の地域のランキング数を取得 (正規化されたIDを使用)
                const normalizedRegionId = String(parseInt(regionId, 10));
                const ranking = this.dataManager.getRankingByRegionId(normalizedRegionId);
                let rankCount = 5; // デフォルト値
                
                if (ranking && ranking.ranks) {
                    // ランキングに含まれるクリニック数を計算（"-"以外のものをカウント）
                    const validRanks = Object.entries(ranking.ranks)
                        .filter(([key, value]) => value !== '-' && value !== null && value !== undefined)
                        .length;
                    if (validRanks > 0) {
                        rankCount = Math.min(validRanks, 5); // 最大5位まで
                    }
                }
                
                // プレースホルダーを使用してテキストを取得
                const svgText2 = this.dataManager.getCommonText('MVSVGテキスト2', 'ランキング', {
                    RANK_COUNT: rankCount
                });
                svgText2Element.textContent = svgText2;
                
                // detail-rank-best要素の更新
                const detailRankBestElement = document.getElementById('detail-rank-best');
                if (detailRankBestElement) {
                    detailRankBestElement.innerHTML = `${rankCount}<span style="font-size: 0.6em;"> 選！</span>`;
                }
            }

            // ランキングバナーのalt属性更新（共通テキスト）
            const rankingBanner = document.querySelector('.ranking-banner-image');
            if (rankingBanner) {
                const rankingAlt = this.dataManager.getCommonText('ランキングバナーalt', 'で人気の脂肪溶解注射はここ！');
                rankingBanner.setAttribute('alt', rankingAlt);
            }

            // 比較表タイトルの更新（共通テキスト）
            const comparisonTitle = document.querySelector('.comparison-title');
            if (comparisonTitle) {
                const baseTitleText = this.dataManager.getCommonText('比較表タイトル', 'で人気の脂肪溶解注射');
                const adjustedTitleText = isNational ? baseTitleText.replace(/^で/, '') : baseTitleText;
                const spanStyle = isNational ? ' style="display:none;"' : '';
                const spanText = isNational ? '' : (regionForDisplay?.name || '');
                comparisonTitle.innerHTML = `<span id="comparison-region-name"${spanStyle}>${spanText}</span>${adjustedTitleText}`;
            }

            // 比較表サブタイトルの更新（共通テキスト）
            const comparisonSubtitle = document.querySelector('.comparison-subtitle');
            if (comparisonSubtitle) {
                const subtitleHtml = this.dataManager.getCommonText('比較表サブタイトル', 'クリニックを<span class="pink-text">徹底比較</span>');
                comparisonSubtitle.innerHTML = this.dataManager.processDecoTags(subtitleHtml);
            }

            this.applyRegionLabels(regionForDisplay, { regionId });
            
            // 案件詳細バナーのalt属性を更新（共通テキスト）
            const detailsBannerImg = document.querySelector('.details-banner-image');
            if (detailsBannerImg) {
                const detailsBannerAlt = this.dataManager.getCommonText('案件詳細バナーalt', 'コスパ×効果×通いやすさで選ぶ脂肪冷却BEST3');
                detailsBannerImg.setAttribute('alt', detailsBannerAlt);
            }
            
            // フッターサイト名の更新（共通テキスト）
            const footerSiteName = document.querySelector('.footer_contents h4 a');
            if (footerSiteName) {
                const footerText = this.dataManager.getCommonText('サイト名', '医療ダイエット比較.com');
                footerSiteName.textContent = footerText;
            }
            
            // フッターコピーライトの更新（共通テキスト）
            const footerCopyright = document.querySelector('.copyright');
            if (footerCopyright) {
                const siteName = this.dataManager.getCommonText('サイト名', '医療ダイエット比較.com');
                const copyrightText = '© 2025 ' + siteName;
                footerCopyright.textContent = copyrightText;
            }
            
            // Tipsセクションの更新（共通テキスト）
            // タブタイトルの更新
            const tabTexts = document.querySelectorAll('.tips-container .tab-text');
            if (tabTexts.length >= 3) {
                tabTexts[0].textContent = this.dataManager.getCommonText('Tipsタブ1タイトル', '効果');
                tabTexts[1].textContent = this.dataManager.getCommonText('Tipsタブ2タイトル', '選び方');
                tabTexts[2].textContent = this.dataManager.getCommonText('Tipsタブ3タイトル', 'おすすめ');
            }
            
            // Tips内容の更新（タブコンテンツ内のp要素）
            const tabContents = document.querySelectorAll('.tips-container .tab-content');
            if (tabContents.length >= 3) {
                const tips1P = tabContents[0].querySelector('p');
                if (tips1P) {
                    const tips1Content = this.dataManager.getCommonText('Tips1内容', '');
                    tips1P.innerHTML = this.dataManager.processDecoTags(tips1Content);
                }
                
                const tips2P = tabContents[1].querySelector('p');
                if (tips2P) {
                    const tips2Content = this.dataManager.getCommonText('Tips2内容', '');
                    tips2P.innerHTML = this.dataManager.processDecoTags(tips2Content);
                }
                
                const tips3P = tabContents[2].querySelector('p');
                if (tips3P) {
                    const tips3Content = this.dataManager.getCommonText('Tips3内容', '');
                    tips3P.innerHTML = this.dataManager.processDecoTags(tips3Content);
                }
            }

            // 注意事項HTMLの更新（既存の注意事項を置き換える）
            const disclaimerHTML = this.dataManager.getCommonText('注意事項HTML', '');
            if (disclaimerHTML) {
                // 既存の注意事項セクションを探す
                const disclaimerAccordion = document.querySelector('.disclaimer-accordion');
                if (disclaimerAccordion) {
                    // 既存の main-disclaimer を置き換える
                    const existingMainDisclaimer = disclaimerAccordion.querySelector('.main-disclaimer');
                    if (existingMainDisclaimer) {
                        // 注意：JSONからのHTMLが正しい形式でない場合があるので、確認
                        // 現在は既存のHTMLはそのまま使用
                    }
                }
            }
            // （ヘッダー名の動的変更は行わない）

        } catch (error) {
            console.error('❌ updateAllTextsでエラーが発生:', error);
        }
    }

    // 店舗をクリニックごとにグループ化して表示順を管理
    groupStoresByClinics(stores, ranking, allClinics) {
        const clinicsWithStores = new Map();
        
        if (!ranking || !stores || stores.length === 0) {
            return clinicsWithStores;
        }

        // ランキング順にクリニックを処理
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        });

        sortedRanks.forEach(([position, clinicId]) => {
            const clinic = allClinics.find(c => c.id === clinicId);
            if (clinic) {
                // クリニック名はそのまま使用（stores.csvとitems.csvで名前は統一されている）
                const storeClinicName = clinic.name;
                
                // このクリニックに属する店舗をクリニック名でフィルタリング
                const clinicStores = stores.filter(store => 
                    store.clinicName === storeClinicName
                );
                
                // 店舗がない場合も空配列でMapに追加（全クリニックを表示するため）
                clinicsWithStores.set(clinic, clinicStores);
            }
        });

        return clinicsWithStores;
    }

    // 比較表ヘッダーの更新
    updateComparisonHeaders() {
        const headerRow = document.getElementById('comparison-header-row');
        if (!headerRow) return;
        
        // ヘッダーをクリア
        headerRow.innerHTML = '';
        
        // clinic-texts.jsonの比較表ヘッダー設定から取得
        const headerConfig = this.dataManager.clinicTexts['比較表ヘッダー設定'] || {};
        
        // ヘッダーを動的に生成
        // 最初の「クリニック」は固定、それ以降はheaderConfigから取得
        const headers = [
            { key: null, default: '', class: '', fixed: true },  // 固定項目
            { key: '比較表ヘッダー1', default: '', class: '' },
            { key: '比較表ヘッダー2', default: '', class: '' },
            { key: '比較表ヘッダー3', default: '', class: '' },
            { key: '比較表ヘッダー10', default: '', class: '' },
            { key: '比較表ヘッダー4', default: '', class: 'th-none', style: 'display: none;' },
            { key: '比較表ヘッダー5', default: '', class: 'th-none', style: 'display: none;' },
            { key: '比較表ヘッダー6', default: '', class: 'th-none', style: 'display: none;' },
            { key: '比較表ヘッダー7', default: '', class: 'th-none', style: 'display: none;' },
            { key: '比較表ヘッダー8', default: '', class: 'th-none', style: 'display: none;' },
            { key: '比較表ヘッダー9', default: '', class: 'th-none', style: 'display: none;' },
            { key: null, default: '', class: 'th-none', style: 'display: none;', fixed: true }
        ];
        
        headers.forEach(header => {
            const th = document.createElement('th');
            // 固定項目の場合はdefaultを使用、それ以外はheaderConfigから取得
            if (header.fixed) {
                th.textContent = header.default;
            } else {
                th.textContent = headerConfig[header.key] || header.default;
            }
            if (header.class) th.className = header.class;
            if (header.style) th.setAttribute('style', header.style);
            headerRow.appendChild(th);
        });
    }

    // タブボタンのHTMLを動的に生成（不要なのでコメントアウト）
    // HTMLに既存のタブがあるため、この関数は使用しない
    createTabButtons() {
        // この関数は使用しない
        return;
    }
    // 比較表タブ機能のセットアップ
    setupComparisonTabs() {
        // タブボタンのHTMLを動的に生成する処理を削除
        // 既存のHTMLに定義されているタブを使用する
        
        const tabItems = document.querySelectorAll('.comparison-tab-menu-item');
        
        if (!tabItems || tabItems.length === 0) {
            return;
        }

        
        // 各タブの列データ設定（CSVフィールド名で統一）
        const tabFieldMappings = {
            'tab1': ['クリニック名', 'comparison1', 'comparison2', 'comparison3', '公式サイト'], // 総合（総合評価、コスト、人気）
            'tab2': ['クリニック名', 'comparison4', 'comparison5', 'comparison6', '公式サイト'], // 施術内容（矯正範囲、目安期間、通院頻度）
            'tab3': ['クリニック名', 'comparison7', 'comparison8', 'comparison9', '公式サイト'] // サービス（実績/症例数、ワイヤー矯正の紹介、サポート）
        };
        
        // タブクリックイベントリスナーを設定
        tabItems.forEach(tabItem => {
            // 既存のイベントリスナーを削除
            const newTabItem = tabItem.cloneNode(true);
            tabItem.parentNode.replaceChild(newTabItem, tabItem);
            
            newTabItem.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 全てのタブからアクティブクラスを削除
                document.querySelectorAll('.comparison-tab-menu-item').forEach(item => {
                    item.classList.remove('tab-active');
                });
                
                // クリックされたタブにアクティブクラスを追加
                newTabItem.classList.add('tab-active');
                
                // データ属性からタブIDを取得
                const targetTab = newTabItem.getAttribute('data-tab');
                // console.log(`${targetTab}タブがクリックされました`);
                
                // タブに応じてテーブルを再生成
                this.regenerateTableForTab(targetTab, tabFieldMappings[targetTab] || tabFieldMappings['tab1']);
            });
        });

        // 初期状態で総合タブのテーブルを生成
        this.regenerateTableForTab('tab1', tabFieldMappings['tab1']);
    }
    
    // タブ用のテーブルを動的に再生成
    // タブ用のテーブルを動的に再生成
    regenerateTableForTab(tabId, fieldNames) {
        const tbody = document.getElementById('comparison-tbody');
        const headerRow = document.getElementById('comparison-header-row');
        
        if (!tbody || !fieldNames) return;
        
        // CSVフィールド名から比較表ヘッダー設定のキーへのマッピング
        const fieldToHeaderMapping = {
            'comparison1': '比較表ヘッダー1', // 総合評価
            'comparison2': '比較表ヘッダー2', // コスト
            'comparison3': '比較表ヘッダー3', // 人気
            'comparison4': '比較表ヘッダー4', // 矯正範囲
            'comparison5': '比較表ヘッダー5', // 目安期間
            'comparison6': '比較表ヘッダー6', // 通院頻度
            'comparison7': '比較表ヘッダー7', // 実績/症例数
            'comparison8': '比較表ヘッダー8', // ワイヤー矯正の紹介
            'comparison9': '比較表ヘッダー9'  // サポート
        };
        
        // ヘッダーを再生成
        if (headerRow) {
            headerRow.innerHTML = '';
            const headerConfig = this.dataManager.clinicTexts['比較表ヘッダー設定'] || {};
            
            fieldNames.forEach(fieldName => {
                const th = document.createElement('th');
                
                if (fieldName === 'クリニック名') {
                    th.textContent = 'クリニック';
                } else if (fieldName === '公式サイト') {
                    th.textContent = '公式サイト';
                } else if (fieldToHeaderMapping[fieldName]) {
                    // CSVフィールド名からヘッダー設定のキーを取得して表示名を決定
                    const headerKey = fieldToHeaderMapping[fieldName];
                    th.textContent = headerConfig[headerKey] || fieldName;
                } else {
                    th.textContent = fieldName;
                }
                
                headerRow.appendChild(th);
            });
        }
        
        // 既存のクリニックデータを使ってtbodyを再生成
        tbody.innerHTML = '';
        
        // 現在表示されているクリニックのデータを取得
        const currentClinics = this.getCurrentDisplayedClinics();
        
        currentClinics.forEach((clinic, index) => {
            const tr = document.createElement('tr');

            if (index === 0) {
                tr.style.backgroundColor = '#fffbdc';
            } else if (index === 2 || index === 4) {
                tr.style.backgroundColor = 'rgb(249 249 249)';
            }
            
            const rankNum = clinic.rank || index + 1;
            const clinicId = clinic.id;
            const regionId = this.currentRegionId || '000';
            const clinicCode = clinic.code;
            
            // 各フィールドに対応するセルを生成
            fieldNames.forEach(fieldName => {
                const td = document.createElement('td');
                
                if (fieldName === 'クリニック名') {
                    // クリニック名とロゴ
                    const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
                    let logoPath = this.dataManager.getClinicText(clinicCode, 'クリニックロゴ画像パス', '');

                    if (!logoPath) {
                        // clinicCodeをそのままlogoFolderとして使用（invisalignの特別処理を削除）
                        const logoFolder = clinicCode;
                        logoPath = `../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.webp`;

                        // デバッグ用：画像パスの確認（ローカル環境のみ）
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                            // console.log(`比較表ロゴパス: clinicCode=${clinicCode}, logoFolder=${logoFolder}, logoPath=${logoPath}`);
                        }
                    }
                    
                    const redirectUrl = `./redirect.html#clinic_id=${clinicId}&rank=${rankNum}&region_id=${regionId}`;
                    const clinicNameOnclick = `onclick="localStorage.setItem('redirectParams', JSON.stringify({clinic_id: '${clinicId}', rank: '${rankNum}', region_id: '${regionId}'})); setTimeout(() => { window.open('${redirectUrl}', '_blank'); }, 10); return false;"`;
                    
                    td.className = 'ranking-table_td1';
                    td.innerHTML = `
                        <img src="${logoPath}" alt="${clinic.name}" width="80" data-rank="${rankNum}" class="comparison-logo">
                        <a href="#" ${clinicNameOnclick} class="clinic-link" style="cursor: pointer;">${clinic.name}</a>
                    `;
                } else if (fieldName === 'comparison1') {
                    // 総合評価と星表示
                    const rating = this.dataManager.getClinicText(clinicCode, 'comparison1', '4.5');
                    td.innerHTML = `
                        <span class="ranking_evaluation">${rating}</span><br>
                        <span class="star5_rating" data-rate="${rating}"></span>
                    `;
                } else if (fieldName === '公式サイト') {
                    // 公式サイトボタンと詳細を見るボタン
                    td.innerHTML = `
                        <a class="link_btn" href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank || rankNum)}" target="_blank">公式サイト &gt;</a><br>
                        <a class="detail_btn" href="#clinic${rankNum}">詳細をみる</a>
                    `;
                } else if (fieldName.startsWith('comparison')) {
                    // comparison2-9のフィールドはCSVフィールド名を使ってデータから取得
                    const cellData = this.dataManager.getClinicText(clinicCode, fieldName, '');
                    // processDecoTagsで処理してHTMLとして設定
                    if (cellData) {
                        td.innerHTML = this.dataManager.processDecoTags(cellData);
                    } else {
                        td.innerHTML = '';
                        console.log(`警告: ${clinicCode}の${fieldName}フィールドが空です`);
                    }
                } else {
                    // その他のフィールド
                    const cellData = this.dataManager.getClinicText(clinicCode, fieldName, '');
                    td.innerHTML = this.dataManager.processDecoTags(cellData || '');
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        // 星評価の初期化（必要に応じて）
        this.initializeStarRatings();
        
        // 詳細を見るリンクのイベントリスナーを再設定
        this.setupDetailScrollLinks();
    }
    
    
    // 現在表示されているクリニックのデータを取得
    getCurrentDisplayedClinics() {
        // 現在のランキングデータから表示中のクリニックを取得
        // RankingAppインスタンスから実際のランキングデータを取得
        if (this.dataManager && this.currentRegionId !== undefined) {
            const ranking = this.dataManager.getRankingByRegionId(this.currentRegionId);
            const clinics = this.dataManager.clinics || [];
            
            if (ranking && ranking.ranks) {
                const rankedClinics = [];
                
                // no1からno5まで順番に処理（1位→2位→3位→4位→5位の順）
                ['no1', 'no2', 'no3', 'no4', 'no5'].forEach((position, index) => {
                    const clinicId = ranking.ranks[position];
                    if (clinicId && clinicId !== '-') {
                        const numericClinicId = parseInt(clinicId);
                        const clinic = clinics.find(c => c.id == clinicId || c.id === numericClinicId);
                        if (clinic) {
                            rankedClinics.push({
                                ...clinic,
                                rank: index + 1
                            });
                        }
                    }
                });
                
                if (rankedClinics.length > 0) {
                    return rankedClinics;
                }
            }
        }
        
        // フォールバック：最新のランキングデータを使用
        return this.getLatestRankingData();
    }
    
    // 最新のランキングデータを取得（フォールバック用）
    getLatestRankingData() {
        // この関数はフォールバック用なので、実際のデータがない場合のみ使用される
        // 実際のランキングはgetCurrentDisplayedClinicsで動的に取得される
        console.warn('フォールバックデータが使用されています。実際のランキングデータが取得できませんでした。');

        // items.csvで有効なクリニックのみを使用
        if (window.dataManager && window.dataManager.clinics) {
            const validClinics = window.dataManager.clinics.filter(clinic => {
                // items.csvで有効とされているクリニックのみ
                const validIds = ['1', '2', '3', '4', '5']; // TCB, LUNA, リゼ, 品川, 聖心
                return validIds.includes(clinic.id);
            });

            return validClinics.slice(0, 5).map((clinic, index) => ({
                ...clinic,
                rank: index + 1
            }));
        }

        // フォールバック：items.csvで有効なクリニックのみ
      
    }
    
    // 星評価の初期化
    initializeStarRatings() {
        // 既存の星評価初期化コードがあれば呼び出し
        const starElements = document.querySelectorAll('.star5_rating[data-rate]');
        starElements.forEach(element => {
            const rate = parseFloat(element.getAttribute('data-rate'));
            // 星評価の表示ロジックを実装（既存のものがあれば使用）
        });
    }
    
    // テーブルの列表示を更新
    updateTableColumns(table, visibleColumns) {
        if (!table) return;
        
        // ヘッダー行の列を制御
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
            const headerCells = headerRow.querySelectorAll('th');
            headerCells.forEach((cell, index) => {
                if (visibleColumns.includes(index)) {
                    cell.style.display = '';
                    cell.classList.remove('th-none');
                } else {
                    cell.style.display = 'none';
                    cell.classList.add('th-none');
                }
            });
        }
        
        // データ行の列を制御
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (visibleColumns.includes(index)) {
                    cell.style.display = '';
                    cell.classList.remove('th-none');
                } else {
                    cell.style.display = 'none';
                    cell.classList.add('th-none');
                }
            });
        });
    }

    // 比較表の更新
    updateComparisonTable(clinics, ranking) {
        if (!ranking || Object.keys(ranking.ranks).length === 0) {
            return;
        }


        // ランキング順のクリニックデータを取得
        const rankedClinics = [];
        
        // no1からno5まで順番に処理（1位→2位→3位→4位→5位の順）
        ['no1', 'no2', 'no3', 'no4', 'no5'].forEach((position, index) => {
            const clinicId = ranking.ranks[position];
            if (clinicId && clinicId !== '-') {
                // クリニックIDが文字列の場合と数値の場合の両方に対応
                const numericClinicId = parseInt(clinicId);
                const clinic = clinics.find(c => c.id == clinicId || c.id === numericClinicId);
                if (clinic) {
                    rankedClinics.push({
                        ...clinic,
                        rank: index + 1  // 1位、2位、3位...
                    });
                }
            }
        });


        // 比較表の内容を生成（タブ機能で再生成されるためコメントアウト）
        // this.generateComparisonTable(rankedClinics);
        
        // 比較表タブ機能のセットアップ（これが初期テーブルも生成する）
        this.setupComparisonTabs();
        
        // 1位クリニックおすすめセクションを更新
        // setupComparisonTabsの後に、現在表示されているクリニックから1位を取得
        const displayedClinics = this.getCurrentDisplayedClinics();
        if (displayedClinics && displayedClinics.length > 0) {
            this.updateFirstChoiceRecommendation(displayedClinics[0]);
        }
        
        // レビュータブ切り替え機能の設定
        this.setupReviewTabs();
        
        // 詳細を見るリンクのイベントリスナーを設定
        this.setupDetailScrollLinks();
    }

    // 比較表の生成
    generateComparisonTable(clinics) {
        const tbody = document.getElementById('comparison-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        // 比較表ヘッダー設定を取得して動的にフィールド名を決定
        const headerConfig = this.dataManager.clinicTexts['比較表ヘッダー設定'] || {};
        const field2 = headerConfig['比較表ヘッダー2'] || 'コスト';  // デフォルトは'コスト'
        const field3 = headerConfig['比較表ヘッダー3'] || '人気';    // デフォルトは'人気'

        clinics.forEach((clinic, index) => {
            const tr = document.createElement('tr');

            // ランクに応じて背景色を調整（1位: 強調、3位/5位: 補助色）
            if (index === 0) {
                tr.style.backgroundColor = '#fffbdc';
            } else if (index === 2 || index === 4) {
                tr.style.backgroundColor = 'rgb(249 249 249)';
            }
            
            const rankNum = clinic.rank || index + 1;
            const clinicId = clinic.id;
            const regionId = this.currentRegionId || '000';
            
            // クリニックコードを取得
            const clinicCode = clinic.code;
            
            // クリニックの詳細データを取得する関数
            const getClinicData = (fieldName, defaultValue = '') => {
                return this.dataManager.getClinicText(clinicCode, fieldName, defaultValue);
            };
            
            // クリニックのロゴ画像パスをclinic-texts.jsonから取得
            const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
            let logoPath = getClinicData('meta13', '') || getClinicData('クリニックロゴ画像パス', '');
            
            if (!logoPath) {
                // フォールバック：コードベースのパス
                const logoFolder = clinicCode;
                logoPath = `../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.webp`;
            }
            
            // リダイレクトURL（ハッシュフラグメント使用）
            const redirectUrl = `./redirect.html#clinic_id=${clinicId}&rank=${rankNum}&region_id=${regionId}`;
            
            // クリニック名リンクにもlocalStorageとリダイレクトを適用
            const clinicNameOnclick = `onclick="localStorage.setItem('redirectParams', JSON.stringify({clinic_id: '${clinicId}', rank: '${rankNum}', region_id: '${regionId}'})); setTimeout(() => { window.open('${redirectUrl}', '_blank'); }, 10); return false;"`;
            
            tr.innerHTML = `
                <td class="ranking-table_td1">
                    <img src="${logoPath}" alt="${clinic.name}" width="80">
                    <a href="#" ${clinicNameOnclick} class="clinic-link" style="cursor: pointer;">${clinic.name}</a>
                </td>
                <td class="" style="">
                    <span class="ranking_evaluation">${getClinicData('総合評価', '4.5')}</span><br>
                    <span class="star5_rating" data-rate="${getClinicData('総合評価', '4.5')}"></span>
                </td>
                <td class="" style="">${this.dataManager.processDecoTags(getClinicData(field2, ''))}</td>
                <td class="" style="">${this.dataManager.processDecoTags(getClinicData(field3, ''))}</td>
                <td>
                    <a class="link_btn" href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank || rankNum)}" target="_blank">公式サイト &gt;</a><br>
                    <a class="detail_btn" href="#clinic${rankNum}">詳細をみる</a>
                </td>
                <td class="th-none" style="display: none;">${this.dataManager.processDecoTags(getClinicData('', ''))}</td>
                <td class="th-none" style="display: none;">${this.dataManager.processDecoTags(getClinicData('', ''))}</td>
                <td class="th-none" style="display: none;">${this.dataManager.processDecoTags(getClinicData('', ''))}</td>
                <td class="th-none" style="display: none;">${this.dataManager.processDecoTags(getClinicData('', ''))}</td>
                <td class="th-none" style="display: none;">${this.dataManager.processDecoTags(getClinicData('', ''))}</td>
                <td class="th-none" style="display: none;">${this.dataManager.processDecoTags(getClinicData('', ''))}</td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // 比較表の注意事項はinitializeDisclaimersで処理されるため、ここでは呼び出さない
        // initializeDisclaimersが後で自動的に呼ばれる
    }
    
    // 比較表の注意事項を更新
    updateComparisonDisclaimers(disclaimers) {
        const disclaimerContent = document.getElementById('main-content');
        if (!disclaimerContent) {
            console.error('main-content element not found');
            return;
        }
        
        console.log('updateComparisonDisclaimers called with:', disclaimers);
        
        // 注意事項コンテンツをクリア
        disclaimerContent.innerHTML = '';
        
        if (!disclaimers || disclaimers.length === 0) {
            disclaimerContent.innerHTML = '<p style="font-size: 11px; color: #666; padding: 10px;">注意事項はありません。</p>';
            return;
        }
        
        // 各クリニックの注意事項を追加
        disclaimers.forEach((item, index) => {
            const disclaimerDiv = document.createElement('div');
            disclaimerDiv.style.cssText = 'margin-bottom: 15px; padding: 10px; border-left: 3px solid #6bd1d0;';
            
            const titleDiv = document.createElement('div');
            titleDiv.style.cssText = 'font-weight: 600; color: #333; margin-bottom: 5px; font-size: 12px;';
            titleDiv.textContent = `【${item.clinicName}】`;
            
            const textDiv = document.createElement('div');
            textDiv.style.cssText = 'font-size: 10px; line-height: 1.6; color: #666;';
            textDiv.innerHTML = item.text;
            
            disclaimerDiv.appendChild(titleDiv);
            disclaimerDiv.appendChild(textDiv);
            disclaimerContent.appendChild(disclaimerDiv);
        });
        
        console.log('Disclaimers added to DOM, child count:', disclaimerContent.children.length);
    }

    // 1位クリニックおすすめセクションの更新
    updateFirstChoiceRecommendation(topClinic) {
        if (!topClinic) return;
        
        const clinicCode = window.dataManager.getClinicCodeById(topClinic.id);
        if (!clinicCode) return;
        
        // 画像パスの設定
        const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
        
        // クリニック名を更新
        const clinicNameElements = ['first-choice-clinic-name', 'first-choice-title-clinic-name'];
        clinicNameElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = topClinic.name;
        });
        
        // バナー画像を更新
        const bannerImage = document.getElementById('first-choice-banner-image');
        if (bannerImage) {
            const csvBannerPath = window.dataManager.getClinicText(clinicCode, '詳細バナー画像パス', '');
            const bannerPath = csvBannerPath ||
                             `../common_data/images//clinics/${clinicCode}/${clinicCode}_detail_bnr.webp`;

            // console.log(`[DEBUG] Clinic: ${clinicCode}, CSV Banner Path: "${csvBannerPath}", Final Path: "${bannerPath}"`);

            // 追加のデバッグ：すべてのバナー画像要素をチェック
            const allBannerImages = document.querySelectorAll('img[src*="_detail_bnr"]');
            allBannerImages.forEach((img, index) => {
                // console.log(`[DEBUG] Banner image ${index}: ${img.src}, class: ${img.className}`);
            });

            bannerImage.src = bannerPath;
            bannerImage.alt = topClinic.name;
        }
        
        // 3つのポイントを更新
        const point1Title = document.getElementById('point1-title');
        const point1Desc = document.getElementById('point1-description');
        const point2Title = document.getElementById('point2-title');
        const point2Desc = document.getElementById('point2-description');
        const point3Title = document.getElementById('point3-title');
        const point3Desc = document.getElementById('point3-description');
        
        if (point1Title) point1Title.textContent = window.dataManager.getClinicText(clinicCode, 'POINT1タイトル', '');
        if (point1Desc) point1Desc.innerHTML = window.dataManager.getClinicText(clinicCode, 'POINT1内容', '');

        if (point2Title) point2Title.textContent = window.dataManager.getClinicText(clinicCode, 'POINT2タイトル', '');
        if (point2Desc) point2Desc.innerHTML = window.dataManager.getClinicText(clinicCode, 'POINT2内容', '');

        if (point3Title) point3Title.textContent = window.dataManager.getClinicText(clinicCode, 'POINT3タイトル', '');
        if (point3Desc) point3Desc.innerHTML = window.dataManager.getClinicText(clinicCode, 'POINT3内容', '');
        
        // おすすめ3ポイントのアイコンを設定（3種類）
        try {
            const iconElems = document.querySelectorAll('#first-choice-points .ribbon_point_title2_s i.point-icon-inline');
            const iconClasses = ['fa-lightbulb', 'fa-mobile-alt', 'fa-yen-sign'];
            iconElems.forEach((el, idx) => {
                // 既存の代表的なアイコンクラスをリセット
                el.classList.remove('fa-clock', 'fa-lightbulb', 'fa-mobile-alt', 'fa-yen-sign', 'fa-user-md', 'fa-coins');
                el.classList.add(iconClasses[idx] || 'fa-clock');
            });
        } catch (_) {}

        // ロゴ画像を更新
        const infoLogo = document.getElementById('first-choice-info-logo');
        if (infoLogo) {
            const logoFolder = clinicCode;
            const logoPath = window.dataManager.getClinicText(clinicCode, 'meta13', '') || window.dataManager.getClinicText(clinicCode, 'クリニックロゴ画像パス', '') || 
                            `../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.webp`;
            infoLogo.src = logoPath;
            infoLogo.alt = topClinic.name;
        }
        
        // キャンペーンテキストを更新
        const campaignText = document.getElementById('first-choice-campaign-text');
        if (campaignText) {
            const campaign = window.dataManager.getClinicText(clinicCode, 'INFORMATIONキャンペーンテキスト', '');
            campaignText.innerHTML = campaign;
        }
        
        // 実績テキストを更新
        const achievementText = document.getElementById('first-choice-achievement-text');
        if (achievementText) {
            const achievement = window.dataManager.getClinicText(clinicCode, 'INFORMATIONサブテキスト', '');
            achievementText.textContent = achievement;
        }
        
        // CTAテキストを更新
        const ctaText = document.getElementById('first-choice-cta-text');
        if (ctaText) {
            ctaText.textContent = `${topClinic.name}の公式サイト`;
        }
        
        // CTAリンクを更新
        const ctaLink = document.getElementById('first-choice-cta-link');
        if (ctaLink) {
            ctaLink.href = this.urlHandler.getClinicUrlWithRegionId(topClinic.id, topClinic.rank || 1);
        }

        // 公式サイトリンクを更新
        const officialLink = document.querySelector('#first-choice-official-link a');
        if (officialLink) {
            // リダイレクトURLを使用（案件詳細セクションと同様）
            officialLink.href = this.urlHandler.getClinicUrlWithRegionId(topClinic.id, topClinic.rank || 1);

            // strongタグには公式サイトURLのテキストを設定
            const strongElement = officialLink.querySelector('strong');
            const officialUrl = window.dataManager.getClinicText(clinicCode, '公式サイトURL', '#');
            if (strongElement) {
                strongElement.textContent = officialUrl;
            } else {
                officialLink.textContent = officialUrl;
            }
        }
        
        // 免責事項のタイトルを更新
        const disclaimerTitle = document.getElementById('first-choice-disclaimer-title');
        if (disclaimerTitle) {
            disclaimerTitle.textContent = `${topClinic.name}の確認事項`;
        }

        // 免責事項の内容を更新
        const disclaimerContent = document.getElementById('dio-campaign-first-choice-content');
        if (disclaimerContent) {
            const disclaimerText = window.dataManager.getClinicText(clinicCode, 'INFORMATION確認事項', '');
            if (disclaimerText) {
                disclaimerContent.innerHTML = `<div style="font-size: 9px; color: #777; line-height: 1.4;">${disclaimerText}</div>`;
            }
        }
    }

    // クリニック名の表示形式を取得
    getClinicDisplayName(clinic) {
        // CSVデータのクリニック名をそのまま使用
        return clinic.name;
    }

    // 総合タブの生成
    generateGeneralTab(clinics) {
        const tbody = document.getElementById('general-tbody');
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const row = document.createElement('tr');
            const rankClass = clinic.rank === 1 ? '' : clinic.rank === 2 ? 'silver' : 'bronze';
            
            // ダミーデータ（実際のデータに置き換え）
            const ratings = { 1: 4.9, 2: 4.5, 3: 4.3, 4: 4.1, 5: 3.8 };
            

            row.innerHTML = `
                <td>
                    <div class="clinic-name-cell">
                        <div class="rank-badge ${rankClass}">${clinic.rank}位</div>
                        <div class="clinic-info">
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="rating-cell">${getRatingFromJson(clinic.rank)}</div>
                    <div class="rating-stars">
                        ${'<i class="fas fa-star"></i>'.repeat(Math.floor(getRatingFromJson(clinic.rank)))}
                        ${getRatingFromJson(clinic.rank) % 1 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                    </div>
                </td>
                <td class="achievement-text">${getAchievementFromJson(clinic.rank)}</td>
                <td class="benefit-text">${getBenefitFromJson(clinic.rank)}</td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
                        <a href="#clinic${clinic.rank}" class="cta-link detail-scroll-link" data-rank="${clinic.rank}">詳細を見る</a>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    // 施術内容タブの生成
    generateTreatmentTab(clinics) {
        const tbody = document.getElementById('treatment-tbody');
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const row = document.createElement('tr');
            const rankClass = clinic.rank === 1 ? '' : clinic.rank === 2 ? 'silver' : 'bronze';

            row.innerHTML = `
                <td>
                    <div class="clinic-name-cell">
                        <div class="rank-badge ${rankClass}">${clinic.rank}位</div>
                        <div class="clinic-info">
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
                        </div>
                    </div>
                </td>
                <td></td>
                <td></td>
                <td><i class="fas fa-circle feature-icon"></i></td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
                        <a href="#clinic${clinic.rank}" class="cta-link detail-scroll-link" data-rank="${clinic.rank}">詳細を見る</a>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    // サービスタブの生成
    generateServiceTab(clinics) {
        const tbody = document.getElementById('service-tbody');
        tbody.innerHTML = '';

        clinics.forEach((clinic, index) => {
            const row = document.createElement('tr');
            const rankClass = clinic.rank === 1 ? '' : clinic.rank === 2 ? 'silver' : 'bronze';

            row.innerHTML = `
                <td>
                    <div class="clinic-name-cell">
                        <div class="rank-badge ${rankClass}">${clinic.rank}位</div>
                        <div class="clinic-info">
                            <div class="clinic-main-name">${this.getClinicDisplayName(clinic)}</div>
                        </div>
                    </div>
                </td>
                <td><i class="fas fa-circle feature-icon"></i></td>
                <td>${clinic.rank <= 3 ? '<i class="fas fa-circle feature-icon"></i>' : '<i class="fas fa-triangle feature-icon triangle"></i>'}</td>
                <td>${clinic.rank <= 2 ? '<i class="fas fa-circle feature-icon"></i>' : '-'}</td>
                <td>
                    <div class="cta-cell">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" class="cta-button" target="_blank" rel="noopener">公式サイト</a>
                        <a href="#clinic${clinic.rank}" class="cta-link detail-scroll-link" data-rank="${clinic.rank}">詳細を見る</a>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    // タブ切り替え機能の設定
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // すべてのタブボタンとコンテンツを非アクティブに
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // クリックされたタブをアクティブに
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }
    // 詳細を見るリンクのイベントリスナーを設定
    setupDetailScrollLinks() {
        
        // 少し遅延を入れてDOMが完全に生成されるのを待つ
        setTimeout(() => {
            
            // すべてのaタグを確認
            const allLinks = document.querySelectorAll('a');
            
            // 詳細を見る・詳細をみるというテキストを含むリンクを探す
            const detailTextLinks = Array.from(allLinks).filter(link => 
                link.textContent.includes('詳細を見る') || link.textContent.includes('詳細をみる')
            );
            detailTextLinks.forEach((link, i) => {
                // Links processing
            });
            
            // 動的に生成される比較表のリンク
            const dynamicLinks = document.querySelectorAll('.detail-scroll-link');
            
            // 各リンクの詳細情報を表示
            dynamicLinks.forEach((link, index) => {
                // Dynamic links processing
                
                // 既存のイベントリスナーを確認
                const hasExistingListener = link.hasAttribute('data-listener-attached');
                
                if (!hasExistingListener) {
                    link.setAttribute('data-listener-attached', 'true');
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        let rank = parseInt(link.getAttribute('data-rank'));
                        if (!rank || Number.isNaN(rank)) {
                            const href = link.getAttribute('href') || '';
                            const m = href.match(/#clinic(\d+)/);
                            if (m) rank = parseInt(m[1], 10);
                        }
                        if (rank && !Number.isNaN(rank)) {
                            openClinicDetailModal(rank);
                        }
                    });
                }
            });

            // 比較表のロゴ画像クリックでもモーダルを開く
            const logoImgs = document.querySelectorAll('#comparison-table td.ranking-table_td1 img.comparison-logo');
            logoImgs.forEach(img => {
                if (!img.hasAttribute('data-listener-attached')) {
                    img.setAttribute('data-listener-attached', 'true');
                    img.style.cursor = 'pointer';
                    img.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rankAttr = img.getAttribute('data-rank');
                        const rank = parseInt(rankAttr, 10);
                        if (rank && !Number.isNaN(rank)) {
                            openClinicDetailModal(rank);
                        }
                    });
                }
            });
            
            // 静的な比較表のリンク
            const staticLinks = document.querySelectorAll('.detail-static-link');
            
            staticLinks.forEach((link, index) => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    let rank = parseInt(link.getAttribute('data-rank'));
                    if (!rank || Number.isNaN(rank)) {
                        const href = link.getAttribute('href') || '';
                        const m = href.match(/#clinic(\d+)/);
                        if (m) rank = parseInt(m[1], 10);
                    }
                    if (rank && !Number.isNaN(rank)) {
                        openClinicDetailModal(rank);
                    }
                });
            });
            
            // 比較表内のすべてのボタンやリンクを確認
            const comparisonTable = document.getElementById('comparison-table');
            if (comparisonTable) {
                const allTableLinks = comparisonTable.querySelectorAll('a');
                allTableLinks.forEach((link, i) => {
                    if (link.textContent.includes('詳細')) {
                        // Detail link found
                    }
                });
            }
        }, 500); // setTimeoutの閉じ括弧を追加
    }
    
    // クリニック詳細へ（互換）
    scrollToClinicDetail(rank) {
        // 既存呼び出しの互換用: モーダル表示に置き換え
        if (rank && !Number.isNaN(rank)) openClinicDetailModal(rank);
    }
    
    // レビュータブ切り替え機能の設定
    setupReviewTabs() {
        // 各クリニック詳細セクションのレビュータブを設定
        document.addEventListener('click', (e) => {
            // 新しいタブ構造用のイベント処理
            const tabLi = e.target.closest('.review_tab2 li');
            if (tabLi) {
                const reviewSection = tabLi.closest('#review_tab_box');
                if (reviewSection) {
                    const tabIndex = Array.from(tabLi.parentElement.children).indexOf(tabLi);
                    
                    // タブのアクティブ状態を更新
                    reviewSection.querySelectorAll('.review_tab2 li').forEach((li, index) => {
                        li.classList.remove('select2');
                        if (index === tabIndex) {
                            li.classList.add('select2');
                        }
                    });
                    
                    // コンテンツの表示を切り替え
                    reviewSection.querySelectorAll('.wrap_long2').forEach((content, index) => {
                        content.classList.remove('active');
                        content.classList.add('disnon2');
                        if (index === tabIndex) {
                            content.classList.add('active');
                            content.classList.remove('disnon2');
                        }
                    });
                }
            }
        });
    }

    // クリニック詳細の更新
    updateClinicDetails(clinics, ranking, regionId) {
        const detailsList = document.getElementById('clinic-details-list');
        if (!detailsList) {
            return;
        }

        detailsList.innerHTML = '';
        
        // 比較表も更新
        this.updateComparisonTable(clinics, ranking);

        if (!ranking) {
            return;
        }
        
        if (!ranking.ranks) {
            return;
        }
        
        if (Object.keys(ranking.ranks).length === 0) {
            return;
        }
        

        // ランキング順のクリニックデータを取得（5位まで）
        const sortedRanks = Object.entries(ranking.ranks).sort((a, b) => {
            const numA = parseInt(a[0].replace('no', ''));
            const numB = parseInt(b[0].replace('no', ''));
            return numA - numB;
        }).slice(0, 5);

        
        sortedRanks.forEach(([position, clinicId]) => {
            // clinicIdを数値に変換して比較
            const numericClinicId = parseInt(clinicId);
            const clinic = clinics.find(c => c.id == clinicId || c.id === numericClinicId);
            if (!clinic) {
                return;
            }

            const rank = parseInt(position.replace('no', ''));
            const detailItem = document.createElement('div');
            detailItem.className = `detail-item ranking_box_inner ranking_box_${rank}`;
            detailItem.setAttribute('data-rank', rank);
            detailItem.setAttribute('data-clinic-id', clinicId);
            detailItem.id = `clinic${rank}`; // アンカーリンク用のIDを追加（静的比較表と一致）

            // ランクに応じたバッジクラス
            let badgeClass = '';
            if (rank === 2) badgeClass = 'silver';
            else if (rank === 3) badgeClass = 'bronze';
            else if (rank === 4) badgeClass = 'ranking4';
            else if (rank === 5) badgeClass = 'ranking5';

            const clinicCode = this.dataManager.getClinicCodeById(clinicId);

            // クリニック詳細データを動的に取得
            // DataManagerから動的にクリニック詳細データを取得
            const data = this.dataManager.getClinicDetailData(clinicId);
            if (!data) {
                return; // forEachの中ではcontinueではなくreturnを使用
            }
            data.regionId = regionId;
            
            // バナーがない場合はデフォルトパスを設定
            if (!data.banner) {
                const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                const bannerFolder = clinicCode === 'kireiline' ? 'kireiline' : clinicCode;
                data.banner = `../common_data/images/clinics/${bannerFolder}/${bannerFolder}_detail_bnr.webp`;
            }
            
            // 店舗データを動的に取得（store_view.csvに基づいてフィルタリング）
            const allStores = this.dataManager.getStoresByRegionId(regionId); // regionIdは既に正規化済み
            
            // クリニック名はそのまま使用
            const storeClinicName = clinic.name;
            
            // 現在のクリニックに属する店舗のみをフィルタリング
            data.stores = allStores.filter(store => {
                return store.clinicName === storeClinicName;
            });

            const rankIconPath = `../common_data/images/rank_icon/rank${rank}.webp`;
            const regionNameForStores = this.dataManager.getRegionName(regionId) || '';
            const isNationalForStores = this.isNationalRegion(regionId, { id: regionId, name: regionNameForStores });
            const storeSectionHeading = (isNationalForStores || !regionNameForStores)
                ? `${clinic.name}の店舗`
                : `${clinic.name}の【${regionNameForStores}】の店舗`;
            const informationSubTextRaw = clinicCode ? this.dataManager.getClinicText(clinicCode, 'INFORMATIONサブテキスト', '') : '';
            const informationSubTextProcessed = informationSubTextRaw ? this.dataManager.processDecoTags(informationSubTextRaw) : '';
            const ctaHeaderHtml = informationSubTextProcessed
                ? `<div style="font-size: 12px;">${informationSubTextProcessed}</div>`
                : '';
            const ctaMicrocopyHtml = '<span class="cta-subtext" style="display:block;font-size: 11px;color: #ff95ad;font-weight: 400;"><span>いつでも変更/キャンセルは可能です</span></span>';
            const directCtaHtml = rank === 1
                ? `<p class="btn btn_outline_pink">
                        <a class="ctaBtn-direct" href="https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=56casdd8820sb67f" target="_blank" rel="noopener">
                            <span class="bt_s">無料相談の空き状況をチェック</span>${ctaMicrocopyHtml}
                        </a>
                    </p>`
                : `<p class="btn btn_outline_pink">
                        <a class="ctaBtn-direct" href="${this.urlHandler.getDirectFormUrl(clinic.id, clinic.rank)}" target="_blank" rel="noopener noreferrer">
                            <span class="bt_s">無料相談の空き状況をチェック</span>${ctaMicrocopyHtml}
                        </a>
                    </p>`;
            detailItem.innerHTML = `
                <div class="ranking_box_in">
                    <div class="detail-rank">
                        <div class="detail-rank-header">
                            <div class="detail-rank-badge has-icon ${badgeClass}"><img class="rank-badge-icon" src="${rankIconPath}" alt="${rank}位"></div>
                            <div class="detail-title">
                                <h3>${this.dataManager.processDecoTags(data.title)}</h3>
                                <p>${this.dataManager.processDecoTags(data.subtitle)}</p>
                            </div>
                        </div>
                        <div class="ranking__name">
                            <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" target="_blank" rel="noopener nofollow">${clinic.name === 'Oh my teeth' ? 'Oh my teeth（オーマイティース）' : clinic.name} ＞</a>
                        </div>
                    </div>
                ${(() => {
                    // DataManagerからバナー画像パス候補を生成（CSV指定 + bnr2以降）
                    const bannerFolder = clinicCode === 'kireiline' ? 'kireiline' : clinicCode;
                    // ベース（*_detail_bnr.webp）は使用しない。CSV指定と *_detail_bnr2.webp 以降を使用
                    const candidates = [];
                    const csvBannerRaw = this.dataManager.getClinicText(clinicCode, '詳細バナー画像パス', '');
                    if (csvBannerRaw) {
                        candidates.push(csvBannerRaw);
                    }
                    for (let i = 2; i <= 10; i++) {
                        candidates.push(`../common_data/images/clinics/${bannerFolder}/${bannerFolder}_detail_bnr${i}.webp`);
                    }
                    const bannerImages = Array.from(new Set(candidates));
                    if (!bannerImages.length) return '';

                    return `
                    <div class="detail-banner banner-slider" data-clinic-id="${clinicId}">
                        <div class="slider-container">
                            <div class="slider-counter">1/${bannerImages.length}</div>
                            <button class="slider-nav slider-prev" data-clinic-id="${clinicId}">
                                <span>‹</span>
                            </button>
                            <div class="slider-wrapper">
                                <div class="slider-track" data-clinic-id="${clinicId}">
                                    ${bannerImages.map((img, index) => `
                                        <div class=\"slider-slide ${index === 0 ? 'active' : ''}\" data-index=\"${index}\">
                                            <img src=\"${img}\" alt=\"${clinic.name}キャンペーン${index + 1}\">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <button class="slider-nav slider-next" data-clinic-id="${clinicId}">
                                <span>›</span>
                            </button>
                            <button class="slider-expand" data-clinic-id="${clinicId}">
                                <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
                                <span>画像を拡大</span>
                            </button>
                        </div>
                        <div class="slider-dots">
                            ${bannerImages.map((_, index) => `
                                <button class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}" data-clinic-id="${clinicId}"></button>
                            `).join('')}
                        </div>
                    </div>
                    `;
                })()}
                <div class="detail-features">
                    ${data.features.map(feature => `<span class="feature-tag">${this.dataManager.processDecoTags(feature.startsWith('#') ? feature : '# ' + feature)}</span>`).join('')}
                </div>
                
                <!-- 拡張版価格表 -->
                <table class="info-table">
                    ${Object.entries(data.priceDetail).map(([key, value]) => `
                        <tr>
                            <td>${key}</td>
                            <td>${this.dataManager.processDecoTags(value)}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <!-- CTAボタン -->
                <div class="clinic-cta-button-wrapper">
                    ${ctaHeaderHtml}
                    <p class="btn btn_second_primary">
                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" target="_blank" rel="noopener noreferrer">
                            <span class="bt_s">公式サイトで詳細を見る</span>
                            <span class="btn-arrow">▶</span>
                        </a>
                    </p>
                    ${directCtaHtml}
                </div>

                ${(() => {
                    const clinicCodeRaw = this.dataManager.getClinicCodeById(clinicId);
                    const sanitizedClinicCode = clinicCodeRaw ? clinicCodeRaw.toString().trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
                    if (!sanitizedClinicCode) {
                        return '';
                    }
                    const baseVideoPath = (window.SITE_CONFIG && window.SITE_CONFIG.imagesPath) ? window.SITE_CONFIG.imagesPath : './images';
                    const videoSrc = `${baseVideoPath}/${sanitizedClinicCode}_treatment.mp4`;
                    const videoHtml = `<div class=\"procedure-video-embed\" data-clinic-code=\"${sanitizedClinicCode}\" data-video-src=\"${videoSrc}\">\n                            <video class=\"procedure-video\" controls playsinline preload=\"auto\" tabindex=\"0\" aria-label=\"${clinic.name}の施術風景\">\n                                <source src=\"${videoSrc}\" type=\"video/mp4\">\n                                お使いのブラウザでは動画を再生できません。\n                            </video>\n                            <button type=\"button\" class=\"procedure-video-toggle\" aria-label=\"再生\">\n                                <span class=\"procedure-video-toggle-icon\"></span>\n                            </button>\n                        </div>`;

                    return `
                <div class="clinic-procedure-section" data-procedure-section style="display:none;">
                    <h4 class="section-title">施術風景</h4>
                    <div class="procedure-video-wrapper">
                        ${videoHtml}
                    </div>
                </div>
                    `;
                })()}

                <!-- クリニックのポイント -->
                <div class="clinic-points-section">
                    <h4 class="section-title">POINT</h4>
                    <div class="ribbon_point_box_no">
                        ${data.points.map((point, index) => {
                            let iconClass = 'fa-clock';
                            if (point.icon === 'lightbulb') iconClass = 'fa-lightbulb';
                            else if (point.icon === 'phone') iconClass = 'fa-mobile-alt';
                            else if (point.icon === 'coins') iconClass = 'fa-yen-sign';
                            
                            return `
                            <div class="ribbon_point_title2_s">
                                <i class="fas ${iconClass} point-icon-inline"></i>
                                <strong>${this.dataManager.processDecoTags(point.title)}</strong>
                            </div>
                            <div class="ribbon_point_txt">
                                <p style="font-size:14px;">${this.dataManager.processDecoTags(point.description)}</p>
                            </div>
                            `;
                        }).join('')}
                        <div class="ribbon_point_link">
                            【公式】<a href="${this.urlHandler.getClinicUrlWithRegionId(clinic.id, clinic.rank)}" target="_blank" rel="noopener"><strong>${data.priceDetail['公式サイト'] || '#'}</strong></a>
                        </div>
                    </div>
                </div>
                
                ${(() => {
                    // 症例写真（参考サイト同様、1位のみ表示）
                    if (rank !== 1) return '';
                    const clinicCode = this.dataManager.getClinicCodeById(clinicId) || '';
                    if (!clinicCode) return '';
                    const dm = this.dataManager;

                    // 1位のクリニックコードを元に動的に症例画像のリストを生成
                    const imagesForClinic = [
                        { fallbacks: [`images/${clinicCode}_case01.jpg`], alt: 'CASE 01' },
                        { fallbacks: [`images/${clinicCode}_case02.jpg`], alt: 'CASE 02' },
                        { fallbacks: [`images/${clinicCode}_case03.jpg`], alt: 'CASE 03' }
                    ];

                    if (!imagesForClinic.length) return '';
                    const buildRow = (label, val) => `<tr><td style=\"padding: 0 8px !important; background-color: #f8f8f8 !important; font-weight: bold !important; width: 30% !important;\">${label}</td><td style=\"padding: 0 8px !important;\">${val}</td></tr>`;
                    const slidesHtml = imagesForClinic.map((img, idx) => {
                        const keyBase = `case${idx + 1}`;
                        // 各スライドは対応するcaseNを参照（case1へのフォールバックは行わない）
                        const nameVal = dm.getClinicText(clinicCode, `${keyBase}コース名`, '') || '—';
                        const descVal = dm.getClinicText(clinicCode, `${keyBase}施術の説明`, '') || '—';
                        const riskVal = dm.getClinicText(clinicCode, `${keyBase}副作用（リスク）`, '') || '—';
                        return `
                            <div class=\"case-slide\" style=\"min-width:100%;box-sizing:border-box;\">
                                <img src=\"${img.fallbacks[0]}\" alt=\"${img.alt}\" loading=\"lazy\" style=\"width:100%;height:auto;object-fit:contain;\">
                                <div class=\"case-info\" style=\"margin-top: 5px; padding: 0 5%; text-align: left; font-size: 12px; line-height: 1.6; width: 100%;\">
                                    <table class=\"case-table\" style=\"width: 100% !important; border-collapse: collapse !important; font-size: 8px !important; line-height: 1.6 !important; display: table !important; table-layout: fixed !important;\">
                                        <tbody>
                                            ${buildRow('コース名', dm.processDecoTags(nameVal))}
                                            ${buildRow('施術の説明', dm.processDecoTags(descVal))}
                                            ${buildRow('副作用<br>（リスク）', dm.processDecoTags(riskVal))}
                                            ${buildRow('', '3ヶ月医療痩身ボディメイクを契約された<br>モニター対象の会員の代表的な事例を提示しています。効果には個人差があります。')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;
                    }).join('');

                    const dotsHtml = imagesForClinic.map((_, i) => `<button type=\"button\" class=\"case-dot ${i===0?'active':''}\" data-index=\"${i}\" style=\"width:8px;height:8px;border-radius:50%;border:none;background:${i===0?'#2CC7C5':'#ccc'};margin:0 4px;cursor:pointer;\"></button>`).join('');
                    
                    return `
                    <div class=\"clinic-points-section\">
                        <h4 class=\"section-title\">症例写真</h4>
                        <div class=\"case-slider\" style=\"position: relative; overflow: hidden;\">
                            <div class=\"case-track\" style=\"display:flex;\">
                                ${slidesHtml}
                            </div>
                            <button class=\"case-nav case-nav-prev\" style=\"position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.8);border:none;border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer;z-index:10;\">‹</button>
                            <button class=\"case-nav case-nav-next\" style=\"position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.8);border:none;border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer;z-index:10;\">›</button>
                        </div>
                        <div class=\"case-dots\" style=\"text-align:center;margin-top:10px;\">
                            ${dotsHtml}
                        </div>
                    </div>
                    `;
                })()}
                
                
                <!-- 口コミ -->
                <div class="reviews-section">
                    <h4 class="section-title-review">REVIEW</h4>
                    
                    <section id="review_tab_box">
                        <nav role="navigation" class="review_tab2">
                            <ul>
                                ${(() => {
                                    const clinicCodeForLabels = this.dataManager.getClinicCodeById(clinicId);
                                    const labels = this.dataManager.getReviewTabLabels(clinicCodeForLabels) || [];
                                    const icons = ['fa-yen-sign', 'fa-user-md', 'fa-heart'];
                                    if (labels.length === 0) return '';
                                    return labels.map((label, idx) => {
                                        const icon = icons[idx] || 'fa-comment-dots';
                                        const active = idx === 0 ? 'select2' : '';
                                        return `<li class="${active}" data-tab="tab-${idx}"><i class="fas ${icon}"></i> ${label}</li>`;
                                    }).join('');
                                })()}
                            </ul>
                        </nav>
                        ${(() => {
                            // 口コミデータを動的に取得（タブラベルと中身をCSVの括弧内で対応させる）
                            const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                            const labelList = this.dataManager.getReviewTabLabels(clinicCode) || [];
                            const reviewIcons = [
                                '../common_data/images/review_icon/review_icon1.webp',
                                '../common_data/images/review_icon/review_icon2.webp',
                                '../common_data/images/review_icon/review_icon3.webp',
                                '../common_data/images/review_icon/review_icon4.webp',
                                '../common_data/images/review_icon/review_icon5.webp',
                                '../common_data/images/review_icon/review_icon6.webp',
                                '../common_data/images/review_icon/review_icon7.webp',
                                '../common_data/images/review_icon/review_icon8.webp',
                                '../common_data/images/review_icon/review_icon9.webp'
                            ];
                            
                            // ランク別のレビューアイコン表示順（0始まりのインデックス）
                            // 1位: 1→9の順で連動
                            // 2位: 3, 8, 1, 6, 7, 2, 9, 4, 5
                            // 3位: 1, 6, 9, 2, 3, 4, 5, 8, 7
                            // 4位: 7, 4, 5, 8, 9, 2, 1, 6, 3
                            // 5位: 5, 2, 7, 6, 1, 4, 3, 8, 9
                            const iconOrdersByRank = {
                                1: [0,1,2,3,4,5,6,7,8],
                                2: [2,7,0,5,6,1,8,3,4],
                                3: [0,5,8,1,2,3,4,7,6],
                                4: [6,3,4,7,8,1,0,5,2],
                                5: [4,1,6,5,0,3,2,7,8]
                            };
                            // 未定義のランクは従来のローテーションから導出（ランク起点でずらす）
                            const defaultOrder = Array.from({ length: reviewIcons.length }, (_, i) => (i + ((rank||1) - 1)) % reviewIcons.length);
                            const iconOrder = iconOrdersByRank[rank] || defaultOrder;
                            
                            let html = '';
                            const dm = this.dataManager;
                            
                            // 3カテゴリを順番に描画（カテゴリと中身を対応）
                            labelList.forEach((label, catIdx) => {
                                const activeClass = catIdx === 0 ? 'active' : 'disnon2';
                                html += `<div class="wrap_long2 ${activeClass}">`;
                                const reviews = dm.getClinicReviewsByLabel(clinicCode, label);
                                reviews.forEach((review, index) => {
                                    // 全体の表示順序に対する位置（カテゴリ×3件 + 各カテゴリ内のindex）
                                    const globalIndex = (catIdx * 3) + index;
                                    const orderIndex = globalIndex % iconOrder.length;
                                    const iconIndex = iconOrder[orderIndex];
                                    html += `
                                        <div class="review_tab_box_in">
                                            <div class="review_tab_box_img">
                                                <img src="${reviewIcons[iconIndex]}" alt="レビューアイコン">
                                                <span>★★★★★</span>
                                            </div>
                                            <div class="review_tab_box_r">
                                                <div class="review_tab_box_title"><strong>${review.title}</strong></div>
                                                <div class="review_tab_box_txt">
                                                    ${review.content}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                });
                                if (reviews.length === 0) {
                                    html += '<div class="review_tab_box_in"><div class="review_tab_box_r"><div class="review_tab_box_txt">準備中</div></div></div>';
                                }
                                html += '<p style="font-size:8px;text-align:right">※効果には個人差があります<br>※個人の感想です</p>';
                                html += '</div>';
                            });
                            
                            return html;
                        })()}
                    </section>
                </div>
                
                <!-- 店舗情報 -->
                <div class="brand-section">
                    <h4 class="section-heading">
                        ${storeSectionHeading}
                    </h4>
                    ${this.dataManager.generateStoresDisplay(clinicId, regionId)}
                </div>
                
                <!-- キャンペーンセクション -->
                <div class="campaign-section">
                    <div class="campaign-container">
                        ${(() => {
                            // キャンペーン情報を動的に生成
                            const clinicCode = this.dataManager.getClinicCodeById(clinicId);
                            
                            const campaignHeader = this.dataManager.getClinicText(clinicCode, 'キャンペーンヘッダー', 'INFORMATION!');
                            const campaignDescription = this.dataManager.getClinicText(clinicCode, 'INFORMATIONキャンペーンテキスト', '');
                            const campaignMicrocopy = this.dataManager.getClinicText(clinicCode, 'INFORMATIONサブテキスト', '');
                            const ctaText = this.dataManager.getClinicText(clinicCode, 'CTAボタンテキスト', `キャンペーンの詳細を見る`);
                            
                            const logoFolder = clinicCode === 'kireiline' ? 'kireiline' : clinicCode;
                            const logoSrc = `../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.webp`;
                            const logoAlt = clinic.name;
                            
                            return `
                            <div class="campaign-header">${campaignHeader}</div>
                            <div class="campaign-content">
                                <div class="camp_header3">
                                    <div class="info_logo">
                                        <img src="${logoSrc}" alt="${logoAlt}" onerror="this.onerror=null; this.src='../common_data/images/clinics/${logoFolder}/${logoFolder}-logo.jpg';">
                                    </div>
                                    <div class="camp_txt">
                                        ${campaignDescription}
                                    </div>
                                </div>
                                
                                <div class="cv_box_img">
                                    ${campaignMicrocopy}
                                    <p class="btn btn_second_primary" style="margin-top: 10px;">
                                        <a href="${this.urlHandler.getClinicUrlWithRegionId(clinicId, clinic.rank || 1)}" target="_blank" rel="noopener">
                                            <span class="bt_s">${ctaText}</span>
                                            <span class="btn-arrow">▶</span>
                                        </a>
                                    </p>
                                    ${(rank === 1
                                        ? `<p class="btn btn_outline_pink">
                                            <a class="ctaBtn-direct" href="https://sss.ac01.l-ad.net/cl/p1a64143O61e70f7/?bid=56casdd8820sb67f" target="_blank" rel="noopener">
                                                <span class="bt_s">無料相談の空き状況をチェック</span>${ctaMicrocopyHtml}
                                            </a>
                                        </p>`
                                        : `<p class="btn btn_outline_pink">
                                            <a class="ctaBtn-direct" href="${this.urlHandler.getDirectFormUrl(clinicId, clinic.rank || 1)}" target="_blank" rel="noopener">
                                                <span class="bt_s">無料相談の空き状況をチェック</span>${ctaMicrocopyHtml}
                                            </a>
                                        </p>`)}
                                </div>
                            </div>
                            `;
                        })()}
                    </div>
            ${(() => {
                // 確認事項があるクリニックのみアコーディオンを表示
                const clinicCode = this.dataManager.getClinicCodeById(clinic.id);
                const disclaimerText = clinicCode ? this.dataManager.getClinicText(clinicCode, 'INFORMATION確認事項', '') : '';
                
                if (disclaimerText && disclaimerText.trim() !== '') {
                    return `
                    <!-- ${clinic.name}の確認事項アコーディオン -->
                    <div class="disclaimer-accordion" style="margin-top: 15px;">
                        <button class="disclaimer-header" onclick="toggleDisclaimer('${clinic.code}-campaign')" style="width: 100%; text-align: left; padding: 8px 12px; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 3px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 10px; font-weight: 500; color: #666;">${clinic.name}の確認事項</span>
                            <span id="${clinic.code}-campaign-arrow" style="font-size: 8px; color: #999; transition: transform 0.2s;">▼</span>
                        </button>
                        <div id="${clinic.code}-campaign-content" class="disclaimer-content" style="display: none; padding: 8px 12px; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 3px 3px; margin-top: -1px;">
                            <div style="font-size: 9px; color: #777; line-height: 1.4;">
                                ${disclaimerText.split('<br>').map(text => text.trim()).filter(text => text).map(text => `<p>${text}</p>`).join('\n                                ')}
                            </div>
                        </div>
                    </div>
                    `;
                }
                return '';
            })()}
                </div>
            </div>
            `;
            
            detailsList.appendChild(detailItem);
            this.initializeProcedureVideos(detailItem);

            // 症例スライダーを初期化（1位のみ）
            if (rank === 1) {
                try {
                    const root = detailItem;
                    const track = root.querySelector('.case-track');
                    let slides = Array.from(root.querySelectorAll('.case-slide'));
                    const dotsWrap = root.querySelector('.case-dots');
                    let dots = Array.from(root.querySelectorAll('.case-dot'));
                    const prevBtn = root.querySelector('.case-nav-prev');
                    const nextBtn = root.querySelector('.case-nav-next');
                    const caseSection = root.querySelector('.case-slider')?.closest('.clinic-points-section');
                    const imgs = Array.from(root.querySelectorAll('.case-slider img'));

                    // 画像が1枚も無い、もしくは全て読み込み失敗の場合はセクション非表示
                    if (!imgs || imgs.length === 0) {
                        if (caseSection) caseSection.style.display = 'none';
                        return;
                    }
                    let current = 0;
                    const reindex = () => {
                        slides = Array.from(root.querySelectorAll('.case-slide'));
                        dots = Array.from(root.querySelectorAll('.case-dot'));
                        dots.forEach((d, i) => d.setAttribute('data-index', String(i)));
                    };
                    const updateNavVisibility = () => {
                        const show = slides.length > 1;
                        if (prevBtn) prevBtn.style.display = show ? '' : 'none';
                        if (nextBtn) nextBtn.style.display = show ? '' : 'none';
                        if (dotsWrap) dotsWrap.style.display = show ? 'block' : 'none';
                    };
                    const show = (i) => {
                        if (!slides.length || !track) return;
                        if (i < 0) i = slides.length - 1;
                        if (i >= slides.length) i = 0;
                        current = i;
                        track.style.display = 'flex';
                        track.style.transform = `translateX(-${current * 100}%)`;
                        track.style.transition = 'transform .3s ease';
                        slides.forEach(s => { s.style.minWidth = '100%'; s.style.boxSizing = 'border-box'; });
                        dots.forEach((d, idx) => {
                            d.classList.toggle('active', idx === current);
                            d.style.background = (idx === current ? '#2CC7C5' : '#ccc');
                        });
                    };

                    // 画像エラー時に該当スライドとドットを削除
                    imgs.forEach((img) => {
                        img.addEventListener('error', () => {
                            const slide = img.closest('.case-slide');
                            if (!slide) return;
                            const idx = slides.indexOf(slide);
                            if (idx >= 0) {
                                // 対応するドットも削除
                                const dot = dots[idx];
                                if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
                                if (slide && slide.parentNode) slide.parentNode.removeChild(slide);
                                reindex();
                                if (slides.length === 0) {
                                    if (caseSection) caseSection.style.display = 'none';
                                    return;
                                }
                                if (current >= slides.length) current = slides.length - 1;
                                updateNavVisibility();
                                show(current);
                            }
                        }, { once: true });
                    });

                    if (track && slides.length) {
                        prevBtn && prevBtn.addEventListener('click', () => show(current - 1));
                        nextBtn && nextBtn.addEventListener('click', () => show(current + 1));
                        dots.forEach((d, idx) => d.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); show(idx); }));
                        if (dotsWrap) {
                            dotsWrap.addEventListener('click', (e) => {
                                const el = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
                                if (!el) return;
                                const dot = el.closest && el.closest('.case-dot');
                                if (!dot) return;
                                e.preventDefault();
                                e.stopPropagation();
                                const idxAttr = dot.getAttribute('data-index');
                                const idx = idxAttr ? parseInt(idxAttr, 10) : Array.from(dotsWrap.querySelectorAll('.case-dot')).indexOf(dot);
                                if (idx >= 0) show(idx);
                            }, { capture: true });
                        }
                        updateNavVisibility();
                        show(0);
                    }
                } catch(e) {}
            }
        });
    }
    initializeProcedureVideos(rootElement = document) {
        const scope = rootElement instanceof HTMLElement ? rootElement : document;
        const embeds = scope.querySelectorAll('.procedure-video-embed');
        embeds.forEach((embed) => {
            if (!embed || embed.dataset.videoInitialized === '1') {
                return;
            }
            const video = embed.querySelector('.procedure-video');
            const toggle = embed.querySelector('.procedure-video-toggle');
            if (!video || !toggle) {
                return;
            }
            embed.dataset.videoInitialized = '1';

            const section = embed.closest('[data-procedure-section]') || embed.closest('.clinic-procedure-section');
            const sourceEl = video.querySelector('source');
            const videoSrc = embed.dataset.videoSrc || (sourceEl ? sourceEl.getAttribute('src') : video.currentSrc);
            const cache = window.__treatmentVideoCache = window.__treatmentVideoCache || {};
            const showSection = () => {
                if (section && !section.dataset.shown) {
                    section.style.removeProperty('display');
                    delete section.dataset.procedurePending;
                    section.dataset.shown = '1';
                }
            };
            const removeSection = () => {
                if (section && !section.dataset.removed) {
                    section.dataset.removed = '1';
                    section.remove();
                }
            };
            if (!videoSrc) {
                removeSection();
                return;
            }
            if (cache[videoSrc] === false) {
                removeSection();
                return;
            }
            if (cache[videoSrc] === true) {
                showSection();
            }

            const updateState = () => {
                const playing = !video.paused && !video.ended;
                embed.classList.toggle('is-playing', playing);
                toggle.setAttribute('aria-label', playing ? '一時停止' : '再生');
            };

            const playSafely = () => {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.catch(() => {});
                }
            };

            const togglePlayback = () => {
                if (video.paused || video.ended) {
                    playSafely();
                } else {
                    video.pause();
                }
            };

            const handleToggle = (event) => {
                event.preventDefault();
                event.stopPropagation();
                togglePlayback();
            };

            const markAvailable = () => {
                cache[videoSrc] = true;
                showSection();
            };
            const markMissing = () => {
                cache[videoSrc] = false;
                removeSection();
            };

            toggle.addEventListener('click', handleToggle);
            video.addEventListener('click', handleToggle);
            video.addEventListener('play', () => {
                showSection();
                updateState();
            });
            video.addEventListener('pause', updateState);
            video.addEventListener('ended', updateState);
            video.addEventListener('error', markMissing, { once: true });
            const handleLoaded = () => {
                markAvailable();
                updateState();
            };
            video.addEventListener('loadeddata', handleLoaded, { once: true });
            video.addEventListener('loadedmetadata', handleLoaded, { once: true });
            video.addEventListener('keydown', (event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    togglePlayback();
                }
            });

            if (video.error) {
                markMissing();
                return;
            }
            if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
                markAvailable();
            }
            else {
                try {
                    video.load();
                } catch (_) {}
            }
            updateState();
        });
    }

    // 店舗画像のパスを取得するメソッド（複数拡張子対応）
    getStoreImage(clinicName, storeNumber) {
        // 店舗番号を3桁の文字列に変換
        const paddedNumber = String(storeNumber).padStart(3, '0');
        const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
        
        // 最初の拡張子でパスを返す（onerrorでフォールバックされる）
        const storeImagePath = `${imagesPath}/clinics/${clinicName}/${clinicName}_clinic/clinic_image_${paddedNumber}.webp`;
        
        return storeImagePath;
    }

    // 画像フォールバック処理（複数拡張子対応）
    handleImageError(imgElement, clinicName, storeNumber) {
        const paddedNumber = String(storeNumber).padStart(3, '0');
        const imagesPath = window.SITE_CONFIG ? window.SITE_CONFIG.imagesPath + '/images' : '/images';
        const extensions = ['jpg', 'png'];
        
        // 現在の拡張子を取得
        const currentSrc = imgElement.src;
        let currentExtIndex = -1;
        
        if (currentSrc.includes('.webp')) currentExtIndex = -1; // webpから開始
        else if (currentSrc.includes('.jpg')) currentExtIndex = 0;
        else if (currentSrc.includes('.png')) currentExtIndex = 1;
        
        // 次の拡張子を試す
        const nextExtIndex = currentExtIndex + 1;
        if (nextExtIndex < extensions.length) {
            imgElement.src = `${imagesPath}/clinics/${clinicName}/${clinicName}_clinic/clinic_image_${paddedNumber}.${extensions[nextExtIndex]}`;
        } else {
            // 全て失敗した場合、ロゴ画像にフォールバック
            imgElement.src = `../common_data/images/clinics/${clinicName}/${clinicName}-logo.webp`;
            imgElement.onerror = () => {
                imgElement.src = `../common_data/images/clinics/${clinicName}/${clinicName}-logo.jpg`;
            };
        }
    }

    // 地域IDから地域名を取得するヘルパーメソッド
    getRegionName(regionId) {
        if (!window.dataManager) {
            return '';
        }
        const region = window.dataManager.getRegionById(regionId);
        return region ? region.name : '';
    }

    // Google Maps iframeを生成
    generateMapIframe(address) {
        if (!address) {
            return '<p>住所情報がありません</p>';
        }
        
        // 住所をエンコード
        const encodedAddress = encodeURIComponent(address);
        
        // Google Maps Embed APIのURL
        const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed&z=16`;
        
        return `
            <iframe 
                src="${mapUrl}"
                width="100%" 
                height="300" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade"
                title="Google Maps">
            </iframe>
        `;
    }

    // 地図モーダルのイベントリスナーを設定
    setupMapAccordions() {
        
        // モーダル要素を取得
        const mapModal = document.getElementById('map-modal');
        const mapModalClose = document.getElementById('map-modal-close');
        const mapModalOverlay = document.querySelector('.map-modal-overlay');
        
        // 既存のイベントリスナーを削除（この処理は不要なのでコメントアウト）
        // const mapButtons = document.querySelectorAll('.map-toggle-btn');
        // 
        // mapButtons.forEach(btn => {
        //     const newBtn = btn.cloneNode(true);
        //     btn.parentNode.replaceChild(newBtn, btn);
        // });

        // イベント委譲を使用して、動的に追加されたボタンにも対応
        const self = this; // thisを保存
        
        // 既存のイベントリスナーがあれば削除
        if (this.mapButtonClickHandler) {
            document.removeEventListener('click', this.mapButtonClickHandler, true);
        }
        
        // 新しいイベントリスナーを作成（モーダル表示）
        this.mapButtonClickHandler = (e) => {
            if (e.target.closest('.map-toggle-btn')) {
                e.preventDefault();
                const button = e.target.closest('.map-toggle-btn');
                
                // 店舗情報を取得（実際のHTML構造に合わせて修正）
                const shopContainer = button.closest('.shop');
                
                // コンテキストからクリニック名を優先的に取得（data-clinic-idベース）
                let clinicName = 'クリニック';
                try {
                    const shopsContainer = shopContainer?.closest('.shops');
                    const clinicDetailElement = shopsContainer?.closest('.detail-item');
                    const contextualClinicId = clinicDetailElement?.getAttribute('data-clinic-id');
                    if (contextualClinicId && self.dataManager) {
                        const contextualClinic = self.dataManager.clinics?.find(c => c.id == contextualClinicId);
                        if (contextualClinic) {
                            clinicName = contextualClinic.name;
                        }
                    }
                } catch (ctxErr) {
                    console.warn('Failed to resolve context clinic:', ctxErr);
                }
                
                if (shopContainer) {
                    // 店舗名を取得
                    const storeNameElement = shopContainer.querySelector('.shop-name a');
                    const storeName = storeNameElement?.textContent?.trim() || '店舗';
                    
                    // 住所を取得
                    const addressElement = shopContainer.querySelector('.shop-address');
                    const address = addressElement?.textContent?.trim() || '住所情報なし';
                    
                    // アクセス情報を取得
                    let access = '駅から徒歩圏内'; // デフォルト値
                    
                    // CSVデータから正確なアクセス情報とクリニック名を取得
                    if (self.dataManager) {
                        const stores = self.dataManager.stores; // 直接storesプロパティを参照
                        // 店舗名と住所が一致する店舗を探す
                        const matchingStore = stores.find(store => {
                            return store.storeName === storeName && store.address === address;
                        });
                        
                        if (matchingStore) {
                            if (matchingStore.access) {
                                access = matchingStore.access;
                            }
                            // クリニック名はDOMコンテキスト優先。未解決の場合のみCSVの値を採用
                            if (clinicName === 'クリニック' && matchingStore.clinicName) {
                                clinicName = matchingStore.clinicName;
                            }
                        } else {
                            // CSVから見つからない場合は、HTMLから取得を試みる
                            const shopInfoElement = shopContainer.querySelector('.shop-info');
                            if (shopInfoElement) {
                                const infoText = shopInfoElement.textContent;
                                const lines = infoText.split('\n').map(line => line.trim()).filter(line => line);
                                const accessLine = lines.find(line => line.includes('駅') && (line.includes('徒歩') || line.includes('分')));
                                if (accessLine) {
                                    access = accessLine;
                                }
                            }
                        }
                    }
                    
                    // CSVからクリニック名を取得できなかった場合のみ、HTMLから取得
                    if (clinicName === 'クリニック') {
                        // data-clinic-idで未解決なら、h3要素から取得を試みる
                        const shopsContainer2 = shopContainer.closest('.shops');
                        const clinicDetailElement2 = shopsContainer2?.closest('.detail-item');
                        if (clinicName === 'クリニック') {
                            const h3Element = clinicDetailElement?.querySelector('h3');
                            if (h3Element) {
                                // h3のテキストから「ⓘ」などの記号を除去
                                const h3Text = h3Element.childNodes[0]?.textContent?.trim() || h3Element.textContent?.trim();
                                
                                // h3テキストから直接クリニック名を取得
                                if (h3Text && h3Text !== '') {
                                    // データベースから正確なクリニック名を検索
                                    if (self.dataManager && self.dataManager.clinics) {
                                        const matchedClinic = self.dataManager.clinics.find(c => 
                                            h3Text.includes(c.name) || c.name.includes(h3Text)
                                        );
                                        if (matchedClinic) {
                                            clinicName = matchedClinic.name;
                                        }
                                    }
                                }
                                
                                // それでも見つからない場合は、リンクのhrefから取得
                                if (clinicName === 'クリニック') {
                                    const detailButtons = clinicDetailElement2?.querySelectorAll('.detail_btn_2, .link_btn');
                                    if (detailButtons.length > 0) {
                                        const href = detailButtons[0].getAttribute('href');
                                        // redirect.htmlのクエリパラメータからclinic_idを取得
                                        const clinicIdMatch = href?.match(/clinic_id=(\d+)/);
                                        if (clinicIdMatch) {
                                            const extractedClinicId = clinicIdMatch[1];
                                            const clinic = self.dataManager?.clinics?.find(c => c.id == extractedClinicId);
                                            if (clinic) {
                                                clinicName = clinic.name;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    
                    // モーダルに情報を設定
                    try {
                        // デバッグ用に詳細ログを追加
                        
                        // 店舗名が「クリニック 渋谷院」のような形式の場合、「クリニック」を正しいクリニック名に置換
                        let fullStoreName = storeName;
                        if (storeName.startsWith('クリニック')) {
                            // 「クリニック 新宿院」→「ディオクリニック新宿院」
                            fullStoreName = clinicName + storeName.replace('クリニック', '').trim();
                        } else if (!storeName.includes(clinicName)) {
                            // 店舗名にクリニック名が含まれていない場合、追加
                            fullStoreName = clinicName + storeName;
                        }
                        
                        self.showMapModal(fullStoreName, address, access, clinicName);
                    } catch (error) {
                    }
                } else {
                    
                    // フォールバック: 最低限の情報でモーダルを表示
                    try {
                        self.showMapModal('テストクリニック', 'テスト住所', 'テストアクセス', 'test');
                    } catch (error) {
                    }
                }
            }
        };
        
        // イベントリスナーを追加
        document.addEventListener('click', this.mapButtonClickHandler, true);
        
        // モーダルを閉じるイベント
        if (mapModalClose) {
            mapModalClose.addEventListener('click', () => {
                self.hideMapModal();
            });
        }
        
        if (mapModalOverlay) {
            mapModalOverlay.addEventListener('click', () => {
                self.hideMapModal();
            });
        }
        
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mapModal?.style.display !== 'none') {
                self.hideMapModal();
            }
        });
    }
    
    // 地図モーダルを表示
    showMapModal(clinicName, address, access, clinicCode) {
        
        const modal = document.getElementById('map-modal');
        const modalClinicName = document.getElementById('map-modal-clinic-name');
        const modalAddress = document.getElementById('map-modal-address');
        const modalAccess = document.getElementById('map-modal-access');
        const modalHours = document.getElementById('map-modal-hours');
        const modalMapContainer = document.getElementById('map-modal-map-container');
        const modalButton = document.getElementById('map-modal-button');
        
        if (modal && modalClinicName && modalAddress && modalAccess && modalMapContainer) {
            // 変換コンテキストの影響を避けるため、body直下に移動（PCで左寄りになる問題の回避）
            try {
                if (modal.parentNode !== document.body) {
                    document.body.appendChild(modal);
                }
            } catch (_) {}
            // まずモーダルを表示
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // スクロールを無効化
            
            // モーダルの内容を設定
            modalClinicName.textContent = clinicName;
            modalAddress.textContent = address;
            modalAccess.textContent = access;
            
            // Google Maps iframeを生成
            modalMapContainer.innerHTML = this.generateMapIframe(address);
            
            // 公式サイトボタンのURLとテキストを設定（エラーが発生してもモーダルは表示される）
            if (modalButton) {
                try {
                // クリニック名からクリニックコードを取得
                let clinicKey = '';
                const clinics = this.dataManager.clinics || [];
                
                // clinicCodeパラメータはクリニック名なので、クリニック名で検索
                const clinic = clinics.find(c => 
                    c.name === clinicCode || 
                    clinicName.includes(c.name) || 
                    c.name === clinicName
                );
                
                if (clinic) {
                    clinicKey = clinic.code;
                }
                
                // urlHandlerのインスタンスがある場合は使用、なければ直接URLを生成
                let generatedUrl = '#';
                
                try {
                    if (window.urlHandler) {
                        generatedUrl = window.urlHandler.getClinicUrlByNameWithRegionId(clinicKey);
                    }
                } catch (e) {
                }
                
                // URLが生成できなかった場合のフォールバック
                if (!generatedUrl || generatedUrl === '#') {
                    // 直接redirect.htmlへのリンクを生成
                    const regionId = new URLSearchParams(window.location.search).get('region_id') || '000';
                    if (clinic) {
                        generatedUrl = `./redirect.html?clinic_id=${clinic.id}&rank=1&region_id=${regionId}`;
                    }
                }
                
                // URLが正しく生成されているか確認
                if (generatedUrl && generatedUrl !== '#' && generatedUrl !== '') {
                    modalButton.href = generatedUrl;
                    modalButton.target = '_blank';
                    modalButton.rel = 'noopener';
                    
                    // クリックイベントを削除（通常のリンクとして動作させる）
                    modalButton.onclick = null;
                } else {
                    // URLが生成できない場合は、メインページのクリニック詳細へスクロール
                    modalButton.href = '#';
                    modalButton.onclick = (e) => {
                        e.preventDefault();
                        this.hideMapModal();
                        // クリニック詳細セクションへスクロール
                        const clinicDetail = document.querySelector(`[data-clinic-id="${clinic?.id || '1'}"]`);
                        if (clinicDetail) {
                            clinicDetail.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    };
                }
                
                    // ボタンテキストを設定
                    const buttonText = document.getElementById('map-modal-button-text');
                    if (buttonText) {
                        // CTAは店舗名ではなくクリニック名のみを表示
                        const ctaClinicName = (clinic && clinic.name)
                            || (typeof clinicCode === 'string' && clinicCode)
                            || 'クリニック';
                        buttonText.textContent = ctaClinicName + 'の公式サイト';
                    }
                } catch (error) {
                    // エラーが発生してもモーダルは表示されたままにする
                    modalButton.href = '#';
                    modalButton.onclick = (e) => {
                        e.preventDefault();
                        this.hideMapModal();
                    };
                }
            }
        } else {
        }
    }
    
    // 地図モーダルを非表示
    hideMapModal() {
        const modal = document.getElementById('map-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // スクロールを再度有効化
        }
    }
}

// 店舗の表示を切り替える関数（一度だけ開く）
function toggleStores(button) {
    const targetId = button.getAttribute('data-target');
    const root = button.closest('.clinic-detail-modal') || document;
    const targetShops = root.querySelector(targetId) || document.querySelector(targetId);
    if (!targetShops) return false;
    const hiddenShops = targetShops.querySelectorAll('.hidden-content');
    hiddenShops.forEach(shop => { shop.classList.remove('hidden'); });
    button.style.display = 'none';
    return false;
}

// アプリケーションの初期化
// 比較表の注釈を動的に生成する関数
function initializeDisclaimers() {
    // console.log('DEBUG: initializeDisclaimers called');
    
    // 両方の場所に注意事項を表示
    const mainContent = document.getElementById('main-content');
    const rankingDisclaimers = document.getElementById('ranking-disclaimers-content');
    
    // console.log('DEBUG: mainContent found:', !!mainContent);
    // console.log('DEBUG: rankingDisclaimers found:', !!rankingDisclaimers);
    // console.log('DEBUG: dataManager available:', !!window.dataManager);
    
    if (!window.dataManager) {
        // console.warn('DEBUG: dataManager not available');
        return;
    }
    
    if (!mainContent && !rankingDisclaimers) {
        // console.warn('DEBUG: Neither disclaimer container found');
        return;
    }

    // 現在選択されている地域IDを取得
    // 方法1: RankingAppのインスタンスから取得（推奨）
    let regionId = window.app?.currentRegionId;
    
    // 方法2: 上記が取得できない場合はURLパラメータから直接取得
    if (!regionId) {
        const urlParams = new URLSearchParams(window.location.search);
        regionId = urlParams.get('region_id');
    }
    
    // デフォルトは東京（13）- データと一致させる
    if (!regionId) {
        regionId = '13';
    }
    
    // パディングを除去（013 -> 13）
    regionId = String(parseInt(regionId, 10));
    
    
    // ランキングデータを取得
    const ranking = window.dataManager.getRankingByRegionId(regionId);
    if (!ranking || !ranking.ranks) {
        mainContent.innerHTML = ''; // 空にする
        return;
    }
    

    // 比較表で実際に表示されているクリニックのみを取得
    const displayedClinics = [];
    const comparisonTbody = document.getElementById('comparison-tbody');

    if (comparisonTbody && comparisonTbody.children.length > 0) {
        // 比較表の行からクリニック情報を取得
        Array.from(comparisonTbody.children).forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                // クリニック名セルを取得（通常は最初のtd）
                const clinicNameCell = cells[0];
                if (clinicNameCell) {
                    const clinicName = clinicNameCell.textContent.trim();
                    const clinicLink = clinicNameCell.querySelector('a');

                    if (clinicName && clinicName !== '') {
                        // クリニックコードを特定（リンクのonclick属性からclinic_idを取得）
                        let clinicId = null;
                        if (clinicLink) {
                            const onclickMatch = clinicLink.getAttribute('onclick')?.match(/clinic_id:\s*'([^']+)'/);
                            if (onclickMatch) {
                                clinicId = onclickMatch[1];
                            }
                        }

                        if (clinicId) {
                            const clinicCode = window.dataManager.getClinicCodeById(clinicId);
                            if (clinicCode) {
                                displayedClinics.push({
                                    rank: index + 1,
                                    id: clinicId,
                                    code: clinicCode,
                                    name: clinicName
                                });
                                // console.log(`DEBUG: Added displayed clinic ${clinicName} (ID: ${clinicId}, Code: ${clinicCode})`);
                            }
                        }
                    }
                }
            }
        });
    }

    // フォールバック：比較表が生成されていない場合はランキングから取得
    const topClinics = displayedClinics.length > 0 ? displayedClinics : [];

    if (topClinics.length === 0 && ranking && ranking.ranks) {
        // フォールバック：1位~5位のクリニックを取得
        for (let i = 1; i <= 5; i++) {
            const clinicId = ranking.ranks[`no${i}`];

            if (clinicId && clinicId !== '-' && clinicId !== '') {
                const clinic = window.dataManager.getClinicById(clinicId);
                if (clinic) {
                    const clinicCode = window.dataManager.getClinicCodeById(clinicId);
                    if (clinicCode) {
                        topClinics.push({
                            rank: i,
                            id: clinicId,
                            code: clinicCode,
                            name: clinic.name
                        });
                        // console.log(`DEBUG: Added fallback clinic ${clinic.name} (ID: ${clinicId}, Code: ${clinicCode})`);
                    }
                }
            }
        }
    }
    
    // クリニック名でアルファベット順にソート
    topClinics.sort((a, b) => a.name.localeCompare(b.name));

    // console.log(`DEBUG: Total clinics found: ${topClinics.length}`);
    topClinics.forEach((clinic, index) => {
        // console.log(`DEBUG: Clinic ${index + 1}: ${clinic.name} (${clinic.code})`);
    });

    // 有効なクリニックがない場合
    if (topClinics.length === 0) {
        if (mainContent) mainContent.innerHTML = '';
        if (rankingDisclaimers) rankingDisclaimers.innerHTML = '';
        return;
    }


    // 共通のHTML生成関数
    const generateDisclaimerHtmlForSection = (clinics, prefix) => {
        let disclaimerHTML = '';
        let disclaimerCount = 0;
        
        clinics.forEach(clinic => {
            const disclaimerText = window.dataManager.getClinicText(clinic.code, '比較表の注意事項', '');
            if (disclaimerText && disclaimerText.trim() !== '') {
                disclaimerCount++;
                const clinicSlug = clinic.code.toLowerCase().replace(/\s+/g, '');
                const uniqueSlug = `${prefix}-${clinicSlug}`;
                
                disclaimerHTML += `
                    <div class="disclaimer-item">
                        <button class="disclaimer-header" onclick="return toggleClinicDisclaimer('${uniqueSlug}', event)" style="width: 100%; text-align: left; padding: 6px 10px; background-color: #f8f8f8; border: 1px solid #eeeeee; border-radius: 2px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <span style="font-size: 9px; font-weight: 400; color: #777;">${clinic.name}</span>
                            <span id="${uniqueSlug}-arrow" style="font-size: 7px; color: #aaa; transition: transform 0.2s;">▼</span>
                        </button>
                        <div id="${uniqueSlug}-content" class="disclaimer-content" style="display: none; padding: 6px 10px; background-color: #fefefe; border: 1px solid #eeeeee; border-top: none; border-radius: 0 0 2px 2px; margin-top: -2px;">
                            <div style="font-size: 9px; color: #777; line-height: 1.4;">
                                ${disclaimerText.split('\n').map(line => line.trim()).filter(line => line).map(line => `<p>${line}</p>`).join('\n                            ')}
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        return { html: disclaimerHTML, count: disclaimerCount };
    };

    // ランキングセクション用のHTMLを生成して挿入
    const rankingResult = generateDisclaimerHtmlForSection(topClinics, 'rank');
    if (rankingDisclaimers) {
        if (rankingResult.count > 0) {
            rankingDisclaimers.innerHTML = rankingResult.html;
        } else {
            rankingDisclaimers.innerHTML = '<p style="font-size: 11px; color: #666; padding: 10px;">注意事項はありません。</p>';
        }
    }

    // 比較表セクション用のHTMLを生成して挿入
    const comparisonResult = generateDisclaimerHtmlForSection(topClinics, 'comp');
    if (mainContent) {
        if (comparisonResult.count > 0) {
            mainContent.innerHTML = comparisonResult.html;
        } else {
            mainContent.innerHTML = '<p style="font-size: 11px; color: #666; padding: 10px;">注意事項はありません。</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    const app = new RankingApp();
    window.app = app; // グローバルアクセス用
    
    app.init();
    
    // 比較表の注釈を動的に初期化
    setTimeout(() => {
        initializeDisclaimers();
    }, 100);
    
    // バナースライダーの初期化（potenza002同等）
    setTimeout(() => {
        try { initializeBannerSliders(); } catch (_) {}
    }, 200);
    
    // デバッグ用：グローバル関数として公開
    window.testInitializeDisclaimers = initializeDisclaimers;
    // モーダル操作関数も明示的に公開（環境差分対策）
    window.openClinicDetailModal = openClinicDetailModal;
    window.closeClinicDetailModal = closeClinicDetailModal;

    // 確認事項トグルのスコープ対応（モーダル優先で動作）
    window.toggleClinicDisclaimer = function(uniqueSlug, event) {
        if (event) { event.preventDefault?.(); event.stopPropagation?.(); }
        const modalRoot = document.querySelector('.clinic-detail-modal');
        const root = (event && event.target && event.target.closest('.clinic-detail-modal')) || modalRoot || document;
        const content = root.querySelector(`#${uniqueSlug}-content`) || document.querySelector(`#${uniqueSlug}-content`);
        const arrow = root.querySelector(`#${uniqueSlug}-arrow`) || document.querySelector(`#${uniqueSlug}-arrow`);
        if (content) {
            const isHidden = (getComputedStyle(content).display === 'none' || content.style.display === 'none');
            content.style.display = isHidden ? 'block' : 'none';
            if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        return false;
    };
    window.toggleDisclaimer = function(clinicSlug) {
        const modalRoot = document.querySelector('.clinic-detail-modal');
        const root = modalRoot || document;
        const content = root.querySelector(`#${clinicSlug}-content`) || document.querySelector(`#${clinicSlug}-content`);
        const arrow = root.querySelector(`#${clinicSlug}-arrow`) || document.querySelector(`#${clinicSlug}-arrow`);
        if (content) {
            const isHidden = (getComputedStyle(content).display === 'none' || content.style.display === 'none');
            content.style.display = isHidden ? 'block' : 'none';
            if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        return false;
    };
    
    // 初期化後にも一度詳細リンクをチェック
    setTimeout(() => {
        const allDetailLinks = document.querySelectorAll('a[href*="#clinic"]');
        
        // #clinicを含むリンクにイベントリスナーを追加
        allDetailLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href') || '';
                const m = href.match(/#clinic(\d+)/);
                if (m) {
                    e.preventDefault();
                    const rank = parseInt(m[1], 10);
                    if (rank && !Number.isNaN(rank)) openClinicDetailModal(rank);
                }
            });
        });
        
        // 追加のフォールバック: #clinicリンク全般をグローバルに捕捉（キャプチャ段階）
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href*="#clinic"]');
            if (!a) return;
            const href = a.getAttribute('href') || '';
            const m = href.match(/#clinic(\d+)/);
            if (!m) return;
            e.preventDefault();
            const rank = parseInt(m[1], 10);
            if (rank && !Number.isNaN(rank)) openClinicDetailModal(rank);
        }, true);
    }, 500);
    
    // フッターのページリンクにパラメータ引き継ぎ機能を追加
    document.querySelectorAll('.footer-page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const currentParams = new URLSearchParams(window.location.search);
            if (currentParams.toString()) {
                const url = new URL(this.href, window.location.origin);
                // 全てのパラメータを追加
                for (const [key, value] of currentParams) {
                    url.searchParams.set(key, value);
                }
                window.location.href = url.toString();
            } else {
                window.location.href = this.href;
            }
        });
    });
});
// バナースライダーの初期化関数（potenza002から移植）
function initializeBannerSliders() {
    const sliders = document.querySelectorAll('.banner-slider');
    sliders.forEach(slider => {
        if (slider.dataset.initialized === '1') return; // 多重初期化防止
        slider.dataset.initialized = '1';
        let slidesArr = Array.from(slider.querySelectorAll('.slider-slide'));
        let dotsArr = Array.from(slider.querySelectorAll('.slider-dot'));
        const dotsContainer = slider.querySelector('.slider-dots');
        const prevBtn = slider.querySelector('.slider-prev');
        const nextBtn = slider.querySelector('.slider-next');
        const counter = slider.querySelector('.slider-counter');
        const expandBtn = slider.querySelector('.slider-expand');

        if (!slidesArr || slidesArr.length === 0) return;

        let currentIndex = 0;
        let totalSlides = slidesArr.length;
        const getImageUrls = () => Array.from(slider.querySelectorAll('.slider-slide')).map(slide => {
            const img = slide.querySelector('img');
            return img ? img.src : '';
        });
        let imageUrls = getImageUrls();
        const getActiveIndex = () => {
            const idx = slidesArr.findIndex(s => s.classList.contains('active'));
            return idx >= 0 ? idx : 0;
        };
        currentIndex = getActiveIndex();

        // 画像クリックで拡大モーダル
        slidesArr.forEach((slide) => {
            const img = slide.querySelector('img');
            const open = () => createAndShowModal(imageUrls, getActiveIndex());
            if (img) {
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', open);
            } else {
                slide.addEventListener('click', open);
            }
        });

        function updateSlider(index) {
            slidesArr.forEach(slide => slide.classList.remove('active'));
            dotsArr.forEach(dot => dot.classList.remove('active'));
            slidesArr[index]?.classList.add('active');
            if (dotsArr[index]) dotsArr[index].classList.add('active');
            if (counter) counter.textContent = `${index + 1}/${totalSlides}`;
            currentIndex = index;
        }

        function updateNavVisibility() {
            const show = totalSlides > 1;
            if (prevBtn) prevBtn.style.display = show ? '' : 'none';
            if (nextBtn) nextBtn.style.display = show ? '' : 'none';
            if (dotsContainer) dotsContainer.style.display = show ? '' : 'none';
        }

        function reindex() {
            slidesArr = Array.from(slider.querySelectorAll('.slider-slide'));
            dotsArr = Array.from(slider.querySelectorAll('.slider-dot'));
            slidesArr.forEach((s, i) => s.setAttribute('data-index', String(i)));
            dotsArr.forEach((d, i) => d.setAttribute('data-index', String(i)));
            totalSlides = slidesArr.length;
            imageUrls = getImageUrls();
            updateNavVisibility();
        }

        function removeSlideAt(idx) {
            const slide = slidesArr[idx];
            const dot = dotsArr[idx];
            if (slide) slide.remove();
            if (dot) dot.remove();
            reindex();
            if (totalSlides === 0) return;
            if (currentIndex >= totalSlides) currentIndex = totalSlides - 1;
            updateSlider(currentIndex);
        }

        slidesArr.forEach((slide) => {
            const img = slide.querySelector('img');
            if (!img) return;
            img.addEventListener('error', () => {
                const idxAttr = slide.getAttribute('data-index');
                const idx = idxAttr ? parseInt(idxAttr, 10) : slidesArr.indexOf(slide);
                if (idx >= 0) removeSlideAt(idx);
            }, { once: true });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
                updateSlider(newIndex);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = currentIndex === totalSlides - 1 ? 0 : currentIndex + 1;
                updateSlider(newIndex);
            });
        }

        dotsArr.forEach((dot) => {
            dot.addEventListener('click', () => {
                const idxAttr = dot.getAttribute('data-index');
                const idx = idxAttr ? parseInt(idxAttr, 10) : dotsArr.indexOf(dot);
                updateSlider(Math.max(0, idx));
            });
        });

        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                createAndShowModal(imageUrls, getActiveIndex());
            });
        }

        updateSlider(getActiveIndex());
        updateNavVisibility();
    });
}

// バナー拡大モーダル（potenza002から移植）
function createAndShowModal(imageUrls, startIndex) {
    const existingModal = document.querySelector('.banner-modal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div class="banner-modal active">
            <button class="banner-modal-close">&times;</button>
            <button class="banner-modal-nav banner-modal-prev">‹</button>
            <div class="banner-modal-content">
                <img class="banner-modal-image" src="${imageUrls[startIndex]}" alt="拡大画像">
                <div class="banner-modal-counter">${startIndex + 1}/${imageUrls.length}</div>
            </div>
            <button class="banner-modal-nav banner-modal-next">›</button>
            <div class="banner-modal-dots">
                ${imageUrls.map((_, idx) => `
                    <button class="banner-modal-dot ${idx === startIndex ? 'active' : ''}" data-index="${idx}" aria-label="${idx + 1}"></button>
                `).join('')}
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.querySelector('.banner-modal');
    const modalImage = modal.querySelector('.banner-modal-image');
    const modalCounter = modal.querySelector('.banner-modal-counter');
    const closeBtn = modal.querySelector('.banner-modal-close');
    const prevBtn = modal.querySelector('.banner-modal-prev');
    const nextBtn = modal.querySelector('.banner-modal-next');
    const modalDots = modal.querySelectorAll('.banner-modal-dot');
    const modalDotsWrap = modal.querySelector('.banner-modal-dots');

    let currentModalIndex = startIndex;
    function updateModalSlide(index) {
        modalImage.src = imageUrls[index];
        modalCounter.textContent = `${index + 1}/${imageUrls.length}`;
        currentModalIndex = index;
        if (modalDots && modalDots.length) {
            modalDots.forEach((d, i) => {
                if (i === index) d.classList.add('active');
                else d.classList.remove('active');
            });
        }
    }

    closeBtn.addEventListener('click', () => { modal.remove(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    prevBtn.addEventListener('click', () => {
        const newIndex = currentModalIndex === 0 ? imageUrls.length - 1 : currentModalIndex - 1;
        updateModalSlide(newIndex);
    });
    nextBtn.addEventListener('click', () => {
        const newIndex = currentModalIndex === imageUrls.length - 1 ? 0 : currentModalIndex + 1;
        updateModalSlide(newIndex);
    });
    if (modalDots && modalDots.length) {
        modalDots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.getAttribute('data-index'), 10) || 0;
                updateModalSlide(idx);
            });
        });
    }
    if (imageUrls.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (modalDotsWrap) modalDotsWrap.style.display = 'none';
    }

    const handleKey = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleKey);
            return;
        }
        if (e.key === 'ArrowLeft') {
            const newIndex = currentModalIndex === 0 ? imageUrls.length - 1 : currentModalIndex - 1;
            updateModalSlide(newIndex);
            return;
        }
        if (e.key === 'ArrowRight') {
            const newIndex = currentModalIndex === imageUrls.length - 1 ? 0 : currentModalIndex + 1;
            updateModalSlide(newIndex);
            return;
        }
    };
    document.addEventListener('keydown', handleKey);
}

// クリニック詳細モーダル（ボトムシート）
function openClinicDetailModal(rank) {
    closeClinicDetailModal();
    const target = document.getElementById(`clinic${rank}`);
    if (!target) return;
    const contentRoot = target.querySelector('.ranking_box_in') || target;
    const contentHtml = contentRoot.outerHTML;
    // クリニック名を特定
    let clinicNameForHeader = 'クリニック';
    try {
        const clinicIdAttr = target.getAttribute('data-clinic-id');
        if (clinicIdAttr && window.dataManager && Array.isArray(window.dataManager.clinics)) {
            const c = window.dataManager.clinics.find(x => String(x.id) === String(clinicIdAttr));
            if (c && c.name) clinicNameForHeader = c.name;
        }
        if (clinicNameForHeader === 'クリニック') {
            const nameFromDom = target.querySelector('.ranking__name a')?.textContent?.replace(/\s*＞\s*$/, '')?.trim();
            if (nameFromDom) clinicNameForHeader = nameFromDom;
        }
    } catch (_) {}

    const overlayHtml = '<div class="clinic-detail-overlay"></div>';
    const modalHtml = `
        <div class="clinic-detail-modal" role="dialog" aria-modal="true" aria-label="${clinicNameForHeader}の詳細">
            <button class="clinic-detail-close" aria-label="閉じる">&times;</button>
            <header>
                <div style="font-size:17px;color:#333;">${clinicNameForHeader}の詳細</div>
            </header>
            <div class="clinic-detail-body">
                ${contentHtml}
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', overlayHtml + modalHtml);
    const overlay = document.querySelector('.clinic-detail-overlay');
    const modal = document.querySelector('.clinic-detail-modal');
    // バナースライダーの多重初期化ガード属性を除去して再初期化可能にする
    if (modal) {
        const modalSliders = modal.querySelectorAll('.banner-slider');
        modalSliders.forEach((s) => {
            s.removeAttribute('data-initialized');
        });
    }
    requestAnimationFrame(() => {
        overlay?.classList.add('active');
        modal?.classList.add('active');
        document.body.classList.add('no-scroll');
        try { initializeBannerSliders(); } catch (_) {}
        try { initializeCaseSliderIn(modal); } catch (_) {}
    });

    const cleanup = () => { closeClinicDetailModal(); };
    overlay?.addEventListener('click', cleanup);
    modal?.querySelector('.clinic-detail-close')?.addEventListener('click', cleanup);
    const onKey = (e) => { if (e.key === 'Escape') cleanup(); };
    document.addEventListener('keydown', onKey, { once: true });
}

function closeClinicDetailModal() {
    const overlay = document.querySelector('.clinic-detail-overlay');
    const modal = document.querySelector('.clinic-detail-modal');
    if (overlay) overlay.parentNode.removeChild(overlay);
    if (modal) modal.parentNode.removeChild(modal);
    document.body.classList.remove('no-scroll');
}

// 症例画像クリック時の拡大（グローバル委譲フォールバック）
// 動的生成されたスライドにも確実に適用する
document.addEventListener('click', function(e) {
    try {
        const clickedSlide = e.target && e.target.closest && e.target.closest('.case-slide');
        const targetImg = (e.target && e.target.closest && e.target.closest('.case-slide img')) || (clickedSlide && clickedSlide.querySelector && clickedSlide.querySelector('img'));
        if (!clickedSlide && !targetImg) return;
        const container = (clickedSlide || targetImg).closest('.case-slider, .case-carousel-container');
        if (!container) return;
        const imgs = Array.from(container.querySelectorAll('.case-slide img'));
        if (!imgs.length) return;
        const urls = imgs.map(img => img && img.src).filter(Boolean);
        if (!urls.length) return;
        let startIndex = 0;
        if (targetImg) {
            startIndex = Math.max(0, imgs.indexOf(targetImg));
        } else if (clickedSlide) {
            const idx = Array.from(container.querySelectorAll('.case-slide')).indexOf(clickedSlide);
            startIndex = Math.max(0, idx);
        }
        e.preventDefault();
        e.stopPropagation();
        if (typeof createAndShowModal === 'function') {
            createAndShowModal(urls, startIndex);
        }
    } catch (_) {}
}, true);

// スクロール追従モーダル
function initializeScrollModal() {
    // console.log('Initializing scroll modal...');
    
    // 既存のモーダルがあれば削除
    const existingModal = document.querySelector('.scroll-bottom-modal');
    if (existingModal) existingModal.remove();

    // 1位のクリニックロゴを取得
    let clinicLogoUrl = '';
    let clinicUrl = '#ranking';
    
    // まずランキング1位のDOM要素から直接取得
    const firstRankingItem = document.querySelector('#clinic1, .ranking_box[data-rank="1"], .ranking-item.rank-1, #ranking-list .ranking-item');
    console.log('First ranking item:', firstRankingItem);
    
    // 1位のクリニックを特定
    let clinicName = '';
    if (firstRankingItem) {
        // クリニック名を取得
        const clinicNameElement = firstRankingItem.querySelector('.ranking__name a, .clinic-name, .clinic-logo-section h3');
        if (clinicNameElement) {
            clinicName = clinicNameElement.textContent.replace(/\s*＞\s*$/, '').trim();
        }
        
        // クリニックIDを取得してURLを生成
        const clinicId = firstRankingItem.getAttribute('data-clinic-id') || firstRankingItem.id?.replace('clinic', '');
        if (clinicId) {
            const urlHandler = new UrlParamHandler();
            clinicUrl = urlHandler.getClinicUrlWithRegionId(clinicId, 1);
        }
    }
    
    // クリニック名からロゴパスを構築（TCBの例に従って）
    if (clinicName) {
        const clinicMap = {
            'TCB東京中央美容外科': 'tcb/tcb-logo.webp',
            'リゼクリニック': 'rize/rize-logo.webp',
            '湘南美容クリニック': 'sbc/sbc-logo.webp',
            'レジーナクリニック': 'regina/regina-logo.webp',
            '品川美容外科': 'shinagawa/shinagawa-logo.webp'
        };
        
        const logoPath = clinicMap[clinicName];
        if (logoPath) {
            clinicLogoUrl = `../common_data/images/clinics/${logoPath}`;
            // console.log('Logo URL from clinic map:', clinicLogoUrl);
        }
    }
    
    // DOM要素から直接ロゴを取得（フォールバック）
    if (!clinicLogoUrl && firstRankingItem) {
        const logoImg = firstRankingItem.querySelector('.ranking__logo img, .clinic-logo, .clinic-banner img');
        if (logoImg && logoImg.src) {
            clinicLogoUrl = logoImg.src;
            // console.log('Logo URL from DOM:', clinicLogoUrl);
        }
    }
    
    // DataManagerからも取得を試みる（フォールバック）
    if (!clinicLogoUrl && window.dataManager) {
        const firstClinic = document.querySelector('[data-rank="1"], .ranking-item.rank-1');
        if (firstClinic) {
            const clinicId = firstClinic.getAttribute('data-clinic-id');
            const clinicCode = window.dataManager.getClinicCodeById(clinicId);
            if (clinicCode) {
                clinicLogoUrl = window.dataManager.getClinicText(clinicCode, 'ロゴ', '');
            }
        }
    }

    // デフォルトロゴ
    if (!clinicLogoUrl) {
        clinicLogoUrl = './images/logo-placeholder.png';
    }

    // 吹き出しテキスト（footer-modal1）をCSVから取得
    let bubbleText = '今なら特別キャンペーン実施中！';
    try {
        const firstClinicForText = document.querySelector('[data-rank="1"], .ranking-item.rank-1, #clinic1, .ranking_box[data-rank="1"]');
        let clinicIdForText = null;
        if (firstClinicForText) {
            clinicIdForText = firstClinicForText.getAttribute('data-clinic-id') || firstClinicForText.id?.replace('clinic', '');
        }
        if (clinicIdForText && window.dataManager) {
            const code = window.dataManager.getClinicCodeById(clinicIdForText);
            if (code) {
                const t = window.dataManager.getClinicText(code, 'footer-modal1', bubbleText);
                if (t) bubbleText = t;
            }
        }
    } catch (e) {
        console.warn('footer-modal1 テキスト取得に失敗:', e);
    }

    // モーダルのHTML作成
    const modalHtml = `
        <div class="scroll-bottom-modal">
            <div class="scroll-modal-bubble">
                <span>${bubbleText}</span>
            </div>
            
            <div class="scroll-modal-content">
                <div class="scroll-modal-left">
                    <button class="scroll-modal-close" aria-label="閉じる">&times;</button>
                    <img src="${clinicLogoUrl}" alt="1位クリニック" class="scroll-modal-logo">
                </div>
                <a href="${clinicUrl}" class="scroll-modal-btn" onclick="if(window.handleClinicClick) handleClinicClick(event, this);">
                    <span class="scroll-modal-btn-free">無料</span>
                    <span class="scroll-modal-btn-text">
                        <span>カウンセリングを</span>
                        <span>予約する</span>
                    </span>
                    <span class="scroll-modal-btn-arrow" aria-hidden="true">▶</span>
                </a>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.querySelector('.scroll-bottom-modal');
    const closeBtn = modal.querySelector('.scroll-modal-close');
    
    if (!modal || !closeBtn) {
        console.error('Modal elements not found');
        return;
    }
    
    let hasShown = false;
    let isClosed = false;

    // モーダルを表示する関数
    function showModal() {
        if (!hasShown && !isClosed) {
            // console.log('Showing modal');
            modal.classList.add('show');
            hasShown = true;
        }
    }

    // モーダルを非表示にする関数
    function hideModal() {
        // console.log('Hiding modal');
        modal.classList.remove('show');
        isClosed = true;
    }

    // 閉じるボタンのクリックイベント
    closeBtn.addEventListener('click', hideModal);

    // スクロールイベント
    function checkScroll() {
        if (isClosed) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
        
        // console.log('Scroll percentage:', scrollPercentage); // debug removed per request
        
        // 10%以上スクロールしたら表示
        if (scrollPercentage >= 6.5) {
            showModal();
        }
    }

    // スクロールイベントリスナー
    window.addEventListener('scroll', checkScroll);
    
    // 初回チェック
    setTimeout(() => {
        checkScroll();
    }, 100);
}

// 症例スライダー（モーダル内）簡易初期化
function initializeCaseSliderIn(root) {
    if (!root) return;
    const slider = root.querySelector('.case-slider');
    if (!slider) return;
    const track = slider.querySelector('.case-track');
    if (!track) return;
    let slides = Array.from(slider.querySelectorAll('.case-slide'));
    const dotsWrap = root.querySelector('.case-dots');
    let dots = Array.from(root.querySelectorAll('.case-dot'));
    const prevBtn = slider.querySelector('.case-nav-prev');
    const nextBtn = slider.querySelector('.case-nav-next');
    if (!slides.length) return;
    let current = 0;
    const reindex = () => {
        slides = Array.from(slider.querySelectorAll('.case-slide'));
        dots = Array.from(root.querySelectorAll('.case-dot'));
        dots.forEach((d, i) => d.setAttribute('data-index', String(i)));
    };
    const updateNavVisibility = () => {
        const show = slides.length > 1;
        if (prevBtn) prevBtn.style.display = show ? '' : 'none';
        if (nextBtn) nextBtn.style.display = show ? '' : 'none';
        if (dotsWrap) dotsWrap.style.display = show ? 'block' : 'none';
    };
    const show = (i) => {
        if (!slides.length || !track) return;
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        current = i;
        track.style.display = 'flex';
        track.style.transform = `translateX(-${current * 100}%)`;
        track.style.transition = 'transform .3s ease';
        slides.forEach(s => { s.style.minWidth = '100%'; s.style.boxSizing = 'border-box'; });
        dots.forEach((d, idx) => {
            d.classList.toggle('active', idx === current);
            d.style.background = (idx === current ? '#2CC7C5' : '#ccc');
        });
    };
    const imgs = Array.from(slider.querySelectorAll('img'));
    imgs.forEach((img) => {
        img.addEventListener('error', () => {
            const slide = img.closest('.case-slide');
            if (!slide) return;
            const idx = slides.indexOf(slide);
            if (idx >= 0) {
                const dot = dots[idx];
                if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
                if (slide && slide.parentNode) slide.parentNode.removeChild(slide);
                reindex();
                if (!slides.length) return;
                if (current >= slides.length) current = slides.length - 1;
                updateNavVisibility();
                show(current);
            }
        }, { once: true });
    });
    prevBtn && prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn && nextBtn.addEventListener('click', () => show(current + 1));
    dots.forEach((d, idx) => d.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); show(idx); }));
    if (dotsWrap) {
        dotsWrap.addEventListener('click', (e) => {
            const el = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
            if (!el) return;
            const dot = el.closest && el.closest('.case-dot');
            if (!dot) return;
            e.preventDefault();
            e.stopPropagation();
            const idxAttr = dot.getAttribute('data-index');
            const idx = idxAttr ? parseInt(idxAttr, 10) : Array.from(dotsWrap.querySelectorAll('.case-dot')).indexOf(dot);
            if (idx >= 0) show(idx);
        }, { capture: true });
    }
    updateNavVisibility();
    show(0);
}

// DOMContentLoaded時にスクロールモーダルを初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // 既存の初期化処理の後に追加
        setTimeout(() => {
            initializeScrollModal();
        }, 2000); // 2秒後に初期化（データ読み込みを待つ）
    });
} else {
    // すでにDOMが読み込まれている場合
    setTimeout(() => {
        initializeScrollModal();
    }, 2000);
}