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
    echo "🚀 プレビューを開始するには以下を実行してください:"
    echo "   cd ${NEW_DIR} && npm run preview"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi