"""Assert every planted fact (COURSE-PLAN.md, "The data" and "Facts") is really in the data.

A lesson is built on each of these; a generator change that loses one fails here, not on screen.
"""
from __future__ import annotations

from collections import Counter

from .model import (BUSINESS_DATE, CHANNELS, CHARGES_30, CHARGES_31, DERBY, DERBY_UPGRADES, EPG_GAP, EXCHANGES,
                    HOUSEHOLDS, LAST_GOOD, RERATE_AT, RERATED, SEED_CUTOFF, UPGRADED, UPGRADED_ON, WINDOW_END, build)


def verify() -> int:
    w = build()
    ok: list[str] = []
    problems: list[str] = []

    def check(cond: bool, good: str, bad: str) -> None:
        (ok if cond else problems).append(good if cond else bad)

    ids = [h.household_id for h in w.households]
    check(len(set(ids)) == HOUSEHOLDS and ids[0] == 'HH-10001' and ids[-1] == f'HH-{10000 + HOUSEHOLDS}',
          f'{HOUSEHOLDS} households, {ids[0]} … {ids[-1]}', f'{len(set(ids))} households, not {HOUSEHOLDS}')
    used = {h.exchange_id for h in w.households}
    check(len(EXCHANGES) == 12 and used == {e for e, _ in EXCHANGES}, '12 exchanges, every one with households',
          f'exchanges in use: {sorted(used)}')
    check(all('@mail.example' in h.email and h.phone.startswith('07700 900') for h in w.households),
          'every household has an email (@mail.example) and a phone (Ofcom drama range): personal data for 12.1',
          'an email or phone outside the reserved ranges')

    mine = sorted((s for s in w.subscriptions if s.household_id == UPGRADED), key=lambda s: s.valid_from)
    check([(s.package_id, s.valid_to) for s in mine] == [('P-ENT', UPGRADED_ON), ('P-SPT', None)],
          f'{UPGRADED}: Entertainment until {UPGRADED_ON}, then Sports (SCD2, §8.8)',
          f'{UPGRADED} versions are {[(s.package_id, s.valid_to) for s in mine]}')
    current = Counter(s.household_id for s in w.subscriptions if s.valid_to is None)
    check(len(current) == HOUSEHOLDS and max(current.values()) == 1, 'one current subscription per household',
          'a household without exactly one current subscription')
    day = [s for s in w.subscriptions if s.valid_from == BUSINESS_DATE]
    check(len(day) == DERBY_UPGRADES and all(s.package_id == 'P-SPT' for s in day),
          f'derby day: {DERBY_UPGRADES} households buy Sports', f'{len(day)} derby-day upgrades, not {DERBY_UPGRADES}')

    in_window = lambda c, a, b: a < c.updated_at <= b
    n30 = sum(in_window(c, LAST_GOOD, SEED_CUTOFF) for c in w.charges)
    n31 = sum(in_window(c, SEED_CUTOFF, WINDOW_END) for c in w.charges)
    check(n30 == CHARGES_30, f'billing dt=2026-10-30: {n30} charges in the window', f'dt=2026-10-30 holds {n30}, not {CHARGES_30}')
    check(n31 == CHARGES_31, f'billing dt=2026-10-31: {n31} charges in the window', f'dt=2026-10-31 holds {n31}, not {CHARGES_31}')
    rr = [c for c in w.charges if c.charge_id in w.rerated]
    check(len(rr) == RERATED and all(c.kind == 'rental' and SEED_CUTOFF < c.updated_at <= WINDOW_END for c in rr)
          and RERATE_AT > WINDOW_END,
          f'§5.5 race: {", ".join(w.rerated)} are the night\'s rentals, re-rated at {RERATE_AT:%H:%M:%S} after the window: '
          f'the copy finds {CHARGES_31 - RERATED} of {CHARGES_31}',
          'the re-rated charges are not three rentals inside dt=2026-10-31\'s window')

    slots = {}
    for s in w.epg:
        slots.setdefault(s['channel'], []).append(s)
    derby = [s for s in w.epg if s['title_id'] == DERBY[0]]
    check(len(derby) == 1 and (derby[0]['channel'], derby[0]['start'], derby[0]['end']) == DERBY[2:],
          f'the derby: {DERBY[0]} on {DERBY[2]}, {DERBY[3]:%H:%M}–{DERBY[4]:%H:%M}', f'the derby slot is {derby}')
    gaps = [(ch, a['end'], b['start']) for ch in CHANNELS for a, b in zip(slots[ch], slots[ch][1:]) if a['end'] != b['start']]
    check(gaps == [EPG_GAP], f'one EPG gap: {EPG_GAP[0]} {EPG_GAP[1]:%H:%M}–{EPG_GAP[2]:%H:%M} (G3, §8.9)',
          f'EPG gaps are {gaps}')
    check({s['title_id'] for s in w.epg} <= {t['title_id'] for t in w.titles}, 'every EPG title is in the catalogue',
          'an EPG title missing from the catalogue')

    # ── derby day as the boxes saw it (sun_gen.events) ──────────────────────────────────────────
    from collections import defaultdict
    from .__main__ import happened
    from .events import (BAD_EXCHANGE, DERBY_PEAK, PEAK_MINUTE, SECOND_HALF, TRACED, VIEWING_EVENTS)
    events, tele, _ = happened()
    check(len(events) == VIEWING_EVENTS, f'{len(events)} viewing events', f'{len(events)} viewing events, not {VIEWING_EVENTS}')
    derby = [e for e in events if e['title_id'] == DERBY[0]]
    share = len(derby) / len(events)
    check(0.57 <= share <= 0.63, f'the derby is {share:.0%} of the day\'s events (a Spark straggler, §9.5)', f'the derby is {share:.0%}')
    present = defaultdict(set)
    for e in derby:
        present[e['event_ts'][:16]].add(e['household_id'])
    top = sorted(((len(v), k) for k, v in present.items()), reverse=True)
    peak = f'{PEAK_MINUTE:%Y-%m-%dT%H:%M}'
    check(top[0] == (DERBY_PEAK, peak) and top[1][0] < DERBY_PEAK, f'derby peak: {DERBY_PEAK} households at {peak[11:]}, no other minute',
          f'the derby peaks at {top[:2]}')
    ex = {h.household_id: h.exchange_id for h in w.households}
    watched, buffered = defaultdict(int), defaultdict(int)
    for e in derby:
        watched[ex[e['household_id']]] += e['watched_s']
        buffered[ex[e['household_id']]] += e['buffer_ms']
    ratio = {k: buffered[k] / 1000 / watched[k] for k in watched}
    others = [k for k in watched if k != BAD_EXCHANGE]
    rest = sum(buffered[k] for k in others) / 1000 / sum(watched[k] for k in others)
    check(f'{ratio[BAD_EXCHANGE]:.1%}' == '4.1%' and f'{rest:.1%}' == '0.6%' and all(f'{ratio[k]:.1%}' == '0.6%' for k in others),
          f'buffering ratio: {BAD_EXCHANGE} {ratio[BAD_EXCHANGE]:.1%}, every other exchange {rest:.1%}',
          f'buffering ratios are {sorted((k, round(v * 100, 2)) for k, v in ratio.items())}')
    extra = [e for e in derby if e['type'] == 'buffer' and ex[e['household_id']] == BAD_EXCHANGE and e['event_ts'] < f'{SECOND_HALF:%Y-%m-%dT%H:%M}']
    bad_first = sum(e['buffer_ms'] for e in extra) / 1000 / watched[BAD_EXCHANGE]
    check(bad_first < 0.006, f'{BAD_EXCHANGE}\'s first half buffers at the baseline ({bad_first:.1%} of the match)', f'{BAD_EXCHANGE} buffers {bad_first:.1%} before the second half')
    slow = [t for t in tele if t['exchange_id'] == BAD_EXCHANGE and t['latency_ms'] > 40]
    check(slow and min(t['minute'] for t in slow) == f'{SECOND_HALF:%Y-%m-%dT%H:%MZ}' and max(t['minute'] for t in slow) < f'{DERBY[4]:%Y-%m-%dT%H:%MZ}',
          f'telemetry: {BAD_EXCHANGE}\'s latency climbs {SECOND_HALF:%H:%M}–{DERBY[4]:%H:%M}, nowhere else', 'telemetry\'s bad minutes are wrong')
    gap = [e for e in events if e['channel'] == EPG_GAP[0] and f'{EPG_GAP[1]:%Y-%m-%dT%H:%M}' <= e['event_ts'] < f'{EPG_GAP[2]:%Y-%m-%dT%H:%M}']
    check(gap and {e['title_id'] for e in gap} <= {t['title_id'] for t in w.titles},
          f'{len(gap)} events in the EPG gap carry a real title (an inner join to the EPG loses them, §8.9)', 'no viewing in the EPG gap')
    traced = [e for e in events if e['device_id'] == TRACED and e['channel'] == DERBY[2] and e['event_ts'] >= '2026-10-31T17']
    stalls = [e for e in traced if e['type'] == 'buffer']
    check([e['type'] for e in traced][0] == 'play' and traced[-1]['type'] == 'stop' and stalls
          and min(e['event_ts'] for e in stalls) >= f'{SECOND_HALF:%Y-%m-%dT%H:%M}',
          f'§3.4: {TRACED} plays the derby whole, {len(stalls)} stalls, all in the second half', f'{TRACED} is not §3.4\'s session')

    for line in ok:
        print(f'✓ {line}')
    for line in problems:
        print(f'✗ {line}')
    print(f"{'✗' if problems else '✓'} {len(ok)} planted fact(s) hold, {len(problems)} problem(s)")
    return 1 if problems else 0
