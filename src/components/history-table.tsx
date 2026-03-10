import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatNumber } from "@/lib/dlt"
import type { LottoHistoryRow } from "@/types"

export function HistoryTable({ rows }: { rows: LottoHistoryRow[] }) {
  return (
    <ScrollArea className="w-full">
      <div className="min-w-[760px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>期号</TableHead>
              <TableHead>开奖日期</TableHead>
              <TableHead>前区</TableHead>
              <TableHead>后区</TableHead>
              <TableHead>销量</TableHead>
              <TableHead>奖池</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.issue}>
                <TableCell className="font-medium">{row.issue}</TableCell>
                <TableCell>{row.openDate}</TableCell>
                <TableCell>{row.frontNumbers.map(formatNumber).join(" ")}</TableCell>
                <TableCell>{row.backNumbers.map(formatNumber).join(" ")}</TableCell>
                <TableCell>{row.sales ?? "-"}</TableCell>
                <TableCell>{row.prizePool ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  )
}
