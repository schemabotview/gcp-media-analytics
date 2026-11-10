import type { SceneModel } from '@graphlearning/graphl-flow'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { CRM_FILES, startTree } from './tree'
import code from '../../../spine/start/04-an-events-life/project/sources/events/trace.jq?raw'
import session from '../../../spine/start/04-an-events-life/session.txt?raw'

// §3.4 — an event's life (runs locally). One box on EX-LDN-04 watches the derby whole: the trace is
// sun_gen's real events for STB-13795, folded in the terminal to its turning points — the play, the
// title changing at kick-off, the first stall after 18:35, the stop.
const counts = Object.fromEntries(outputOf(session, "awk '{print $2}' trace.txt | sort | uniq -c").split('\n')
  .map((l) => l.trim().split(/\s+/)).map(([n, k]) => [k, n]))
const rows = outputOf(session, 'cat trace.txt').split('\n')
const play = rows[0].split(/\s+/), stop = rows.at(-1)!.split(/\s+/)
const kickoff = rows.find((r) => r.includes('T-5001'))!.split(/\s+/)
const stall = rows.find((r) => r.includes('buffer'))!.split(/\s+/)
const stalled = rows.filter((r) => r.includes(' buffer ')).reduce((ms, r) => ms + Number(r.split(/\s+/)[5]), 0)

export const startEventLife: SceneModel = ideFrame2({
  model: 'TODO',
  tree: startTree('sources/events/trace.jq', [...CRM_FILES, 'sources/epg/slots.py', 'sources/events/trace.jq']),
  editor: { file: 'sources/events/trace.jq', code, lang: 'text' },
  session,
  keep: [['$ jq -rf', '$ cat trace.txt'], kickoff[0], stall[0], rows.at(-1)!.slice(0, 8)],
  side: [
    {
      type: 'group', id: 'life', title: 'STB-13795, derby night', icon: 'screen', tone: 'ingest', children: [
        { type: 'item', id: 'l-play', title: `${play[0]} play`, sub: `SUN-SPORTS-1, the build-up: ${play[2]}`, icon: 'zap' },
        { type: 'item', id: 'l-kickoff', title: `${kickoff[0]} kick-off`, sub: `the heartbeats' title turns ${kickoff[2]}`, icon: 'clock' },
        { type: 'item', id: 'l-beats', title: `heartbeat × ${counts.heartbeat}`, sub: 'one a minute, 60 s watched each', icon: 'activity' },
        { type: 'item', id: 'l-buffer', title: `buffer × ${counts.buffer}`, sub: `from ${stall[0]}: ${(stalled / 1000).toFixed(0)} s stalled, all in the second half`, icon: 'timer', tone: 'consume' },
        { type: 'item', id: 'l-stop', title: `${stop[0]} stop`, sub: 'after the final whistle', icon: 'power' },
      ],
    },
    {
      type: 'table', id: 'fields', title: 'Every event carries', tone: 'store', columns: ['field', 'here'], rows: [
        { id: 'f-device', cells: ['device_id', 'STB-13795, of HH-13795'] },
        { id: 'f-ts', cells: ['event_ts', 'the box’s clock, to the ms'] },
        { id: 'f-type', cells: ['type', 'play · heartbeat · buffer · stop'] },
        { id: 'f-title', cells: ['title_id', `${play[2]}, then ${kickoff[2]}`] },
        { id: 'f-watched', cells: ['watched_s', '60 per heartbeat'] },
        { id: 'f-buffer', cells: ['buffer_ms', 'how long it stalled'], tone: 'consume' },
      ],
    },
  ],
  edges: [
    { from: 'l-play', to: 'l-kickoff' },
    { from: 'l-kickoff', to: 'l-beats' },
    { from: 'l-beats', to: 'l-buffer' },
    { from: 'l-buffer', to: 'l-stop' },
  ],
})
