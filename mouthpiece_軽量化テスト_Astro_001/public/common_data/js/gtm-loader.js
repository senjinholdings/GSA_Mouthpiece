/* GTM Loader: site-common-texts.json からGTM IDを取得して挿入 */
(function(){
  try {
    if (window.__GTM_INJECTED__) return; // 二重挿入防止
    // 既存GTMがあれば何もしない
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js?id="]')) {
      window.__GTM_INJECTED__ = true;
      return;
    }

    var current = document.currentScript || (function(){
      var scripts = document.getElementsByTagName('script');
      for (var i=scripts.length-1; i>=0; i--) {
        if ((scripts[i].src||'').indexOf('/common_data/js/gtm-loader') !== -1) return scripts[i];
      }
      return null;
    })();
    if (!current || !current.src) return;
    var jsonUrl = new URL('../data/site-common-texts.json', current.src).href;

    function chooseId(data){
      if (!data || typeof data !== 'object') return '';
      var host = (location && location.hostname) || '';
      // ドメイン別マップ対応（任意）
      var mapKeys = ['GTM_IDS','gtm_ids','ドメイン別GTM','domain_gtm'];
      for (var i=0;i<mapKeys.length;i++){
        var m = data[mapKeys[i]];
        if (m && typeof m === 'object'){
          if (m[host]) return m[host];
          // ワイルドカード的に先頭一致も許容（例: ".example.com"）
          var keys = Object.keys(m);
          for (var k=0;k<keys.length;k++){
            var key = keys[k];
            if (key && host.endsWith(key)) return m[key];
          }
        }
      }
      // 単一ID
      var idKeys = ['GTM_ID','gtm_id','GTMタグID','Google Tag Manager ID'];
      for (var j=0;j<idKeys.length;j++){
        if (typeof data[idKeys[j]] === 'string' && data[idKeys[j]].trim()) return data[idKeys[j]].trim();
      }
      return '';
    }

    function injectGtm(containerId, dataLayerName){
      if (!containerId || !/^GTM-[A-Z0-9]+$/i.test(containerId)) return;
      var l = dataLayerName && String(dataLayerName).trim() || 'dataLayer';
      // dataLayer初期化 + gtm.js挿入（公式スニペット準拠）
      (function(w,d,s,l,i){
        w[l]=w[l]||[]; w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0], j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
        j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl; f.parentNode.insertBefore(j,f);
      })(window,document,'script',l,containerId);
      window.__GTM_INJECTED__ = true;
    }

    fetch(jsonUrl).then(function(r){return r.ok?r.text():''}).then(function(txt){
      var data = {};
      try { data = txt ? JSON.parse(txt) : {}; } catch(_) {}
      var id = chooseId(data);
      var dl = data && (data['DATALAYER_NAME'] || data['dataLayer'] || data['datalayer_name']);
      injectGtm(id, dl);
    }).catch(function(){ /* 失敗時は何もしない */ });
  } catch(_) { /* 失敗時は無視 */ }
})();

