import type { SceneModel } from '@graphlearning/graphl-flow'
import { lineOf } from '../ide'
import { ideFrame2 } from '../frame'
import { outputOf } from '../lab'
import { CRM_FILES, startTree } from './tree'
import code from '../../../spine/start/03-catalogue-epg/project/sources/epg/slots.py?raw'
import session from '../../../spine/start/03-catalogue-epg/session.txt?raw'

// §3.3 — the catalogue and the EPG (runs locally). slots.py joins the guide's slots to the
// catalogue's titles; SUN-SPORTS-1 holds the derby, SUN-MOVIES-2 has an evening the feed never sent
// (G3, §8.9). Every slot in the side pane is read from the replay.
const slots = (out: string) => out.split('\n').filter(Boolean).map((l) => {
  const [when, ...rest] = l.split('  ')
  return { when, id: rest[0], title: rest.slice(1).join('  ') }
})
const sports = slots(outputOf(session, 'python sources/epg/slots.py SUN-SPORTS-1 --from 16:00 --to 22:00'))
const movies = slots(outputOf(session, 'python sources/epg/slots.py SUN-MOVIES-2 --from 16:00 --to 22:00'))
const derby = sports.find((s) => s.id === 'T-5001')!
const gap = movies.find((s) => s.id === 'no slot in the EPG')!

export const startCatalogueEpg: SceneModel = ideFrame2({
  model: 'TODO',
  tree: startTree('sources/epg/slots.py', [...CRM_FILES, 'sources/epg/slots.py']),
  editor: { file: 'sources/epg/slots.py', code, show: [[1, lineOf(code, '"""', 2)], [lineOf(code, 'with open("data/catalogue'), lineOf(code, 'no slot in the EPG")')]], highlight: [lineOf(code, 'titles = {'), lineOf(code, 'print(f"{hhmm(s'), lineOf(code, 'if after and'), lineOf(code, 'no slot in the EPG")')] },
  session,
  side: [
    {
      type: 'group', id: 'join', title: 'Channel × slot → title', icon: 'workflow', tone: 'ingest', dir: 'grid', cols: 2, children: [
        { type: 'item', id: 'j-derby-slot', title: 'SUN-SPORTS-1', sub: `${derby.when} · a slot`, icon: 'clock' },
        { type: 'item', id: 'j-derby', title: derby.title, sub: `${derby.id} · the catalogue`, icon: 'file', tone: 'store' },
        { type: 'item', id: 'j-film-slot', title: 'SUN-MOVIES-2', sub: `${movies[1].when} · a slot`, icon: 'clock' },
        { type: 'item', id: 'j-film', title: movies[1].title, sub: `${movies[1].id} · the catalogue`, icon: 'file', tone: 'store' },
        { type: 'item', id: 'j-gap-slot', title: 'SUN-MOVIES-2', sub: `${gap.when} · no slot sent`, icon: 'clock', tone: 'consume' },
        { type: 'item', id: 'j-gap', title: 'unknown', sub: 'the boxes showed a film; the guide cannot say which', icon: 'search', tone: 'consume' },
      ],
    },
    {
      type: 'table', id: 'sports', title: 'SUN-SPORTS-1, the evening', tone: 'store', columns: ['slot', 'title_id', 'title'],
      rows: sports.map((s) => ({ id: `s-${s.when}`, cells: [s.when, s.id, s.title], tone: s.id === 'T-5001' ? 'ingest' as const : undefined })),
    },
    {
      type: 'table', id: 'movies', title: 'SUN-MOVIES-2, the evening', tone: 'consume', columns: ['slot', 'title_id', 'title'],
      rows: movies.map((s) => ({ id: `m-${s.when}`, cells: s.title ? [s.when, s.id, s.title] : [s.when, '—', s.id], tone: s.title ? undefined : 'consume' as const })),
    },
  ],
  edges: [
    { from: 'j-derby-slot', to: 'j-derby' },
    { from: 'j-film-slot', to: 'j-film' },
    { from: 'j-gap-slot', to: 'j-gap', dashed: true },
  ],
})
