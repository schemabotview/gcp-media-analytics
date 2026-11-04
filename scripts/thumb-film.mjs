#!/usr/bin/env node
// The YouTube thumbnail for the single full-course film (scripts/out/film.mp4).
//
// Ported from azure-trade-finance's scripts/thumb-film.mjs (itself from aws-ecommerce's). Not the
// shell's `graphl-thumb`: that template is a PER-COURSE poster (a scene plus a panel), and a cropped
// 16:9 scene turns to mush at the ~168px the mobile feed actually renders. A film cover needs poster
// grammar — few elements, enormous type, one focal object. Check every change by downscaling to
// 168px, not at 1280.
//
// The card is REAL: every row is cut out of §1.2's session.txt (`python answer/derby.py` over the
// night's raw events), the same output the scenes quote, so the cover cannot promise an answer the
// course does not compute. It is the answer the film opens with, and the one §10.8 reaches. And it
// carries the frame's verification level (COURSE-PLAN, "Verification levels"): §1.2 runs locally,
// so the card says RUNS LOCALLY. §10.8's Gold card is mocked, so it is not the cover's source.

import { mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, isAbsolute } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const repoDir = process.cwd()
const FFMPEG = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'].find(existsSync) ?? 'ffmpeg'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SCALE = 2
const W = 1280 * SCALE
const H = 720 * SCALE

const ANSWER_SESSION = join(repoDir, 'spine', 'intro', '02-two-clocks', 'session.txt')

/**
 * Cut the derby's answer out of §1.2: the live peak, then the next morning's buffering ratio per
 * exchange, EX-LDN-04 first. Every value is parsed, none typed.
 */
function realAnswer() {
  const lines = readFileSync(ANSWER_SESSION, 'utf8').split('\n').map((l) => l.trimEnd())

  const cmdAt = lines.findIndex((l) => /^\$ python answer\/derby\.py/.test(l))
  if (cmdAt < 0) throw new Error(`no "python answer/derby.py" in ${ANSWER_SESSION}`)
  const cmd = lines[cmdAt].replace(/^\$ /, '')

  const live = lines.find((l) => /^live: peak \d+ households at \d\d:\d\d UTC$/.test(l))
  if (!live) throw new Error(`no "live: peak N households at HH:MM UTC" in ${ANSWER_SESSION}`)
  const [, households, at] = live.match(/peak (\d+) households at (\d\d:\d\d)/)

  const morningAt = lines.findIndex((l) => /^next morning:/.test(l))
  if (morningAt < 0) throw new Error(`no "next morning:" line in ${ANSWER_SESSION}`)
  const rows = lines.slice(morningAt + 1)
    .map((l) => l.match(/^\s+(.+?)\s+(\d+\.\d%)$/))
    .filter(Boolean)
    .map(([, exchange, ratio]) => ({ exchange, ratio }))
  if (rows.length < 2) throw new Error(`no exchange rows after "next morning:" in ${ANSWER_SESSION}`)
  const worst = rows[0]
  if (rows.slice(1).some((r) => parseFloat(r.ratio) >= parseFloat(worst.ratio))) {
    throw new Error(`the first exchange (${worst.exchange} ${worst.ratio}) is not the worst`)
  }

  return {
    cmd,
    hero: `${Number(households).toLocaleString('en-GB')} at ${at}`,
    sub: 'households watching the derby, live',
    rows: rows.map((r, i) => ({ cells: [r.exchange, r.ratio], breach: i === 0, focus: false })),
    foot: lines[morningAt].replace(/^next morning: /, 'next morning · '),
  }
}

/**
 * The pipeline's whole map, cropped to the diagram itself, taken LIVE from the app: `[data-id="map"]`
 * is the map group's own box, so no sliver of the side pane and no measured pixel rectangle.
 * §1.3 is the section to take it from: the only frame where every part is built.
 */
async function realMap(page, appBase) {
  await page.goto(`${appBase}?capture=1#/intro`, { waitUntil: 'networkidle2' })
  await page.waitForFunction(() => !!window.__scene, { timeout: 20000 })
  const plan = await page.evaluate(() => window.__scene.plan())
  const sec = plan?.[plan.length - 1]
  if (!sec) throw new Error('course "intro" has no sections')

  await page.goto(`${appBase}?capture=1#/${sec.slug}`, { waitUntil: 'networkidle2' })
  await page.waitForSelector('.gf-scene[data-fit="ready"]', { timeout: 15000 })
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready })
  await sleep(700)

  const node = await page.$('[data-id="map"]')
  if (!node) throw new Error('no [data-id="map"] in the frame — has src/scenes/map.ts changed?')
  const box = await node.boundingBox()
  if (!box || box.width < 200) throw new Error(`the map box is ${JSON.stringify(box)} — not laid out`)
  const b64 = await node.screenshot({ encoding: 'base64' })
  return { uri: `data:image/png;base64,${b64}`, from: sec.id, box }
}

async function openApp() {
  if (process.env.APP_URL) return { url: process.env.APP_URL.replace(/\/?$/, '/'), child: null }
  console.log('Starting dev server …')
  const child = spawn('npm', ['run', 'dev'], { cwd: repoDir, env: process.env })
  const url = await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('dev server did not print a URL within 60s')), 60000)
    child.stdout.on('data', (b) => {
      const m = String(b).match(/https?:\/\/localhost:\d+\/?/)
      if (m) { clearTimeout(to); res(m[0].replace(/\/?$/, '/')) }
    })
    child.on('exit', (code) => rej(new Error(`dev server exited early (code ${code})`)))
  })
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(url)).ok) break } catch {}
    await sleep(250)
  }
  return { url, child }
}

// graphl-flow's own tone palette, its dark row: the card is painted the way the scenes are.
const TONE = {
  ok:     '#37b877', // store — the answer
  breach: '#f0656f', // consume — the exchange that buffered, as the scenes draw it
  dim:    'rgba(255,255,255,.58)',
}

// The accent is --brand (src/theme.css), Google blue; the light theme darkens it to stay legible.
const THEMES = {
  dark:  { badgeInk: '#ffffff', bg: '#0c1118', card: '#141c2a', ink: '#ffffff', accent: '#4285f4',
           head2: '#6ea2f7', rule: 'rgba(255,255,255,.14)',
           glow: 'radial-gradient(118% 110% at 8% 8%, #163566 0%, #0c1118 62%)' },
  navy:  { badgeInk: '#ffffff', bg: '#0f1a2c', card: '#1a2639', ink: '#ffffff', accent: '#4285f4',
           head2: '#8ab4f8', rule: 'rgba(255,255,255,.12)',
           glow: 'radial-gradient(130% 110% at 86% 12%, #1f4f99 0%, #0f1a2c 64%)' },
  light: { badgeInk: '#ffffff', bg: '#f4f6fa', card: '#141c2a', ink: '#0d1220', accent: '#1a73e8',
           head2: '#1a73e8', rule: 'rgba(0,0,0,.12)',
           glow: 'radial-gradient(120% 120% at 10% 8%, #ffffff 0%, #e8edf5 70%)' },
}

/**
 * The cover's mark. See output/thumbnails/README.md and public/vendor/NOTICE-googlecloud-logo.txt.
 *
 *   tile — public/favicon.svg, the GraphL concept tile: the repo's own mark, naming GCP only in
 *          TEXT (nominative use). Needs no one's permission.
 *   gcp  — Google's four-colour cloud, vendored at public/vendor/googlecloud-logo.png: the icon
 *          cloud.google.com serves as its own touch icon. Placed AS SUPPLIED — never recoloured,
 *          re-traced, cropped or re-proportioned: a redrawn "close enough" mark is worse than none.
 */
const MARKS = {
  tile: { file: join(repoDir, 'public', 'favicon.svg'), label: 'viewing-pulse' },
  gcp: { file: join(repoDir, 'public', 'vendor', 'googlecloud-logo.png'), label: 'Google Cloud' },
}

function markSvg(mark) {
  const { file, label } = MARKS[mark]
  if (!existsSync(file)) {
    throw new Error(`--mark ${mark} needs ${file}, which is not there. This script will not draw a\n`
      + `  mark itself — vendor the real file, unaltered, with a NOTICE beside it.`)
  }
  // A raster mark is embedded whole; object-fit keeps its own proportions in the square box.
  if (file.endsWith('.png')) {
    const b64 = readFileSync(file).toString('base64')
    return `<img class="logo" src="data:image/png;base64,${b64}" alt="${label}" style="object-fit:contain">`
  }
  const raw = readFileSync(file, 'utf8')
  const body = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'))
  const vb = raw.match(/viewBox="([^"]+)"/)?.[1]
  if (!vb) throw new Error(`${file} has no viewBox — cannot place it without distorting it`)
  return `<svg class="logo" viewBox="${vb}" role="img" aria-label="${label}"
    xmlns="http://www.w3.org/2000/svg">${body}</svg>`
}

function pageHtml({ answer, map, theme, head1, head2, badge, mark, focus }) {
  const t = THEMES[theme]
  const fontFace = (fam, weight, file) => {
    const b64 = readFileSync(join(repoDir, 'node_modules', '@fontsource', fam, 'files', file)).toString('base64')
    return `@font-face{font-family:'${fam === 'ibm-plex-mono' ? 'IBM Plex Mono' : 'IBM Plex Sans'}';`
      + `font-weight:${weight};font-style:normal;font-display:block;`
      + `src:url(data:font/woff2;base64,${b64}) format('woff2')}`
  }
  const fonts = [
    fontFace('ibm-plex-sans', 700, 'ibm-plex-sans-latin-700-normal.woff2'),
    fontFace('ibm-plex-sans', 600, 'ibm-plex-sans-latin-600-normal.woff2'),
    fontFace('ibm-plex-mono', 600, 'ibm-plex-mono-latin-600-normal.woff2'),
    fontFace('ibm-plex-mono', 400, 'ibm-plex-mono-latin-400-normal.woff2'),
  ].join('')

  const rows = answer
    ? `<div class="rows">${answer.rows.map((r) =>
        `<div class="line${r.breach ? ' line--breach' : ''}${r.focus ? ' line--focus' : ''}">${
          r.cells.map((c, i) => `<span class="c c${i}">${esc(c)}</span>`).join('')}</div>`).join('')}</div>`
    : ''

  return `<style>
  ${fonts}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{background:${t.bg};background-image:${t.glow};
       font-family:'IBM Plex Sans',system-ui,sans-serif;color:${t.ink};
       display:flex;align-items:stretch;gap:${40 * SCALE}px;padding:${46 * SCALE}px ${50 * SCALE}px}

  .left{flex:0 0 auto;max-width:${(map ? 450 : 500) * SCALE}px;display:flex;flex-direction:column;
        justify-content:center}
  .logo{width:${104 * SCALE}px;height:${104 * SCALE}px;display:block;margin-bottom:${18 * SCALE}px;
        align-self:flex-start}
  .h{font-weight:700;line-height:.85;letter-spacing:-.05em;font-size:${118 * SCALE}px;white-space:nowrap}
  .h2{color:${t.head2}}
  .tf{margin-top:${22 * SCALE}px;font-family:'IBM Plex Mono',monospace;font-weight:600;
      font-size:${30 * SCALE}px;color:${theme === 'light' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.62)'};
      white-space:nowrap;letter-spacing:-.01em}
  .badge{align-self:flex-start;margin-top:${22 * SCALE}px;padding:${11 * SCALE}px ${24 * SCALE}px;
         background:${t.accent};border-radius:${12 * SCALE}px;
         font-weight:700;font-size:${34 * SCALE}px;letter-spacing:.06em;color:${t.badgeInk}}

  .card{flex:1;min-width:0;background:${t.card};border:${1 * SCALE}px solid ${t.rule};
        border-radius:${18 * SCALE}px;padding:${26 * SCALE}px ${30 * SCALE}px ${24 * SCALE}px;
        display:flex;flex-direction:column;box-shadow:0 ${22 * SCALE}px ${64 * SCALE}px rgba(0,0,0,.5)}
  .head{display:flex;align-items:center;gap:${14 * SCALE}px;margin-bottom:${16 * SCALE}px}
  .dots{display:flex;gap:${9 * SCALE}px}
  .dots i{width:${13 * SCALE}px;height:${13 * SCALE}px;border-radius:50%}
  .tag{font-family:'IBM Plex Mono',monospace;font-size:${19 * SCALE}px;font-weight:600;
       letter-spacing:.1em;color:rgba(255,255,255,.42)}
  .cmd{font-family:'IBM Plex Mono',monospace;font-size:${22 * SCALE}px;font-weight:400;
       color:rgba(255,255,255,.66);margin-bottom:${12 * SCALE}px;white-space:nowrap}
  .cmd b{color:${TONE.ok};font-weight:400}
  .stat{font-family:'IBM Plex Sans',system-ui,sans-serif;font-weight:700;font-size:${58 * SCALE}px;
        color:${TONE.ok};letter-spacing:-.03em;white-space:nowrap;line-height:1}
  .statsub{font-family:'IBM Plex Mono',monospace;font-size:${23 * SCALE}px;color:${TONE.dim};
           margin-top:${8 * SCALE}px;white-space:nowrap}
  /* The exchange table is TEXTURE at feed size — the hero carries the read — but the whole real table
     is shown, not a chosen few rows of it. */
  .rows{flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;
        gap:${6 * SCALE}px;font-family:'IBM Plex Mono',monospace;font-size:${24 * SCALE}px;
        line-height:1.2;white-space:nowrap}
  .line{color:rgba(255,255,255,.78);font-weight:600;display:flex}
  .line--focus{color:#ffffff}
  .line--focus .c0::before{content:'▸ ';color:${TONE.ok}}
  .line--breach{color:${TONE.breach}}
  .c{display:inline-block}
  .c0{min-width:${250 * SCALE}px}.c1{min-width:${110 * SCALE}px;text-align:right}
  .foot{margin-top:${18 * SCALE}px;white-space:nowrap;font-family:'IBM Plex Mono',monospace;
        font-size:${23 * SCALE}px;color:rgba(255,255,255,.4);letter-spacing:.03em}
  /* The map is ~2.4:1 and the card nearly square: fitted whole it is a thin strip of confetti. So it
     fills the card's HEIGHT, keeps its aspect, and its sides are cut — --focus picks which part
     stays: 0 (the default) keeps a clean left edge, Sun's sources flowing into the lanes; 50 centres
     on the project and cuts labels on both sides; 100 ends on the business. */
  .card--map{padding:0;overflow:hidden}
  .card--map img{width:100%;height:100%;object-fit:cover;object-position:${focus}% 50%}
</style>
<div class="left">
  ${markSvg(mark)}
  <div class="h">${esc(head1)}</div>
  ${head2.split(/\s+/).map((w) => `<div class="h h2">${esc(w)}</div>`).join('')}
  <div class="tf">data engineering</div>
  <div class="badge">${esc(badge)}</div>
</div>
${map ? `<div class="card card--map"><img src="${map.uri}" alt="the pipeline's map"></div>`
: `<div class="card">
  <div class="head">
    <div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
    <div class="tag">VIEWING-PULSE · RUNS LOCALLY</div>
  </div>
  <div class="cmd">$ <b>${esc(answer.cmd)}</b></div>
  <div class="stat">${esc(answer.hero)}</div>
  <div class="statsub">${esc(answer.sub)}</div>
  ${rows}
  <div class="foot">${esc(answer.foot)}</div>
</div>`}`
}

async function main() {
  const argv = process.argv.slice(2)
  const opt = { theme: 'dark', out: 'output/thumbnails/film.png', source: 'answer', mark: 'tile', focus: 0,
                head1: 'LEARN', head2: 'GCP', badge: 'FULL COURSE' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--theme') opt.theme = argv[++i]
    else if (a === '--out') opt.out = argv[++i]
    else if (a === '--head1') opt.head1 = argv[++i]
    else if (a === '--head2') opt.head2 = argv[++i]
    else if (a === '--badge') opt.badge = argv[++i]
    else if (a === '--source') opt.source = argv[++i]
    else if (a === '--mark') opt.mark = argv[++i]
    else if (a === '--focus') opt.focus = +argv[++i]
    else { console.error(`unknown argument: ${a}`); process.exit(2) }
  }
  if (!THEMES[opt.theme]) { console.error(`unknown theme: ${opt.theme} (have: ${Object.keys(THEMES).join(', ')})`); process.exit(2) }
  if (!['answer', 'map'].includes(opt.source)) { console.error(`unknown source: ${opt.source} (have: answer, map)`); process.exit(2) }
  if (!MARKS[opt.mark]) { console.error(`unknown mark: ${opt.mark} (have: ${Object.keys(MARKS).join(', ')})`); process.exit(2) }
  if (!(opt.focus >= 0 && opt.focus <= 100)) { console.error(`--focus is a percentage, 0–100 (got ${opt.focus})`); process.exit(2) }

  const answer = opt.source === 'answer' ? realAnswer() : null
  if (answer) {
    console.log(`Real answer from spine/intro/02-two-clocks: $ ${answer.cmd}`)
    console.log(`  ${answer.hero} — ${answer.sub}`)
    for (const r of answer.rows) console.log(`  ${r.cells.join('  ')}`)
    console.log(`  ${answer.foot}`)
  }

  const requireFromRepo = createRequire(join(repoDir, 'package.json'))
  const { default: puppeteer } = await import(pathToFileURL(requireFromRepo.resolve('puppeteer')).href)

  const browser = await puppeteer.launch({ headless: true,
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, args: [`--window-size=${W},${H}`] })
  // The map source needs the app running; the answer card is pure setContent and never starts one.
  const app = opt.source === 'map' ? await openApp() : { url: null, child: null }
  try {
    const page = await browser.newPage()
    const map = opt.source === 'map' ? await realMap(page, app.url) : null
    if (map) console.log(`Real map from the app: §1.3 ${map.from}, ${Math.round(map.box.width)}×${Math.round(map.box.height)}`)
    await page.setContent(pageHtml({ answer, map, ...opt }), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await sleep(250)

    // A clipped label ships a broken cover, so it fails the build instead.
    const overflow = await page.evaluate(() => {
      const bad = []
      for (const sel of ['.rows', '.card', '.left', 'body']) {
        const el = document.querySelector(sel)
        if (el && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
          bad.push(`${sel} ${el.scrollWidth}x${el.scrollHeight} > ${el.clientWidth}x${el.clientHeight}`)
        }
      }
      for (const el of document.querySelectorAll('.h,.badge,.tf,.cmd,.stat,.statsub,.line,.foot,.tag,.card--map img')) {
        const r = el.getBoundingClientRect()
        const box = el.closest('.card')?.getBoundingClientRect()
        if (r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1 || (box && r.right > box.right + 1)) {
          bad.push(`clipped: "${el.textContent.trim().slice(0, 22)}" right=${Math.round(r.right)} bottom=${Math.round(r.bottom)}`)
        }
      }
      return bad
    })
    if (overflow.length) throw new Error(`layout overflows:\n  ${overflow.join('\n  ')}`)

    const out = isAbsolute(opt.out) ? opt.out : join(repoDir, opt.out)
    mkdirSync(dirname(out), { recursive: true })
    const big = join(tmpdir(), `thumb-film-${Date.now()}.png`)
    await page.screenshot({ path: big })
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', big, '-vf', 'scale=1280:720:flags=lanczos', out])
    rmSync(big, { force: true })
    console.log(`\n✅ ${out}  (${opt.theme}, ${opt.source}, mark ${opt.mark})`)
  } finally {
    await browser.close()
    app.child?.kill('SIGTERM')
  }
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
