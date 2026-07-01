import { fetchSheetRows } from '../src/lib/sheet'

const SHEET_ID = '1ATwP8QTFDa5gimcxHgjDaGge02jCZnmPFs0Ot3g8y9A'
const GID = '1972285551'

const rows = await fetchSheetRows(SHEET_ID, GID)

console.log('total rows parsed:', rows.length)
console.log('with non-empty french:', rows.filter((r) => r.frenchText).length)
console.log('with empty french (should be 0):', rows.filter((r) => !r.frenchText).length)
console.log('with type (B):', rows.filter((r) => r.type !== null).length)
console.log('with example (D):', rows.filter((r) => r.exampleSentence !== null).length)
console.log('with arabic meaning (C):', rows.filter((r) => r.arabicMeaning).length)

// Dedup check: any duplicate frenchText after trim?
const seen = new Set<string>()
const dups: Array<string> = []
for (const r of rows) {
  if (seen.has(r.frenchText)) dups.push(r.frenchText)
  seen.add(r.frenchText)
}
console.log('duplicate french keys in sheet:', dups.length, dups.slice(0, 5))

console.log('\nfirst 3 parsed rows:')
console.log(JSON.stringify(rows.slice(0, 3), null, 2))
console.log('\nlast 2 parsed rows:')
console.log(JSON.stringify(rows.slice(-2), null, 2))
