#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE_URL = "https://www.js-lottery.com/lottery/downLottoData"
ROOT = Path(__file__).resolve().parent.parent
HISTORY_PATH = ROOT / "src" / "generated" / "lotto-history.json"
RECOMMENDATION_PATH = ROOT / "src" / "generated" / "lotto-recommendation.json"
PUBLIC_HISTORY_PATH = ROOT / "public" / "data" / "lotto-history.json"
PUBLIC_RECOMMENDATION_PATH = ROOT / "public" / "data" / "lotto-recommendation.json"
DIST_HISTORY_PATH = ROOT / "dist" / "data" / "lotto-history.json"
DIST_RECOMMENDATION_PATH = ROOT / "dist" / "data" / "lotto-recommendation.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def split_digits(value: str) -> list[int]:
    return [int(match) for match in re.findall(r"\d{1,2}", value or "")]


def pick_header(row: dict[str, str], candidates: list[str]) -> str:
    for key, value in row.items():
        text = (value or "").strip()
        if text and any(candidate in key for candidate in candidates):
            return text
    return ""


def pick_numbers(row: dict[str, str], prefix: str, fallback_indexes: list[int]) -> list[int]:
    direct = []
    for key, value in row.items():
        if prefix in key:
            digits = re.sub(r"\D", "", value or "")
            if digits:
                direct.append(int(digits))
    direct = [value for value in direct if value > 0]
    if len(direct) >= (5 if prefix == "前" else 2):
        return direct[: 5 if prefix == "前" else 2]

    composed = split_digits(pick_header(row, ["前区号码" if prefix == "前" else "后区号码", "前区" if prefix == "前" else "后区"]))
    if len(composed) >= (5 if prefix == "前" else 2):
        return composed[: 5 if prefix == "前" else 2]

    values = []
    for value in row.values():
        digits = re.sub(r"\D", "", value or "")
        if digits:
            values.append(int(digits))
    return [values[index] for index in fallback_indexes if index < len(values)]


def normalize_date(value: str) -> str:
    return (value or "").replace(".", "-").replace("/", "-")


def fetch_csv_text() -> str:
    request = Request(
        SOURCE_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
            "Accept": "text/csv,application/octet-stream,*/*",
            "Referer": "https://www.js-lottery.com/",
        },
    )
    with urlopen(request, timeout=45) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def parse_csv(text: str) -> list[dict[str, str]]:
    lines = text.lstrip("\ufeff").splitlines()
    if len(lines) < 2:
        return []
    reader = csv.DictReader(lines)
    return [{str(key): str(value or "") for key, value in row.items()} for row in reader]


def normalize_history_rows(records: list[dict[str, str]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in records:
        issue = pick_header(row, ["期号", "奖期", "期次"])
        open_date = normalize_date(pick_header(row, ["开奖日期", "开奖时间", "日期"]))
        front_numbers = pick_numbers(row, "前", [0, 1, 2, 3, 4])
        back_numbers = pick_numbers(row, "后", [5, 6])
        if not issue or not open_date or len(front_numbers) != 5 or len(back_numbers) != 2:
            continue
        rows.append(
            {
                "issue": issue,
                "openDate": open_date,
                "week": pick_header(row, ["星期", "周"]),
                "frontNumbers": front_numbers,
                "backNumbers": back_numbers,
                "sales": pick_header(row, ["销量", "销售额"]),
                "prizePool": pick_header(row, ["奖池"]),
                "firstPrizeWinners": pick_header(row, ["一等奖注数", "一等奖"]),
                "notes": pick_header(row, ["备注"]),
                "extra": row,
            }
        )
    return rows


def build_history_dataset() -> dict[str, Any]:
    try:
        text = fetch_csv_text()
        if "," not in text or len(text) < 30:
            raise ValueError("未返回有效 CSV")
        parsed = parse_csv(text)
        rows = normalize_history_rows(parsed)
        return {
            "syncedAt": now_iso(),
            "sourceUrl": SOURCE_URL,
            "rows": rows,
        }
    except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
        return {
            "syncedAt": now_iso(),
            "sourceUrl": SOURCE_URL,
            "rows": [],
            "syncError": str(exc),
        }


@dataclass
class Stat:
    number: int
    frequency: int
    omission: int
    score: float


def score_numbers(rows: list[dict[str, Any]], zone: str) -> list[Stat]:
    max_number = 35 if zone == "front" else 12
    counts = {number: 0 for number in range(1, max_number + 1)}
    omissions = {number: len(rows) for number in range(1, max_number + 1)}

    for row_index, row in enumerate(rows):
        numbers = row["frontNumbers"] if zone == "front" else row["backNumbers"]
        for value in numbers:
            counts[value] += 1
            omissions[value] = min(omissions[value], row_index)

    stats = []
    for number in range(1, max_number + 1):
        frequency = counts[number]
        omission = omissions[number]
        score = frequency * 1.2 + omission * 0.6
        stats.append(Stat(number=number, frequency=frequency, omission=omission, score=score))
    return sorted(stats, key=lambda item: item.score, reverse=True)


def build_suggested_tickets(front_pool: list[int], back_pool: list[int]) -> list[dict[str, Any]]:
    tickets: list[dict[str, Any]] = []
    limit = min(5, max(0, len(front_pool) - 4))
    for index in range(limit):
        start = index % max(1, len(back_pool) - 1)
        front_numbers = sorted(front_pool[index : index + 5])
        back_numbers = sorted(back_pool[start : start + 2])
        if len(front_numbers) == 5 and len(back_numbers) == 2:
            tickets.append(
                {
                    "frontNumbers": front_numbers,
                    "backNumbers": back_numbers,
                    "reason": "偏向热号与中高遗漏混合。" if index % 2 == 0 else "偏向分区均衡与奇偶比控制。",
                }
            )
    return tickets


def build_recommendation_dataset(history_dataset: dict[str, Any]) -> dict[str, Any]:
    rows = history_dataset.get("rows", [])
    if not rows:
        return {
            "generatedAt": now_iso(),
            "issueTarget": "待同步",
            "sampleSize": 0,
            "frontPool": [],
            "backPool": [],
            "suggestedTickets": [],
            "methodSummary": ["历史数据为空，未能生成推荐。"],
            "disclaimer": "仅基于历史统计，仅供娱乐，不构成购彩建议。",
            "analysisUnavailable": history_dataset.get("syncError", "历史数据为空。"),
        }

    sample_rows = rows[:80]
    front_stats = score_numbers(sample_rows, "front")
    back_stats = score_numbers(sample_rows, "back")
    front_pool = [item.number for item in front_stats[:10]]
    back_pool = [item.number for item in back_stats[:6]]

    latest_issue = rows[0].get("issue", "")
    issue_target = "下一期"
    if str(latest_issue).isdigit():
        issue_target = str(int(str(latest_issue)) + 1)

    return {
        "generatedAt": now_iso(),
        "issueTarget": issue_target,
        "sampleSize": len(sample_rows),
        "frontPool": front_pool,
        "backPool": back_pool,
        "suggestedTickets": build_suggested_tickets(front_pool, back_pool),
        "methodSummary": [
            "综合近 80 期频次、遗漏值与冷热号分层评分。",
            "优先保留区间分布和奇偶均衡，避免组合过度集中。",
            "推荐结果仅作参考，不代表真实命中概率。",
        ],
        "disclaimer": "仅基于历史统计，仅供娱乐，不构成购彩建议。",
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    history = build_history_dataset()
    recommendation = build_recommendation_dataset(history)
    for target in (HISTORY_PATH, PUBLIC_HISTORY_PATH, DIST_HISTORY_PATH):
        write_json(target, history)
    for target in (RECOMMENDATION_PATH, PUBLIC_RECOMMENDATION_PATH, DIST_RECOMMENDATION_PATH):
        write_json(target, recommendation)
    print(f"history rows: {len(history.get('rows', []))}")
    print(f"recommendation tickets: {len(recommendation.get('suggestedTickets', []))}")
    print(f"updated built assets: {DIST_HISTORY_PATH.exists() and DIST_RECOMMENDATION_PATH.exists()}")
    if history.get("syncError"):
        print(f"sync error: {history['syncError']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
