/**
 * 比較表のSticky Header実装
 * 横スクロールを維持しながらヘッダーを固定
 */
(function() {
    'use strict';
    
    function initStickyHeader() {
        const table = document.getElementById('comparison-table');
        const wrapper = document.querySelector('.comparison-table-wrapper');
        const container = document.getElementById('comparison-table-container');
        
        if (!table || !wrapper || !container) {
            console.log('Sticky header: Required elements not found');
            return;
        }
        
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        if (!thead || !tbody) {
            console.log('Sticky header: thead or tbody not found');
            return;
        }
        
        // 固定ヘッダー用のコンテナを作成
        let stickyHeader = document.getElementById('sticky-comparison-header');
        if (!stickyHeader) {
            stickyHeader = document.createElement('div');
            stickyHeader.id = 'sticky-comparison-header';
            stickyHeader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 100;
                background: white;
                display: none;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            // ヘッダーテーブルを作成
            const headerTable = document.createElement('table');
            headerTable.id = 'sticky-header-table';
            headerTable.style.cssText = 'border-collapse: collapse; width: 100%;';
            
            const headerThead = thead.cloneNode(true);
            headerTable.appendChild(headerThead);
            stickyHeader.appendChild(headerTable);
            
            document.body.appendChild(stickyHeader);
        }
        
        // スクロール同期関数
        function syncHeaderScroll() {
            const headerTable = document.getElementById('sticky-header-table');
            if (headerTable && wrapper) {
                headerTable.style.transform = `translateX(-${wrapper.scrollLeft}px)`;
            }
        }
        
        // ヘッダー表示/非表示の制御
        function updateStickyHeader() {
            const tableRect = table.getBoundingClientRect();
            const theadRect = thead.getBoundingClientRect();
            const stickyHeader = document.getElementById('sticky-comparison-header');

            if (!stickyHeader) return;

            // テーブルの上部が画面上部を超え、下部がまだ画面内にある場合
            if (tableRect.top < 0 && tableRect.bottom > 0) {
                stickyHeader.style.display = 'block';

                // 元のtheadを非表示
                thead.style.visibility = 'hidden';

                // ヘッダーの幅と位置を同期
                const wrapperRect = wrapper.getBoundingClientRect();
                stickyHeader.style.left = wrapperRect.left + 'px';
                stickyHeader.style.width = wrapperRect.width + 'px';

                // セル幅を同期
                const originalCells = thead.querySelectorAll('th');
                const stickyCells = stickyHeader.querySelectorAll('th');

                originalCells.forEach((cell, index) => {
                    if (stickyCells[index]) {
                        stickyCells[index].style.width = cell.offsetWidth + 'px';
                    }
                });

                syncHeaderScroll();
            } else {
                stickyHeader.style.display = 'none';
                thead.style.visibility = 'visible';
            }
        }
        
        // イベントリスナー設定
        wrapper.addEventListener('scroll', syncHeaderScroll);
        window.addEventListener('scroll', updateStickyHeader);
        window.addEventListener('resize', updateStickyHeader);
        
        // 初期化時に一度実行
        updateStickyHeader();
        
        // MutationObserverでテーブル内容の変更を監視
        const observer = new MutationObserver(() => {
            const stickyHeader = document.getElementById('sticky-comparison-header');
            if (stickyHeader) {
                const headerThead = thead.cloneNode(true);
                const headerTable = document.getElementById('sticky-header-table');
                if (headerTable) {
                    headerTable.innerHTML = '';
                    headerTable.appendChild(headerThead);
                }
            }
            updateStickyHeader();
        });
        
        observer.observe(thead, { childList: true, subtree: true });
        observer.observe(tbody, { childList: true });
        
        console.log('Sticky header initialized');
    }
    
    // DOMContentLoaded後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickyHeader);
    } else {
        initStickyHeader();
    }
    
    // データ読み込み後にも初期化（比較表が動的生成されるため）
    window.addEventListener('load', () => {
        setTimeout(initStickyHeader, 1000);
    });
})();
