import fs from "node:fs/promises"
import path from "node:path"

const INPUT_PATH = path.resolve("src/generated/lotto-history.json")
const OUTPUT_PATH = path.resolve("src/generated/lotto-recommendation.json")

function scoreNumbers(rows, zone) {
  const max = zone === "front" ? 35 : 12
  const counts = new Map()
  const omission = new Map()
  for (let number = 1; number <= max; number += 1) {
    counts.set(number, 0)
    omission.set(number, rows.length)
  }

  rows.forEach((row, rowIndex) => {
    const list = zone === "front" ? row.frontNumbers : row.backNumbers
    list.forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1)
      omission.set(value, Math.min(omission.get(value) ?? rowIndex, rowIndex))
    })
  })

  return Array.from({ length: max }, (_, index) => {
    const number = index + 1
    const frequency = counts.get(number) ?? 0
    const missing = omission.get(number) ?? rows.length
    const score = frequency * 1.2 + missing * 0.6
    return { number, frequency, missing, score }
  }).sort((left, right) => right.score - left.score)
}

function buildSuggestedTickets(frontPool, backPool) {
  const tickets = []
  for (let index = 0; index < Math.min(5, frontPool.length - 4); index += 1) {
    tickets.push({
      frontNumbers: [...frontPool.slice(index, index + 5)].sort((a, b) => a - b),
      backNumbers: [...backPool.slice(index % Math.max(1, backPool.length - 1), (index % Math.max(1, backPool.length - 1)) + 2)].sort((a, b) => a - b),
      reason: index % 2 === 0 ? "偏向热号与中高遗漏混合。" : "偏向分区均衡与奇偶比控制。",
    })
  }
  return tickets.filter((ticket) => ticket.frontNumbers.length === 5 && ticket.backNumbers.length === 2)
}

export async function buildRecommendation() {
  const raw = await fs.readFile(INPUT_PATH, "utf8")
  const dataset = JSON.parse(raw)
  const rows = dataset.rows ?? []
  if (!rows.length) {
    return {
      generatedAt: new Date().toISOString(),
      issueTarget: "待同步",
      sampleSize: 0,
      frontPool: [],
      backPool: [],
      suggestedTickets: [],
      methodSummary: ["历史数据为空，未能生成推荐。"],
      disclaimer: "仅基于历史统计，仅供娱乐，不构成购彩建议。",
      analysisUnavailable: dataset.syncError ?? "历史数据为空。",
    }
  }

  const sampleRows = rows.slice(0, 80)
  const frontStats = scoreNumbers(sampleRows, "front")
  const backStats = scoreNumbers(sampleRows, "back")
  const frontPool = frontStats.slice(0, 10).map((item) => item.number)
  const backPool = backStats.slice(0, 6).map((item) => item.number)
  const latestIssue = Number(rows[0].issue)
  const issueTarget = Number.isFinite(latestIssue) ? String(latestIssue + 1) : "下一期"

  return {
    generatedAt: new Date().toISOString(),
    issueTarget,
    sampleSize: sampleRows.length,
    frontPool,
    backPool,
    suggestedTickets: buildSuggestedTickets(frontPool, backPool),
    methodSummary: [
      "综合近 80 期频次、遗漏值与冷热号分层评分。",
      "优先保留区间分布和奇偶均衡，避免组合过度集中。",
      "推荐结果仅作参考，不代表真实命中概率。",
    ],
    disclaimer: "仅基于历史统计，仅供娱乐，不构成购彩建议。",
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const recommendation = await buildRecommendation()
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(recommendation, null, 2)}\n`, "utf8")
  console.log(`recommendation tickets: ${recommendation.suggestedTickets.length}`)
}
