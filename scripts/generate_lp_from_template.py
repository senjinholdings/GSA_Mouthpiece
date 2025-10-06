#!/usr/bin/env python3
"""Generate a new landing page directory and workflow YAML from template.

Usage example:
    python scripts/generate_lp_from_template.py \
        --keyword "矯正歯科" \
        --dir-prefix mouthpiece

The script will:
  1. Copy the base template directory (default: mouthpiece_section001)
     to a new directory derived from the keyword.
  2. Replace common placeholder keywords inside major text assets.
  3. Emit a workflow YAML under process_templates/generated/.

You can adjust defaults with CLI flags.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_PATH = ROOT / "process_templates" / "kw_landing_workflow_template.yaml"
GENERATED_DIR = ROOT / "process_templates" / "generated"
DEFAULT_BASE_TEMPLATE = "mouthpiece_section001"
DEFAULT_AUTHOR = os.getenv("USER", "Codex")
DEFAULT_OBJECTIVE = "検索/広告LPとして主要訴求ポイントを1ページで提示"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create LP directory and workflow YAML from template")
    parser.add_argument("--keyword", required=True, help="設定するメインキーワード (例: 矯正歯科)")
    parser.add_argument(
        "--base-template",
        default=DEFAULT_BASE_TEMPLATE,
        help=f"コピー元ディレクトリ (default: {DEFAULT_BASE_TEMPLATE})",
    )
    parser.add_argument(
        "--dir-prefix",
        default="mouthpiece",
        help="新規ディレクトリの接頭辞。最終的なディレクトリ名は <prefix>_<slug> となります。",
    )
    parser.add_argument(
        "--dir-name",
        default=None,
        help="新規ディレクトリ名を明示指定する場合はこちらを利用 (prefixより優先)",
    )
    parser.add_argument(
        "--author",
        default=DEFAULT_AUTHOR,
        help="ワークフローYAMLに記載する author 値",
    )
    parser.add_argument(
        "--objective",
        default=DEFAULT_OBJECTIVE,
        help="ワークフローYAML内の objective フィールド",
    )
    parser.add_argument(
        "--base-keyword",
        default="マウスピース矯正",
        help="コピー元ディレクトリ内で置換対象にする既存キーワード",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実ファイルを作成せず、生成結果のみ表示",
    )
    return parser


def slugify(text: str) -> str:
    """Return a filesystem-friendly slug while保持ing日本語."""
    normalized = re.sub(r"[\s\t\r\n]+", "_", text.strip())
    normalized = normalized.replace("/", "-")
    normalized = re.sub(r"[^0-9A-Za-z_\-一-龠ぁ-んァ-ンー]", "", normalized)
    return normalized or "lp"


def copy_directory(base_dir: Path, dest_dir: Path) -> None:
    if dest_dir.exists():
        raise FileExistsError(f"destination directory already exists: {dest_dir}")
    shutil.copytree(base_dir, dest_dir)


def replace_keywords(dest_dir: Path, old_keyword: str, new_keyword: str) -> None:
    replacement_targets = [
        dest_dir / "index.html",
        dest_dir / "data" / "site-common-texts.csv",
        dest_dir / "data" / "clinic-texts.csv",
        dest_dir / "columns" / "columns.js",
    ]
    for path in replacement_targets:
        if not path.exists() or path.is_dir():
            continue
        text = path.read_text(encoding="utf-8")
        if old_keyword not in text:
            continue
        updated = text.replace(old_keyword, new_keyword)
        path.write_text(updated, encoding="utf-8")


def render_workflow_yaml(keyword: str, directory_name: str, args: argparse.Namespace) -> str:
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    today = dt.date.today().isoformat()
    placeholders = {
        "{{NOTE}}": "このファイルは自動生成されました",
        "{{CREATED_AT}}": today,
        "{{AUTHOR}}": args.author,
        "{{TARGET_KEYWORD}}": keyword,
        "{{OBJECTIVE}}": args.objective,
        "{{PERSONA_AGE_RANGE}}": "20-39",
        "{{PERSONA_NEED_1}}": "目立たない矯正方法を探している",
        "{{PERSONA_NEED_2}}": "費用と通院負担がわかるブランド比較が必要",
        "{{PERSONA_ANXIETY_1}}": "痛みや後戻りが不安",
        "{{PERSONA_ANXIETY_2}}": "追加費用や保証の有無が分かりづらい",
        "{{COMPETITOR_1_NAME}}": "インビザライン公式",
        "{{COMPETITOR_1_POINT}}": "症例数とブランド力",
        "{{COMPETITOR_2_NAME}}": "キレイライン矯正",
        "{{COMPETITOR_2_POINT}}": "低価格と都度払いプラン",
        "{{COMPETITOR_3_NAME}}": "Medical DOC",
        "{{COMPETITOR_3_POINT}}": "費用相場と症例写真を豊富に掲載",
        "{{SERP_COMMON_1}}": "費用シミュレーション・月額換算",
        "{{SERP_COMMON_2}}": "症例写真 (Before/After)",
        "{{SERP_COMMON_3}}": "無料相談・オンライン診療導線",
        "{{DIFF_POINT_1}}": "全国対応ブランドを横並び比較",
        "{{DIFF_POINT_2}}": "保証・追加費用の有無を明示",
        "{{DIRECTORY_NAME}}": directory_name,
        "{{BASE_TEMPLATE}}": args.base_template,
        "{{SHARED_CSS}}": "../common_data/styles",
        "{{SHARED_IMAGES}}": "../common_data/images/clinics",
        "{{HERO_HEADLINE}}": f"迷わない{keyword}選び",
        "{{HERO_SUBCOPY}}": "費用・期間・保証を一目で比較",
        "{{CTA_TEXT}}": "無料カウンセリングを予約",
        "{{TASK_PREP_1}}": "既存テンプレートをコピーしてディレクトリを作成",
        "{{TASK_PREP_2}}": "meta情報とヒーローコピーの初期置換",
        "{{TASK_DATA_1}}": "site-common-texts.csvの文言をキーワードに合わせて更新",
        "{{TASK_DATA_2}}": "clinic-texts.csvの比較項目を最新情報に調整",
        "{{TASK_JS_1}}": "app.jsでregion_idデフォルトや比較表見出しを確認",
        "{{TASK_JS_2}}": "CTAトラッキングのパラメータを検証",
        "{{TASK_QA_1}}": "ローカルでランキング/Tips文言をチェック",
        "{{TASK_QA_2}}": "redirect.htmlで遷移パラメータをテスト",
    }
    for placeholder, value in placeholders.items():
        template = template.replace(placeholder, value)
    return template


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    keyword = args.keyword.strip()
    base_dir = ROOT / args.base_template
    if not base_dir.exists():
        raise FileNotFoundError(f"base template directory not found: {base_dir}")

    slug = slugify(keyword)
    directory_name = args.dir_name or f"{args.dir_prefix}_{slug}"
    dest_dir = ROOT / directory_name

    if args.dry_run:
        print(f"[dry-run] would create directory: {dest_dir}")
        print(render_workflow_yaml(keyword, directory_name, args))
        return

    copy_directory(base_dir, dest_dir)
    replace_keywords(dest_dir, args.base_keyword, keyword)

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    yaml_output = render_workflow_yaml(keyword, directory_name, args)
    yaml_path = GENERATED_DIR / f"{directory_name}_workflow.yaml"
    yaml_path.write_text(yaml_output, encoding="utf-8")

    print(f"✔ 新規ディレクトリを作成: {dest_dir.relative_to(ROOT)}")
    print(f"✔ ワークフローを生成: {yaml_path.relative_to(ROOT)}")
    print("--- 次のステップ例 ---")
    print("1. data/site-common-texts.csv や index.html の文言をキーワードに合わせて微調整")
    print("2. 競合調査結果でsecondary_keywordsやdifferentiation_planを上書き")
    print("3. 広告計測 (GTM/GA) の設定を確認")


if __name__ == "__main__":
    main()
