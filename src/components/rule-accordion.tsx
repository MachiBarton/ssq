import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function RuleAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="play">
        <AccordionTrigger>玩法摘要</AccordionTrigger>
        <AccordionContent>
          大乐透基础投注为前区 01-35 选 5 个、后区 01-12 选 2 个。支持单式、复式、胆拖、追加与 1-99 倍投注。
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="cost">
        <AccordionTrigger>金额计算</AccordionTrigger>
        <AccordionContent>
          普通投注单注 2 元，追加投注单注 3 元，总金额 = 注数 × 单注金额 × 倍数。单票金额超过 2 万元时不允许生成。
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="prize">
        <AccordionTrigger>奖级说明</AccordionTrigger>
        <AccordionContent>
          一等奖需前区 5 个和后区 2 个全部命中；二等奖为前区 5 个命中且后区命中 1 个；其余奖级按前后区命中数量递减。页面仅展示规则说明，不连接实时奖池奖金。
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
