// コラムセクションをレンダリングする関数
(function() {
    // DOMが読み込まれてから実行
    document.addEventListener('DOMContentLoaded', function() {
        const root = document.getElementById('medical-columns-root');
        if (!root || typeof columnsData === 'undefined') {
            console.error('medical-columns-root element or columnsData not found');
            return;
        }

        // HTMLを生成する関数
        function renderColumns(data) {
            let html = `
            <section class="medical-columns-section">
                <div class="columns-container">
                    <!-- Main Article Card -->
                    <div class="article-card">
                        <div class="article-header">
                            <div class="article-title">
                                ${data.mainArticle.title}
                            </div>
                            <div class="header-image">
                                <img src="${data.mainArticle.headerImage}" alt="${data.mainArticle.imageAlt}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        </div>

                        <!-- Table of Contents -->
                        <div class="toc-section">
                            <div class="toc-title">目次</div>
                            <ul class="toc-list">`;

            // 目次を生成
            data.mainArticle.toc.forEach(item => {
                html += `
                                <li class="toc-item">
                                    <a href="#${item.id}" class="toc-link">${item.title}</a>`;
                
                if (item.subItems && item.subItems.length > 0) {
                    item.subItems.forEach(subItem => {
                        html += `
                                    <div class="toc-sub-item">
                                        <a href="#${subItem.id}" class="toc-link">${subItem.title}</a>
                                    </div>`;
                    });
                }
                
                html += `
                                </li>`;
            });

            html += `
                            </ul>
                        </div>
                    </div>`;

            // 各セクションを生成
            data.sections.forEach(section => {
                html += renderSection(section);
            });

            html += `
                </div>
            </section>`;

            return html;
        }

        // 個別のセクションをレンダリング
        function renderSection(section) {
            let html = `
                    <div class="article-card">`;

            if (section.type === 'content-section') {
                html += `
                        <div class="content-section" id="${section.id}">
                            <div class="section-title">${section.title}</div>`;
                
                // ヘッダー画像がある場合
                if (section.headerImage) {
                    html += `
                            <div class="header-image" style="margin: 16px 0;">
                                <img src="${section.headerImage}" alt="${section.imageAlt || ''}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                            </div>`;
                }
                
                // コンテンツを追加
                if (typeof section.content === 'string') {
                    html += `
                            <div class="section-content">
                                ${section.content}
                            </div>`;
                } else if (Array.isArray(section.content)) {
                    section.content.forEach(content => {
                        html += `
                            <div class="section-content"${content.style ? ` style="${content.style}"` : ''}>
                                ${content.text || content}
                            </div>`;
                    });
                }
                
                // テーブルがある場合
                if (section.table) {
                    html += renderTable(section.table);
                }
                
                // 追加コンテンツがある場合
                if (section.additionalContent) {
                    section.additionalContent.forEach(content => {
                        const style = content.style ? ` style="${content.style}"` : '';
                        const text = content.text || content;
                        html += `
                            <div class="section-content"${style}>
                                ${text}
                            </div>`;
                    });
                }
                
                html += `
                        </div>`;
            } else if (section.type === 'highlight-box') {
                html += `
                        <div class="highlight-box" id="${section.id}">
                            <div class="section-title">${section.title}</div>`;
                
                // コンテンツを追加
                if (typeof section.content === 'string') {
                    html += `
                            <div class="section-content">
                                ${section.content}
                            </div>`;
                } else if (Array.isArray(section.content)) {
                    section.content.forEach(content => {
                        const style = content.style ? ` style="${content.style}"` : '';
                        const text = content.text || content;
                        html += `
                            <div class="section-content"${style}>
                                ${text}
                            </div>`;
                    });
                }
                
                // サブセクションがある場合
                if (section.subsections) {
                    section.subsections.forEach(subsection => {
                        html += `
                            <div class="subsection-title">${subsection.title}</div>
                            <div class="section-content">
                                ${subsection.content}
                            </div>`;
                    });
                }
                
                // リストがある場合
                if (section.list) {
                    if (section.id === 'additional-fees') {
                        html += `
                            <ul class="fee-list">`;
                        section.list.forEach(item => {
                            html += `
                                <li class="fee-item">${item}</li>`;
                        });
                        html += `
                            </ul>`;
                    } else if (section.id === 'pain') {
                        html += `
                            <div class="pain-area-box">`;
                        section.list.forEach(item => {
                            html += `
                                <div class="pain-area">${item}</div>`;
                        });
                        html += `
                            </div>`;
                    }
                }
                
                // 相談先リストがある場合
                if (section.consultationList) {
                    html += `
                            <ul class="contact-list">`;
                    section.consultationList.forEach(item => {
                        html += `
                                <li class="contact-item">
                                    <i class="fas fa-phone"></i>`;
                        
                        if (item.url) {
                            html += `
                                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="contact-link" style="position: relative; z-index: 10; display: inline-block;">${item.name}（${item.description}）</a>`;
                        } else {
                            html += `
                                    <span class="contact-text">${item.name}${item.phone ? ` ${item.phone}` : ''}（${item.description}）</span>`;
                        }
                        
                        html += `
                                </li>`;
                    });
                    html += `
                            </ul>`;
                }
                
                // テーブルがある場合
                if (section.table) {
                    html += renderTable(section.table);
                }
                
                // 追加コンテンツがある場合
                if (section.additionalContent) {
                    if (typeof section.additionalContent === 'string') {
                        html += `
                            <div class="section-content">
                                ${section.additionalContent}
                            </div>`;
                    } else if (Array.isArray(section.additionalContent)) {
                        section.additionalContent.forEach(content => {
                            const style = content.style ? ` style="${content.style}"` : '';
                            const text = content.text || content;
                            html += `
                            <div class="section-content"${style}>
                                ${text}
                            </div>`;
                        });
                    }
                }
                
                html += `
                        </div>`;
            }

            html += `
                    </div>`;

            return html;
        }

        // テーブルをレンダリング
        function renderTable(table) {
            let html = '';
            
            if (table.type === 'tips-comparison-table') {
                html += `
                            <table class="tips-comparison-table">
                                <thead class="table-header">
                                    <tr>`;
                
                table.headers.forEach(header => {
                    html += `
                                        <th>${header}</th>`;
                });
                
                html += `
                                    </tr>
                                </thead>
                                <tbody>`;
                
                table.rows.forEach(row => {
                    html += `
                                    <tr class="table-row">`;
                    row.forEach((cell, index) => {
                        const cellClass = index === 0 ? 'row-header' : '';
                        html += `
                                        <td${cellClass ? ` class="${cellClass}"` : ''}>${cell}</td>`;
                    });
                    html += `
                                    </tr>`;
                });
                
                html += `
                                </tbody>
                            </table>`;
            } else if (table.type === 'merit-table') {
                html += `
                            <table class="merit-table">
                                <thead>
                                    <tr>
                                        <th class="merit-header"></th>
                                        <th class="merit-header">マウスピース矯正</th>
                                        <th class="merit-header">ワイヤー矯正</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                
                table.data.forEach(row => {
                    html += `
                                    <tr>
                                        <td class="merit-category">${row.category}</td>
                                        <td class="merit-content">
                                            <ul>`;
                    row.mouthpiece.forEach(item => {
                        html += `
                                                <li>${item}</li>`;
                    });
                    html += `
                                            </ul>
                                        </td>
                                        <td class="merit-content">
                                            <ul>`;
                    row.wire.forEach(item => {
                        html += `
                                                <li>${item}</li>`;
                    });
                    html += `
                                            </ul>
                                        </td>
                                    </tr>`;
                });
                
                html += `
                                </tbody>
                            </table>`;
            }
            
            return html;
        }

        // コラムセクションをレンダリング
        const columnsHTML = renderColumns(columnsData);
        root.innerHTML = columnsHTML;

        // スムーズスクロールを再設定
        document.querySelectorAll('.medical-columns-section .toc-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    });
})();