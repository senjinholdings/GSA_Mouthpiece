#!/bin/bash

# 使用方法: ./create-deployment.sh 番号
# 例: ./create-deployment.sh 005

if [ $# -eq 0 ]; then
    echo "❌ エラー: 番号を指定してください"
    echo "使用方法: ./create-deployment.sh 番号"
    echo "例: ./create-deployment.sh 005"
    exit 1
fi

NEW_NUM=$1
NEW_DIR="mouthpiece${NEW_NUM}"

# ディレクトリが既に存在するかチェック
if [ -d "$NEW_DIR" ]; then
    echo "❌ エラー: ${NEW_DIR}は既に存在します"
    exit 1
fi

echo "📁 ${NEW_DIR}を作成中..."

# コピー元ディレクトリを選択（最新のものから順に試す）
if [ -d "mouthpiece001" ]; then
    SOURCE_DIR="mouthpiece001"
elif [ -d "mouthpiece002" ]; then
    SOURCE_DIR="mouthpiece002"
elif [ -d "mouthpiece001" ]; then
    SOURCE_DIR="mouthpiece001"
else
    echo "❌ エラー: コピー元のディレクトリが見つかりません"
    exit 1
fi

echo "📋 ${SOURCE_DIR}をコピー元として使用します"

# コピー（node_modulesを除く）
rsync -av --exclude='node_modules' --exclude='dist' "$SOURCE_DIR/" "$NEW_DIR/"

# ディレクトリに移動
cd "$NEW_DIR"

# node_modulesをインストール
echo "📦 依存関係をインストール中..."
npm install

# astro.config.mjsのbase pathを更新（どのソースからコピーされても対応）
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|base: '/[^/]*/|base: '/${NEW_DIR}/|g" astro.config.mjs
else
    # Linux
    sed -i "s|base: '/[^/]*/|base: '/${NEW_DIR}/|g" astro.config.mjs
fi

echo "⚙️  astro.config.mjsを更新しました"

# ビルド実行
echo "🔨 ビルド中..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ ${NEW_DIR}が正常に作成されました！"

    # ルートディレクトリに戻る
    cd ..

    # vercel.jsonを更新
    if [ -f "vercel.json" ]; then
        echo "📝 vercel.jsonを更新中..."
        # Pythonを使って安全にJSONを更新（環境変数を渡す）
        NEW_DIR="$NEW_DIR" python3 -c "
import json
import os

# 環境変数から新しいディレクトリ名を取得
new_dir = os.environ.get('NEW_DIR')

# vercel.jsonを読み込み
with open('vercel.json', 'r') as f:
    data = json.load(f)

# 新しいルートを追加
new_route = {
    'source': f'/{new_dir}/(.*)',
    'destination': f'/{new_dir}/dist/$1'
}

# rewritesセクションに追加
if 'rewrites' in data:
    data['rewrites'].append(new_route)
else:
    data['rewrites'] = [new_route]

# ファイルに書き込み
with open('vercel.json', 'w') as f:
    json.dump(data, f, indent=2)

print('✅ vercel.jsonを更新しました')
"
    else
        echo "⚠️  vercel.jsonが見つかりません。手動で以下を追加してください:"
        echo "    { \"source\": \"/${NEW_DIR}/(.*)\", \"destination\": \"/${NEW_DIR}/dist/\$1\" }"
    fi

    echo ""
    echo "📌 次の手順:"
    echo "1. Gitにコミット＆プッシュ:"
    echo "   git add ${NEW_DIR} vercel.json"
    echo "   git commit -m \"Add ${NEW_DIR} deployment\""
    echo "   git push"
    echo ""
    echo "2. ローカルでプレビュー:"
    echo "   cd ${NEW_DIR} && npm run preview"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi