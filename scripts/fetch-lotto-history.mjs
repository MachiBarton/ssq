import fs from "node:fs/promises"
import path from "node:path"

const SOURCE_URL = "https://www.js-lottery.com/lottery/downLottoData"
const OUTPUT_PATH = path.resolve("src/generated/lotto-history.json")

function splitCsvLine(line) {
  const cells = []
  let current = ""
  let inQuotes = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\""
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? ""
      return record
    }, {})
  })
}

function normalizeDate(value) {
  return value?.replaceAll(".", "-").replaceAll("/", "-") ?? ""
}

function numberListFromField(value) {
  const matches = (value ?? "").match(/\d{1,2}/g) ?? []
  return matches.map((item) => Number(item)).filter((item) => Number.isFinite(item))
}

function pickHeader(row, candidates) {
  const entries = Object.entries(row)
  for (const [key, value] of entries) {
    if (candidates.some((candidate) => key.includes(candidate)) && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ""
}

function pickNumbers(row, prefix, fallbackIndexes) {
  const splitFields = Object.entries(row)
    .filter(([key]) => key.includes(prefix))
    .map(([, value]) => Number(String(value).replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (splitFields.length) return splitFields.slice(0, prefix === "前" ? 5 : 2)

  const composite = numberListFromField(pickHeader(row, [prefix === "前" ? "前区号码" : "后区号码", prefix === "前" ? "前区" : "后区"]))
  if (composite.length) return composite.slice(0, prefix === "前" ? 5 : 2)

  const values = Object.values(row)
    .map((value) => Number(String(value).replace(/\D/g, "")))
    .filter((value) => Number.isFinite(value))

  return fallbackIndexes.map((index) => values[index]).filter((value) => Number.isFinite(value))
}

export function normalizeHistoryRows(records) {
  return records
    .map((row) => {
      const issue = pickHeader(row, ["期号", "奖期", "期次"])
      const openDate = normalizeDate(pickHeader(row, ["开奖日期", "开奖时间", "日期"]))
      const frontNumbers = pickNumbers(row, "前", [0, 1, 2, 3, 4])
      const backNumbers = pickNumbers(row, "后", [5, 6])
      if (!issue || !openDate || frontNumbers.length !== 5 || backNumbers.length !== 2) {
        return null
      }
      return {
        issue,
        openDate,
        week: pickHeader(row, ["星期", "周"]),
        frontNumbers,
        backNumbers,
        sales: pickHeader(row, ["销量", "销售额"]),
        prizePool: pickHeader(row, ["奖池"]),
        firstPrizeWinners: pickHeader(row, ["一等奖注数", "一等奖"]),
        notes: pickHeader(row, ["备注"]),
        extra: row,
      }
    })
    .filter(Boolean)
}

export async function fetchHistoryDataset() {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        accept: "text/csv,application/octet-stream,*/*",
        referer: "https://www.js-lottery.com/",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()
    if (!text.includes(",") || text.length < 30) {
      throw new Error("未返回有效 CSV")
    }

    const parsed = parseCsv(text)
    const rows = normalizeHistoryRows(parsed)
    return {
      syncedAt: new Date().toISOString(),
      sourceUrl: SOURCE_URL,
      rows,
    }
  } catch (error) {
    return {
      syncedAt: new Date().toISOString(),
      sourceUrl: SOURCE_URL,
      rows: [],
      syncError: error instanceof Error ? error.message : "未知错误",
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dataset = await fetchHistoryDataset()
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, "utf8")
  console.log(`history rows: ${dataset.rows.length}`)
}
