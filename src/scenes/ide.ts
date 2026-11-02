import type { Code, Edge, Group, SceneModel, SceneNode, Tree, TreeEntry } from '@graphlearning/graphl-flow'
import { SCENE_ASPECT } from '@graphlearning/shell'

// The IDE frame — python-expense-tracker's template by way of aws-ecommerce and azure-trade-finance, ported unchanged in
// shape, so every pane sits at
// the same pixels in every section and a viewer always knows where to look:
//
//   explorer (EXPLORER_W) | editor (EDITOR_W × EDITOR_H)    | side pane (SIDE_W, fixed)
//                         | terminal docked under it (TERMINAL_H)
//
// Every column is a FIXED width, so content wider than its column overflows (check-render fails it)
// instead of moving the frame; heights are floors, with check-content holding the editor and the
// terminal to the rows they fit. graphl-flow's fit is a pure function of the natural box, so equal
// boxes mean equal zoom — check-render asserts every IDE section lands on the same fit.
//
// Sizes as measured in python-expense-tracker (graphl-flow 0.3+, 15px/1.6 Plex Mono, 9.0px advance,
// 24px rows): an 80-column editor is 720 + 49 gutter + 16 padding + 2 border = 787; a code pane's
// chrome (tab bar, body padding, borders) is 51. The terminal is the same 80 columns — the width
// scripts/spine.py wraps every transcript at (COLUMNS), so a wrapped line here is a wrapped line there.

const ROW = 24
const CHROME = 51
export const EXPLORER_W = 280
export const EDITOR_COLS = 80
export const EDITOR_W = 787
export const EDITOR_ROWS = 23
export const EDITOR_H = EDITOR_ROWS * ROW + CHROME
export const SIDE_W = 649
const GAP = 10
export const FRAME_W = EXPLORER_W + EDITOR_W + SIDE_W + 2 * GAP
export const FRAME_H = Math.round(FRAME_W / SCENE_ASPECT)
export const TERMINAL_H = FRAME_H - GAP - EDITOR_H
export const TERMINAL_ROWS = Math.floor((TERMINAL_H - CHROME) / ROW)

export const trim = (text: string) => text.replace(/\n+$/, '')

/**
 * A spine session.txt as terminal rows. graphl-flow draws `$ cmd` as a command and `! text` as an
 * error. The replay writes plain output (already wrapped at 80 columns), so errors are marked here:
 * gcloud's `ERROR: (gcloud.…)` (with the rows it wrapped onto), Terraform's boxed `│ Error:`, psql's
 * `ERROR:` and `DETAIL:`, a Python traceback (its header through the exception line), and the
 * pipeline's own refusals — a gate that FAILs (a `G<n> FAIL:` exit included), a `refused:` write: a
 * guard doing its job is still the red line.
 */
export function terminal(session: string): string {
  const out: string[] = []
  let mode: 'none' | 'cli' | 'python' | 'terraform' = 'none'
  let previous = ''
  // a tab is drawn as one space: the replay wrapped at 80 columns counting it as one
  for (const line of trim(session).replace(/\t/g, ' ').split('\n')) {
    if (line.startsWith('$ ')) mode = 'none'
    else if (line.startsWith('ERROR: ')) mode = 'cli'
    else if (/^(│ )?Error: /.test(line)) mode = 'terraform' // Terraform's boxed error, to its closing ╵
    else if (line === 'Traceback (most recent call last):') mode = 'python'
    // a CLI error is one line, wrapped: it goes on while the row before it filled the pane
    else if (mode === 'cli' && previous.length !== EDITOR_COLS) mode = 'none'
    const refusal = /^(psql:.*ERROR: |DETAIL: |refused: |G[1-4] FAIL)/.test(line) || / FAIL$/.test(line)
    out.push(mode === 'none' && !refusal ? line : `! ${line}`)
    if (mode === 'python' && /^[A-Za-z_][\w.]*(Error|Exception)\b/.test(line)) mode = 'none'
    if (mode === 'terraform' && line.startsWith('╵')) mode = 'none'
    previous = line
  }
  return out.join('\n')
}

/** A line to keep, found by TEXT (the first line containing it, searching on from the last match),
 *  or a [from, to] range of two such lines. */
export type Keep = string | [string, string]

/**
 * The `show` ranges that keep only `keep` of `text`'s lines — every other run folds to one
 * `··· N lines` row. Found by text, never by number: a transcript grows a line when a provider or a
 * CLI does, and a typed number would silently keep the wrong one. A missing text throws (check-render
 * reports it as a page error naming the scene).
 */
export function keepLines(text: string, keep: Keep[]): [number, number][] {
  const lines = trim(text).split('\n')
  let from = 0
  const find = (needle: string) => {
    for (let i = from; i < lines.length; i++) if (lines[i].includes(needle)) return (from = i + 1)
    throw new Error(`ide.ts: no line containing ${JSON.stringify(needle)} after line ${from}`)
  }
  return keep.map((k) => (typeof k === 'string' ? ((n) => [n, n] as [number, number])(find(k)) : [find(k[0]), find(k[1])]))
}

export interface Editor {
  /** The tab label — the file's path in the project. */
  file: string
  /** The file's text, imported from the spine with `?raw`. */
  code: string
  show?: [number, number][]
  highlight?: number[]
  lang?: Code['lang']
}

/** A file's language by its name: Terraform is HCL. */
export function langOf(file: string): Code['lang'] {
  if (file.endsWith('.py')) return 'python'
  if (file.endsWith('.sql')) return 'sql'
  if (file.endsWith('.json')) return 'js'
  if (file.endsWith('.tf') || file.endsWith('.tfvars') || file === '.terraform.lock.hcl') return 'hcl'
  if (file.endsWith('.sh') || file.endsWith('.gitignore')) return 'shell'
  return 'text'
}

export interface IdeFrame {
  tree: TreeEntry[]
  editor: Editor
  /** The step's session.txt, raw. */
  session: string
  /** Which of the session's lines the terminal shows; the rest fold. Default: all of them. */
  keep?: Keep[]
  /** Or the terminal's `show` ranges outright (from `pick`, for a long Terraform transcript). */
  shown?: [number, number][]
  /** The side pane: a diagram (check-content fails a side pane with no edge, plot or table). */
  side: SceneNode[]
  /** Edges between nodes INSIDE the side pane. An edge between panes would widen a gap and move them. */
  edges?: Edge[]
}

// Fixed ids: a section's `focus` can name `editor.L12`, `terminal`, or any id in the side pane.
export const IDE_IDS = { explorer: 'explorer', editor: 'editor', terminal: 'terminal', side: 'side' } as const
export const PROJECT = 'viewing-pulse'

export function ideFrame({ tree, editor, session, keep, shown, side, edges = [] }: IdeFrame): SceneModel {
  const explorer: Tree = { type: 'tree', id: IDE_IDS.explorer, title: PROJECT, entries: tree, fill: true, w: EXPLORER_W }
  const code: Code = {
    type: 'code', id: IDE_IDS.editor, filename: editor.file, lang: editor.lang ?? langOf(editor.file), code: trim(editor.code),
    show: editor.show, highlight: editor.highlight, tone: 'ingest', fill: true, w: EDITOR_W, minH: EDITOR_H,
  }
  const rows = terminal(session)
  const term: Code = {
    type: 'code', id: IDE_IDS.terminal, terminal: true, filename: `terminal — ${PROJECT}`, code: rows,
    show: shown ?? (keep && keepLines(rows, keep)), fill: true, w: EDITOR_W, minH: TERMINAL_H,
  }
  const pane: Group = { type: 'group', id: IDE_IDS.side, bare: true, w: SIDE_W, minH: FRAME_H, children: side }
  return {
    dir: 'row',
    nodes: [explorer, { type: 'group', id: 'workbench', bare: true, children: [code, term] }, pane],
    edges,
  }
}

/** The 1-based number of the first line of `code` containing `text`, searching from line `from`. */
export function lineOf(code: string, text: string, from = 1): number {
  const lines = code.split('\n')
  for (let i = from - 1; i < lines.length; i++) if (lines[i].includes(text)) return i + 1
  throw new Error(`ide.ts: no line containing ${JSON.stringify(text)} from line ${from}`)
}

/** Every line number from the line containing `first` through the next line containing `last`. */
export function linesFrom(code: string, first: string, last = first): number[] {
  const a = lineOf(code, first), b = lineOf(code, last, a)
  return Array.from({ length: b - a + 1 }, (_, i) => a + i)
}

/** The last line number of `code` (ignoring a trailing newline). */
export const lastLine = (code: string) => trim(code).split('\n').length

/** A recorded Terraform run, folded to what a viewer reads: every command, the plan's summary, each
 *  resource as it completes, the result, and every line of a non-Terraform command's output (or
 *  only the lines `also` accepts). Lines are the TERMINAL's (wrapped) rows; a wrapped continuation
 *  of a kept row is kept with it. */
export function pick(session: string, also: (line: string) => boolean = () => true): [number, number][] {
  const rows = terminal(session).split('\n')
  const keep: boolean[] = []
  let tf = false, last = false
  rows.forEach((row, i) => {
    const line = row.replace(/^! /, '')
    if (line.startsWith('$ ')) tf = /^\$ terraform /.test(line)
    const k = line.startsWith('$ ')
      || (tf && /^(Plan: |Apply complete|formatted$|Success! |  # .* (moved|will be (created|updated|destroyed))|.*: (Creation|Modifications|Destruction) complete|Successfully configured|No changes\.)/.test(line))
      || (!tf && !line.startsWith('$ ') && also(line))
      || (row.startsWith('! ') && !tf)
      || (last && i > 0 && rows[i - 1].replace(/^! /, '').length === EDITOR_COLS)
    keep.push(Boolean(k))
    last = Boolean(k)
  })
  const out: [number, number][] = []
  keep.forEach((k, i) => {
    if (!k) return
    if (out.length && out[out.length - 1][1] === i) out[out.length - 1][1] = i + 1
    else out.push([i + 1, i + 1])
  })
  return out
}
