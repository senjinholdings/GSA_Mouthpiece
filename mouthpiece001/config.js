// ディレクトリ基準の設定（現在のHTMLが属するディレクトリをbasePathに）
(function() {
    const pathname = window.location.pathname || '';
    // ファイル名を除去してディレクトリパスを取得
    const hasExtension = /\/[^/]+\.[^/]+$/.test(pathname);
    const dirPath = hasExtension ? pathname.replace(/\/[^/]+$/, '') : (pathname.endsWith('/') ? pathname.slice(0, -1) : pathname);
    const basePath = dirPath || '';
    const currentDir = basePath.substring(basePath.lastIndexOf('/') + 1) || '';

    window.SITE_CONFIG = {
        basePath: basePath,            // 例: /potenza002
        assetsPath: '.',
        dataPath: './data',
        imagesPath: './images',
        currentDir: currentDir
    };
})();