import type { CostBreakdown, GeneratedTicket, PlayMode, SelectionState, ValidationResult } from "@/types"

const FRONT_MAX = 35
const BACK_MAX = 12
const MAX_AMOUNT = 20000

export const FRONT_NUMBERS = Array.from({ length: FRONT_MAX }, (_, index) => index + 1)
export const BACK_NUMBERS = Array.from({ length: BACK_MAX }, (_, index) => index + 1)

export const DEFAULT_SELECTION: SelectionState = {
  mode: "smart",
  front: [],
  back: [],
  frontDan: [],
  frontTuo: [],
  backDan: [],
  backTuo: [],
  lockedFront: [],
  lockedBack: [],
  additional: false,
  multiplier: 1,
  quickPickCount: 5,
}

export function formatNumber(value: number) {
  return value.toString().padStart(2, "0")
}

export function sortNumbers(values: number[]) {
  return [...values].sort((a, b) => a - b)
}

export function toggleNumber(list: number[], value: number, max?: number) {
  const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  if (max && next.length > max) {
    return sortNumbers(next.slice(1))
  }
  return sortNumbers(next)
}

export function choose(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  const limitedK = Math.min(k, n - k)
  let result = 1
  for (let index = 1; index <= limitedK; index += 1) {
    result = (result * (n - limitedK + index)) / index
  }
  return Math.round(result)
}

export function validateSelection(state: SelectionState): ValidationResult {
  if (state.multiplier < 1 || state.multiplier > 99) {
    return { valid: false, message: "倍数需在 1 到 99 之间。" }
  }

  if (state.mode === "single") {
    if (state.front.length !== 5 || state.back.length !== 2) {
      return { valid: false, message: "单式需要前区 5 个、后区 2 个号码。" }
    }
    return validateAmount(calculateCost(state, 1))
  }

  if (state.mode === "multiple") {
    if (state.front.length < 5 || state.back.length < 2) {
      return { valid: false, message: "复式至少选择前区 5 个、后区 2 个号码。" }
    }
    return validateAmount(calculateCost(state, countBets(state)))
  }

  if (state.mode === "dantuo") {
    if (state.frontDan.length > 4 || state.frontDan.length < 1) {
      return { valid: false, message: "前区胆码需为 1 到 4 个。" }
    }
    if (state.backDan.length > 1) {
      return { valid: false, message: "后区胆码最多 1 个。" }
    }
    if (state.frontDan.some((item) => state.frontTuo.includes(item)) || state.backDan.some((item) => state.backTuo.includes(item))) {
      return { valid: false, message: "胆码和拖码不能重复。" }
    }
    if (state.frontDan.length + state.frontTuo.length < 5 || state.backDan.length + state.backTuo.length < 2) {
      return { valid: false, message: "胆拖号码总数不足以成票。" }
    }
    return validateAmount(calculateCost(state, countBets(state)))
  }

  if (state.lockedFront.length > 5 || state.lockedBack.length > 2) {
    return { valid: false, message: "锁定号码不能超过单式上限。" }
  }
  if (state.quickPickCount < 1 || state.quickPickCount > 20) {
    return { valid: false, message: "智能机选单次可生成 1 到 20 注。" }
  }
  return { valid: true, message: "可生成。" }
}

function validateAmount(cost: CostBreakdown): ValidationResult {
  if (cost.betCount <= 0) {
    return { valid: false, message: "当前选择尚未构成有效投注。" }
  }
  if (cost.amount > MAX_AMOUNT) {
    return { valid: false, message: "单票金额超过 2 万元，请减少号码或倍数。" }
  }
  return { valid: true, message: "可生成。" }
}

export function countBets(state: SelectionState) {
  if (state.mode === "single") {
    return state.front.length === 5 && state.back.length === 2 ? 1 : 0
  }
  if (state.mode === "multiple") {
    return choose(state.front.length, 5) * choose(state.back.length, 2)
  }
  if (state.mode === "dantuo") {
    return choose(state.frontTuo.length, 5 - state.frontDan.length) * choose(state.backTuo.length, 2 - state.backDan.length)
  }
  return state.quickPickCount
}

export function calculateCost(state: SelectionState, betCount: number): CostBreakdown {
  const unitPrice = state.additional ? 3 : 2
  return {
    betCount,
    unitPrice,
    multiplier: state.multiplier,
    amount: betCount * unitPrice * state.multiplier,
    additional: state.additional,
  }
}

function sampleUnique(pool: number[], count: number) {
  const copy = [...pool]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return sortNumbers(copy.slice(0, count))
}

export function generateRandomTicket(config: SelectionState): GeneratedTicket {
  const frontPool = FRONT_NUMBERS.filter((item) => !config.lockedFront.includes(item))
  const backPool = BACK_NUMBERS.filter((item) => !config.lockedBack.includes(item))
  const frontNumbers = sortNumbers([...config.lockedFront, ...sampleUnique(frontPool, 5 - config.lockedFront.length)])
  const backNumbers = sortNumbers([...config.lockedBack, ...sampleUnique(backPool, 2 - config.lockedBack.length)])
  return createSingleTicket(frontNumbers, backNumbers, config.additional, config.multiplier, "智能机选")
}

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

export function createSingleTicket(frontNumbers: number[], backNumbers: number[], additional: boolean, multiplier: number, label: string): GeneratedTicket {
  return {
    id: randomId(),
    sourceMode: "single",
    label,
    frontNumbers: sortNumbers(frontNumbers),
    backNumbers: sortNumbers(backNumbers),
    additional,
    multiplier,
    betCount: 1,
    amount: (additional ? 3 : 2) * multiplier,
    createdAt: new Date().toISOString(),
  }
}

export function createTicketFromSelection(state: SelectionState): GeneratedTicket {
  const betCount = countBets(state)
  const cost = calculateCost(state, betCount)
  const sourceMap: Record<PlayMode, string> = {
    single: "单式",
    multiple: "复式",
    dantuo: "胆拖",
    smart: "智能机选",
  }

  return {
    id: randomId(),
    sourceMode: state.mode,
    label: sourceMap[state.mode],
    frontNumbers: sortNumbers(state.front),
    backNumbers: sortNumbers(state.back),
    frontDan: sortNumbers(state.frontDan),
    frontTuo: sortNumbers(state.frontTuo),
    backDan: sortNumbers(state.backDan),
    backTuo: sortNumbers(state.backTuo),
    additional: state.additional,
    multiplier: state.multiplier,
    betCount,
    amount: cost.amount,
    note: state.mode === "multiple" ? `复式投注，共 ${betCount} 注。` : state.mode === "dantuo" ? `胆拖投注，共 ${betCount} 注。` : undefined,
    createdAt: new Date().toISOString(),
  }
}

export function ticketToText(ticket: GeneratedTicket) {
  const front = ticket.frontNumbers.map(formatNumber).join(" ")
  const back = ticket.backNumbers.map(formatNumber).join(" ")
  if (ticket.sourceMode === "dantuo") {
    const frontDan = ticket.frontDan?.map(formatNumber).join(" ") ?? "-"
    const frontTuo = ticket.frontTuo?.map(formatNumber).join(" ") ?? "-"
    const backDan = ticket.backDan?.map(formatNumber).join(" ") ?? "-"
    const backTuo = ticket.backTuo?.map(formatNumber).join(" ") ?? "-"
    return `${ticket.label} | 前胆 ${frontDan} | 前拖 ${frontTuo} | 后胆 ${backDan} | 后拖 ${backTuo} | ${ticket.additional ? "追加" : "普通"} | ${ticket.multiplier} 倍 | ${ticket.amount} 元`
  }
  return `${ticket.label} | 前区 ${front} | 后区 ${back} | ${ticket.additional ? "追加" : "普通"} | ${ticket.multiplier} 倍 | ${ticket.amount} 元`
}
