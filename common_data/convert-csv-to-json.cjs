const fs = require('fs');
const path = require('path');

// CSVをパースする汎用関数
function parseCsvToArray(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }

    return data;
}

// メイン処理
function convertAllCsvToJson() {
    // dataフォルダ内のCSVをJSONに変換
    const dataPath = path.join(__dirname, 'data');

    // CSVファイルのリスト
    const csvFiles = [
        { csv: '出しわけSS - items.csv', json: '出しわけSS - items.json' },
        { csv: '出しわけSS - region.csv', json: '出しわけSS - region.json' },
        { csv: '出しわけSS - stores.csv', json: '出しわけSS - stores.json' },
        { csv: '出しわけSS - store_view.csv', json: '出しわけSS - store_view.json' },
        { csv: '出しわけSS - ranking.csv', json: '出しわけSS - ranking.json' }
    ];

    let successCount = 0;
    let errorCount = 0;

    console.log('📁 Processing directory:', dataPath);
    console.log('');

    csvFiles.forEach(file => {
        const csvPath = path.join(dataPath, file.csv);
        const jsonPath = path.join(dataPath, file.json);

        try {
            // CSVファイルが存在するか確認
            if (!fs.existsSync(csvPath)) {
                console.log(`⚠️  Skipping ${file.csv} (file not found)`);
                return;
            }

            // CSVファイルを読み込み
            const csvText = fs.readFileSync(csvPath, 'utf8');

            // CSVをJSONに変換
            const jsonData = parseCsvToArray(csvText);

            // JSONファイルとして保存
            fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

            const fileSize = fs.statSync(jsonPath).size;
            const recordCount = jsonData.length;

            console.log(`✅ ${file.csv} → ${file.json}`);
            console.log(`   Records: ${recordCount}, Size: ${(fileSize / 1024).toFixed(2)} KB`);
            successCount++;

        } catch (error) {
            console.error(`❌ Error converting ${file.csv}:`, error.message);
            errorCount++;
        }
    });

    // site-common-texts.json を site-config.json としてコピー
    const configSourcePath = path.join(dataPath, 'site-common-texts.json');
    const configTargetPath = path.join(dataPath, 'site-config.json');

    try {
        if (fs.existsSync(configSourcePath)) {
            // JSONファイルを読み込み
            const configData = JSON.parse(fs.readFileSync(configSourcePath, 'utf8'));
            // site-config.json として保存
            fs.writeFileSync(configTargetPath, JSON.stringify(configData, null, 2), 'utf8');
            console.log(`✅ site-common-texts.json → site-config.json (copied)`);
            successCount++;
        }
    } catch (error) {
        console.error(`❌ Error copying site-config.json:`, error.message);
        errorCount++;
    }

    console.log('\n📊 Conversion Summary:');
    console.log(`   ✅ Success: ${successCount} files`);
    if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount} files`);
    }
    console.log(`   📁 Data directory: ${dataPath}`);
}

// スクリプト実行
console.log('🚀 Starting CSV to JSON conversion in data folder...\n');
convertAllCsvToJson();