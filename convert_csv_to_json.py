#!/usr/bin/env python3
"""CSV→JSON 変換スクリプト

`data/` ディレクトリ内の CSV を読み込み、同じディレクトリに JSON を出力します。
既存 JSON と同一構造になるよう、ファイルごとに変換ルールを最適化しています。
"""

import csv
import json
import sys
from collections import OrderedDict
from pathlib import Path
from typing import Iterable, List

BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "data"
OUTPUT_DIR = INPUT_DIR


def read_csv_rows(path: Path) -> List[List[str]]:
    """UTF-8/Shift_JIS を自動判定して CSV を読み込む"""
    encodings: Iterable[str] = ("utf-8-sig", "cp932", "utf-8")
    for enc in encodings:
        try:
            with path.open(encoding=enc, newline="") as fp:
                return [row for row in csv.reader(fp)]
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError(path.as_posix(), b"", 0, 1, "unable to decode CSV")


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)


def convert_site_common_texts(src: Path, dest: Path) -> None:
    rows = read_csv_rows(src)
    mapping = OrderedDict()
    for row in rows[1:]:  # skip header
        if len(row) < 3:
            continue
        key = (row[0] or "").strip()
        value = (row[2] or "").strip()
        if key:
            mapping[key] = value
    write_json(dest, mapping)


def convert_site_appearl_text(src: Path, dest: Path) -> None:
    rows = read_csv_rows(src)
    mapping = OrderedDict()
    for row in rows[1:]:
        if len(row) < 2:
            continue
        key = (row[0] or "").strip()
        value = (row[1] or "").strip()
        if key:
            mapping[key] = value
    write_json(dest, mapping)


def convert_ranking(src: Path, dest: Path) -> None:
    rows = read_csv_rows(src)
    if not rows:
        write_json(dest, [])
        return
    header = [col.strip() for col in rows[0]]
    records = []
    for line in rows[1:]:
        if not any(col.strip() for col in line):
            continue
        record = {}
        for idx, key in enumerate(header):
            value = line[idx].strip() if idx < len(line) else ""
            record[key] = value
        records.append(record)
    write_json(dest, records)


def convert_clinic_texts(src: Path, dest: Path) -> None:
    rows = read_csv_rows(src)
    if not rows:
        write_json(dest, {})
        return

    header = rows[0]
    clinic_names = [name.strip() for name in header[3:] if name.strip()]
    clinics_data = {name: {} for name in clinic_names}
    comparison_headers = {}
    detail_fields = {}

    code_to_name = {
        "ohmyteeth": "Oh my teeth",
        "invisalign": "インビザライン",
        "kireilign": "キレイライン矯正",
        "zenyum": "ゼニュム",
        "wesmile": "ウィスマイル",
    }

    def value_at(row: List[str], index: int) -> str:
        col_idx = index + 3
        return (row[col_idx] if col_idx < len(row) else "").strip()

    detail_map = {
        "費用": "priceDetail",
        "目安期間": "periods",
        "矯正範囲": "ranges",
        "営業時間": "hours",
        "店舗": "stores",
        "特徴タグ": "featureTags",
    }

    for row in rows[1:]:
        if not row or len(row) < 2:
            continue
        list_name = (row[0] or "").strip()
        field_name = (row[1] or "").strip()
        if not list_name or not field_name:
            continue

        if list_name.startswith("comparison"):
            num = list_name.replace("comparison", "").strip()
            comparison_headers[f"比較表ヘッダー{num}"] = field_name
            for idx, clinic in enumerate(clinic_names):
                clinics_data[clinic][field_name] = value_at(row, idx)
        elif list_name.startswith("detail"):
            mapping_key = detail_map.get(field_name, field_name)
            if mapping_key and mapping_key != "特徴タグ":
                detail_fields[mapping_key] = field_name
            for idx, clinic in enumerate(clinic_names):
                clinics_data[clinic][f"詳細_{field_name}"] = value_at(row, idx)
        elif list_name.startswith("tags"):
            for idx, clinic in enumerate(clinic_names):
                clinics_data[clinic][f"詳細_{field_name}"] = value_at(row, idx)
        elif list_name.startswith("meta"):
            for idx, clinic in enumerate(clinic_names):
                clinics_data[clinic][field_name] = value_at(row, idx)
        else:
            if list_name in code_to_name:
                target = code_to_name[list_name]
                if target in clinics_data:
                    clinics_data[target][field_name] = value_at(row, 0)
            else:
                for idx, clinic in enumerate(clinic_names):
                    clinics_data[clinic][field_name] = value_at(row, idx)

    result = OrderedDict()
    result["比較表ヘッダー設定"] = comparison_headers
    result["詳細フィールドマッピング"] = detail_fields
    result["詳細フィールドマッピング"]["officialSite"] = "公式サイトURL"
    for clinic in clinic_names:
        result[clinic] = clinics_data[clinic]

    write_json(dest, result)


def main() -> int:
    if not INPUT_DIR.exists():
        print(f"入力ディレクトリが見つかりません: {INPUT_DIR}", file=sys.stderr)
        return 1

    tasks = [
        ("site-common-texts.csv", convert_site_common_texts, "site-common-texts.json"),
        ("site_appearl_text.csv", convert_site_appearl_text, "site_appearl_text.json"),
        ("出しわけSS - ranking.csv", convert_ranking, "出しわけSS - ranking.json"),
        ("clinic-texts.csv", convert_clinic_texts, "clinic-texts.json"),
    ]

    for filename, handler, output_name in tasks:
        src = INPUT_DIR / filename
        dest = OUTPUT_DIR / output_name
        if not src.exists():
            print(f"⚠️ 変換スキップ: {src} が存在しません", file=sys.stderr)
            continue
        print(f"▶︎ {src.name} → {dest.name}")
        handler(src, dest)

    print("✅ 変換が完了しました")
    return 0


if __name__ == "__main__":
    sys.exit(main())
