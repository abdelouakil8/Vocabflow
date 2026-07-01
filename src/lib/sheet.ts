import Papa from 'papaparse'

/** One parsed vocabulary row from the Google Sheet (columns A/B/C/D, positional). */
export interface SheetRow {
  frenchText: string
  type: string | null
  arabicMeaning: string
  exampleSentence: string | null
  /** Approximate 1-based line in the fetched CSV (informational). */
  sourceRow: number
}

function buildCsvUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
}

/**
 * Fetch a public Google Sheet as CSV (gviz endpoint — 200, no redirect, charset=utf-8)
 * and parse it positionally: A=frenchText, B=type, C=arabicMeaning, D=exampleSentence.
 *
 * Resilient to: trailing empty/whitespace rows, gviz column padding, missing optional
 * cells, embedded commas/newlines, and Arabic UTF-8. Rows with no French text are skipped.
 */
export async function fetchSheetRows(
  sheetId: string,
  gid: string,
): Promise<Array<SheetRow>> {
  const url = buildCsvUrl(sheetId, gid)

  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(`Google Sheet fetch failed: HTTP ${res.status}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('csv')) {
    // A public sheet returns text/csv; an HTML login page means it isn't shared publicly.
    throw new Error(
      'Expected CSV from Google Sheet. Make sure it is shared as "Anyone with the link – Viewer".',
    )
  }

  // Force UTF-8 decode so Arabic is preserved regardless of header quirks.
  const buffer = await res.arrayBuffer()
  const csv = new TextDecoder('utf-8').decode(buffer)

  const parsed = Papa.parse<Array<string>>(csv, {
    header: false,
    skipEmptyLines: 'greedy',
  })

  const rows = parsed.data
  const result: Array<SheetRow> = []

  // Row 0 is the header; data starts at index 1.
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const frenchText = (row[0] ?? '').trim()
    if (!frenchText) continue // no key → skip, don't fail

    const type = (row[1] ?? '').trim() || null
    const arabicMeaning = (row[2] ?? '').trim()
    const exampleSentence = (row[3] ?? '').trim() || null

    result.push({
      frenchText,
      type,
      arabicMeaning,
      exampleSentence,
      sourceRow: i + 1,
    })
  }

  return result
}
