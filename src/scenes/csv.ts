// A captured CSV, read by key: a scene quotes a landed row by reading it, never by retyping it.
export function rowOf(csv: string, key: string): Record<string, string> {
  const [head, ...lines] = csv.trim().split('\n')
  const columns = head.split(',')
  const line = lines.find((l) => l.split(',')[0] === key)
  if (!line) throw new Error(`csv.ts: no row ${JSON.stringify(key)}`)
  // TradeBook's values hold no commas or quotes (tradebook_gen), so a split is a parse
  return Object.fromEntries(line.split(',').map((v, i) => [columns[i], v]))
}

export const rowsOf = (csv: string) => csv.trim().split('\n').length - 1

/** 2000000.00 → "2.0m", 2200000.00 → "2.2m": how the desk says an amount. */
export const millions = (amount: string) => `${(Number(amount) / 1e6).toFixed(1)}m`
