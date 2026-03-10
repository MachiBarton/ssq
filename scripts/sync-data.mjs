import fs from "node:fs/promises"
import path from "node:path"

import { buildRecommendation } from "./analyze-lotto.mjs"
import { fetchHistoryDataset } from "./fetch-lotto-history.mjs"

const HISTORY_PATH = path.resolve("src/generated/lotto-history.json")
const RECOMMENDATION_PATH = path.resolve("src/generated/lotto-recommendation.json")

async function main() {
  const history = await fetchHistoryDataset()
  await fs.mkdir(path.dirname(HISTORY_PATH), { recursive: true })
  await fs.writeFile(HISTORY_PATH, `${JSON.stringify(history, null, 2)}\n`, "utf8")

  const recommendation = await buildRecommendation()
  await fs.writeFile(RECOMMENDATION_PATH, `${JSON.stringify(recommendation, null, 2)}\n`, "utf8")

  console.log(`history rows: ${history.rows.length}`)
  console.log(`recommendation tickets: ${recommendation.suggestedTickets.length}`)
}

await main()
