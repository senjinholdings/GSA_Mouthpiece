// コラムセクションのデータ
const columnsData = {
  mainArticle: {
    title: "矯正歯科を始める前に知っておくべきこと",
    headerImage: "images/column.webp",
    imageAlt: "矯正歯科の基礎知識",
    toc: [
      {
        title: "矯正歯科とワイヤー矯正の違い",
        id: "comparison",
        subItems: [
          { title: "仕組みの違い", id: "mechanism" },
          { title: "メリット・デメリット", id: "merits" }
        ]
      },
      {
        title: "矯正歯科のリスクや副作用",
        id: "risks",
        subItems: [
          { title: "起こりうる副作用", id: "side-effects" },
          { title: "痛みや違和感について", id: "pain" },
          { title: "治療前・治療中の注意点", id: "precautions" }
        ]
      },
      {
        title: "契約時の確認ポイント",
        id: "contract",
        subItems: [
          { title: "保険適用について", id: "insurance" },
          { title: "治療内容・計画を細かく確認", id: "details" },
          { title: "追加費用がかからないか確認", id: "additional-fees" },
          { title: "トラブル時の相談先", id: "troubles" }
        ]
      }
    ]
  },
  
  sections: [
    {
      id: "comparison",
      type: "content-section",
      title: "矯正歯科とワイヤー矯正の違い",
      content: "歯列矯正には大きく分けて「矯正歯科」と「ワイヤー矯正」の<span style=\"background-color: #fff3cd; padding: 2px 4px;\">2種類があります</span>。それぞれの仕組みやメリット・デメリットを理解し、自分に合った治療法を選びましょう。",
      table: {
        type: "tips-comparison-table",
        headers: ["", "矯正歯科", "ワイヤー矯正"],
        rows: [
          ["治療方法", "アライナー（取り外し式）", "ブラケット＋ワイヤー（固定式）"],
          ["見た目", "目立ちにくい", "目立ちやすい"],
          ["通院頻度", "1〜3ヶ月に1回", "月1回程度"],
          ["治療期間(※)", "最短2ヶ月〜平均9ヶ月（症例による）", "1〜3年（症例による）"],
          ["費用相場", "20万〜60万円（軽度・部分中心）", "60万〜120万円（全体矯正中心）"],
          ["適応", "軽度〜中等度の叢生・空隙・前歯中心", "重度症例／抜歯計画など幅広く対応"]
        ]
      },
      additionalContent: [
        "<small>（※）回数・期間は目安です。個人差や症例による違いがあります。上記は効果を保証するものではありません。</small>",
        "矯正歯科は日常生活の制限が少なく自己管理がしやすい一方、装着時間の確保が必要です。ワイヤー矯正は適応範囲が広く、歯の大きな移動や複雑な症例にも対応できますが、見た目や清掃性の配慮が必要です。"
      ]
    },
    
    {
      id: "mechanism",
      type: "highlight-box",
      title: "仕組みの違い",
      content: [
        "矯正歯科は<span style=\"background-color: #fff3cd; padding: 2px 4px;\">取り外し式のアライナー</span>を使い、段階的に歯を動かします。ワイヤー矯正は<span style=\"background-color: #fff3cd; padding: 2px 4px;\">固定式のブラケットとワイヤー</span>で連続的に力をかけて歯を動かします。",
        "矯正歯科は、1〜2週間ごとに新しいアライナーへ交換し、<span style=\"background-color: #fff3cd; padding: 2px 4px;\">段階的に目標位置へ移動</span>させます。取り外せるため、食事や歯磨きがしやすいのが特徴です。",
        "一方ワイヤー矯正は、固定式のため自己管理の負担は少ない反面、見た目や食事制限、清掃性の面で配慮が必要です。"
      ]
    },
    
    {
      id: "merits",
      type: "highlight-box",
      title: "矯正歯科とワイヤー矯正のメリット・デメリット",
      content: "それぞれのメリット・デメリットをまとめました。自分に適した矯正方法選びの参考にしてください。",
      table: {
        type: "merit-table",
        data: [
          {
            category: "メリット",
            mouthpiece: [
              "目立ちにくく、取り外し可能",
              "食事や歯磨きがしやすい",
              "金属アレルギーの心配が少ない"
            ],
            wire: [
              "幅広い症例に対応しやすい",
              "歯の大きな移動や回転に強い"
            ]
          },
          {
            category: "デメリット",
            mouthpiece: [
              "装着時間の自己管理が必要（1日20〜22時間）",
              "適応外の症例もある",
              "アライナーの紛失・破損リスク"
            ],
            wire: [
              "見た目に目立つ",
              "食事制限や清掃性の負担",
              "口内炎や痛みが出やすい"
            ]
          }
        ]
      }
    },
    
    {
      id: "risks",
      type: "content-section",
      title: "矯正歯科のリスクや副作用",
      headerImage: "images/column2.webp",
      imageAlt: "矯正歯科の副作用について",
      content: [
        "矯正歯科は高い効果が期待できる一方で、治療過程での違和感や痛み、歯肉の炎症、アライナーの破損などの副作用が生じることがあります。",
        "どの矯正治療にもリスクは伴います。気になる症状があれば、必ず担当医に相談しましょう。"
      ]
    },
    
    {
      id: "side-effects",
      type: "highlight-box",
      title: "起こりうる副作用",
      content: "矯正歯科で起こりうる主な副作用は以下の通りです。",
      subsections: [
        {
          title: "痛み・違和感",
          content: "装着初期やアライナー交換直後に痛みや圧迫感、違和感が生じることがあります。通常は数日〜1週間程度で治まります。"
        },
        {
          title: "歯肉の炎症・口内炎",
          content: "アライナーの縁が歯肉や粘膜に当たり、炎症や口内炎ができる場合があります。気になる場合は担当医に調整を依頼してください。"
        },
        {
          title: "アライナーの破損・変形",
          content: "アライナーが割れたり変形した場合は、速やかに担当医へ連絡し、再作製や調整を受けましょう。"
        },
        {
          title: "歯根吸収・歯の動揺",
          content: "稀に歯根吸収や歯の動揺が起こることがあります。定期的な診察で経過を確認しましょう。"
        }
      ]
    },
    
    {
      id: "pain",
      type: "highlight-box",
      title: "痛みや違和感について",
      content: [
        "矯正歯科の痛みや違和感は、<span style=\"background-color: #fff3cd; padding: 2px 4px;\">アライナー交換直後や歯の移動量が大きい場合に生じやすく</span>、感じ方には個人差があります。",
        "一般的に違和感が出やすいシーンや部位は以下の通りです。"
      ],
      list: [
        "アライナー交換直後（1〜3日程度）",
        "食事の際の噛む動作",
        "前歯や奥歯など移動量が大きい部位"
      ],
      additionalContent: "痛みが強い場合や長引く場合は、担当医に相談しましょう。アライナーの調整やワックスの使用、鎮痛剤の服用などで緩和できる場合があります。"
    },
    
    {
      id: "precautions",
      type: "highlight-box",
      title: "治療前・治療中の注意点",
      content: "矯正歯科の効果を最大限に引き出すため、以下の点に注意しましょう。",
      subsections: [
        {
          title: "装着時間の厳守",
          content: "1日20〜22時間以上の装着が必要です。装着時間が短いと計画通りに歯が動かない場合があります。"
        },
        {
          title: "アライナーの清掃",
          content: "アライナーは毎日清潔に保ちましょう。歯磨き後に装着し、飲食時は必ず外してください。"
        },
        {
          title: "定期的な通院",
          content: "指示された通院スケジュールを守り、経過観察や調整を受けましょう。"
        },
        {
          title: "体調管理",
          content: "体調不良時や服薬中の場合は、必ず担当医に相談してください。"
        }
      ]
    },
    
    {
      id: "contract",
      type: "content-section",
      title: "契約時の確認ポイント",
      headerImage: "images/column3.webp",
      imageAlt: "矯正契約の注意点"
    },
    
    {
      id: "insurance",
      type: "highlight-box",
      title: "保険適用について",
      content: [
        "矯正治療は原則として自由診療（自費診療）となり、保険適用外の場合が多いです（先天的な疾患や顎変形症など一部例外を除く）。",
        "主な目的が審美改善であるため、自由診療に分類されるのが一般的です。詳細は各院のルールを確認してください。",
        "<span style=\"background-color: #fff3cd; padding: 2px 4px;\">原則自費負担</span>のため、契約前に総額や追加費用を確認しましょう。"
      ]
    },
    
    {
      id: "details",
      type: "highlight-box",
      title: "治療内容について細かく確認する",
      content: [
        "矯正を契約する際は、治療計画・範囲・保定計画などを具体的に確認しましょう。自分の目標や希望に合っているかが重要です。",
        "例えば「前歯のみの部分矯正」と言っても、アライナー単独の計画もあれば、IPR（歯の側面を削る処置）やゴムかけ、部分ワイヤーを併用する場合もあります。",
        "契約後に治療内容が変更となる場合、追加料金が発生することもあるため、<span style=\"background-color: #fff3cd; padding: 2px 4px;\">契約前に治療内容をしっかり確認</span>しておきましょう。"
      ]
    },
    
    {
      id: "additional-fees",
      type: "highlight-box",
      title: "追加費用がかからないか確認する",
      content: [
        "契約時には、追加の費用についても必ず確認しましょう。提示料金とは別に、調整料・保定装置・再作製費用などが発生する場合があります。",
        "追加費用が掛かる項目の例は以下の通りです。"
      ],
      list: [
        "通院ごとの調整料（3,000円〜10,000円/回）",
        "アライナーの再作製費用",
        "保定装置（リテーナー）の費用",
        "検査費用（レントゲン、CT、模型など）",
        "IPR（歯の側面を削る処置）"
      ],
      additionalContent: "追加費用については、契約前に必ず確認するようにしてください。"
    },
    
    {
      id: "troubles",
      type: "highlight-box",
      title: "トラブル時の相談先",
      content: "万が一、矯正契約についてトラブルになった場合は、以下の窓口に相談できます。",
      consultationList: [
        {
          name: "消費者ホットライン",
          phone: "188",
          description: "消費者トラブル全般の相談窓口"
        },
        {
          name: "日本歯科医師会",
          url: "https://www.jda.or.jp/",
          description: "歯科医療に関する相談・苦情受付"
        },
        {
          name: "医療安全支援センター",
          description: "各都道府県に設置、医療に関する相談・苦情対応"
        }
      ]
    }
  ]
};

// エクスポート（必要に応じて）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = columnsData;
}

// コラムセクションを外部管理して挿入
(function injectMedicalColumns() {
  const root = document.getElementById('medical-columns-root');
  if (!root) return;

  const data = columnsData;

  const generateToc = (toc) => {
      return toc.map(item => `
          <li class="toc-item">
              <a href="#${item.id}" class="toc-link">${item.title}</a>
              ${(item.subItems || []).map(sub => `
                  <div class="toc-sub-item">
                      <a href="#${sub.id}" class="toc-link">${sub.title}</a>
                  </div>
              `).join('')}
          </li>
      `).join('');
  };

  const generateComparisonTable = (table) => `
      <table class="comparison-table">
          <thead class="table-header">
              <tr class="table-row">
                  ${table.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
          </thead>
          <tbody>
              ${table.rows.map(row => `
                  <tr class="table-row">
                      ${row.map((cell, index) => index === 0 ? `<td class="row-header">${cell}</td>` : `<td>${cell}</td>`).join('')}
                  </tr>
              `).join('')}
          </tbody>
      </table>
  `;

  const generateMeritTable = (table) => {
      const meritData = table.data.find(d => d.category === 'メリット');
      const demeritData = table.data.find(d => d.category === 'デメリット');
      return `
          <div class="tips-merits-container">
              <div class="tips-merits-card">
                  <div class="merits-title">矯正歯科のメリット</div>
                  <ul class="merits-list">
                      ${meritData.mouthpiece.map(li => `<li>${li}</li>`).join('')}
                  </ul>
              </div>
              <div class="tips-merits-card">
                  <div class="merits-title">ワイヤー矯正のメリット</div>
                  <ul class="merits-list">
                      ${meritData.wire.map(li => `<li>${li}</li>`).join('')}
                  </ul>
              </div>
              <div class="tips-merits-card">
                  <div class="merits-title">矯正歯科のデメリット</div>
                  <ul class="merits-list">
                      ${demeritData.mouthpiece.map(li => `<li>${li}</li>`).join('')}
                  </ul>
              </div>
              <div class="tips-merits-card">
                  <div class="merits-title">ワイヤー矯正のデメリット</div>
                  <ul class="merits-list">
                      ${demeritData.wire.map(li => `<li>${li}</li>`).join('')}
                  </ul>
              </div>
          </div>
      `;
  };

  const generateTable = (table) => {
      if (!table) return '';
      switch (table.type) {
          case 'tips-comparison-table':
              return generateComparisonTable(table);
          case 'merit-table':
              return generateMeritTable(table);
          default:
              return '';
      }
  };

  const generateSections = (sections) => {
      return sections.map(section => {
          const contentHtml = (Array.isArray(section.content) ? section.content.map(p => `<div class="section-content">${p}</div>`).join('') : (section.content ? `<div class="section-content">${section.content}</div>` : '')) || '';
          const additionalContentHtml = (Array.isArray(section.additionalContent) ? section.additionalContent.map(p => `<div class="section-content">${p}</div>`).join('') : (section.additionalContent ? `<div class="section-content">${section.additionalContent}</div>` : '')) || '';
          const headerImageHtml = section.headerImage ? `
              <div class="header-image" style="margin-top: 10px;">
                  <img src="${section.headerImage}" alt="${section.imageAlt}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
              </div>` : '';
          const tableHtml = generateTable(section.table);
          const listHtml = section.list ? `<ul class="fee-list">${section.list.map(item => `<li class="fee-item">${item}</li>`).join('')}</ul>` : '';
          const subsectionsHtml = section.subsections ? `<div class="tips-side-effects-container">${section.subsections.map(sub => `
              <div class="tips-side-effects-card">
                  <div class="subsection-title">${sub.title}</div>
                  <div class="section-content">${sub.content}</div>
              </div>`).join('')}</div>` : '';
          const consultationListHtml = section.consultationList ? `
              <ul class="contact-list">
                  ${section.consultationList.map(item => `
                      <li class="contact-item">
                          <i class="fas fa-phone"></i>
                          <a href="${item.url || (item.phone ? 'tel:'+item.phone : '#')}" target="_blank" rel="noopener noreferrer" class="contact-link" style="position: relative; z-index: 10; display: inline-block;">
                              ${item.name}（${item.description}）
                          </a>
                      </li>
                  `).join('')}
              </ul>` : '';

          const sectionWrapper = (content) => `<div class="article-card">${content}</div>`;
          let sectionInnerHtml = '';

          if (section.type === 'content-section') {
              sectionInnerHtml = `
                  <div class="content-section" id="${section.id}">
                      <div class="section-title">${section.title}</div>
                      ${headerImageHtml}
                      ${contentHtml}
                      ${tableHtml}
                      ${additionalContentHtml}
                  </div>`;
          } else if (section.type === 'highlight-box') {
              sectionInnerHtml = `
                  <div class="highlight-box" id="${section.id}">
                      <div class="section-title">${section.title}</div>
                      ${contentHtml}
                      ${subsectionsHtml}
                      ${listHtml}
                      ${consultationListHtml}
                      ${additionalContentHtml}
                  </div>`;
          }
          
          return sectionWrapper(sectionInnerHtml);
      }).join('');
  };

  const mainArticleHtml = `
      <div class="article-card">
          <div class="article-header">
              <div class="article-title">${data.mainArticle.title}</div>
              <div class="header-image">
                  <img src="${data.mainArticle.headerImage}" alt="${data.mainArticle.imageAlt}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
          </div>
          <div class="article-subtitle" style="margin: 8px 0 0; font-size: 0.95em; color: #666;"></div>
          <div class="toc-section">
              <div class="toc-title">目次</div>
              <ul class="toc-list">${generateToc(data.mainArticle.toc)}</ul>
          </div>
      </div>
  `;

  const sectionsHtml = generateSections(data.sections);

  root.innerHTML = `
      <!-- 医療情報コラムセクション -->
      <section class="medical-columns-section">
          <div class="columns-container">
              ${mainArticleHtml}
              ${sectionsHtml}
          </div>
      </section>
  `;
})();
  