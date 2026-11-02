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

    for line in ok:
        print(f'✓ {line}')
    for line in problems:
        print(f'✗ {line}')
    print(f"{'✗' if problems else '✓'} {len(ok)} planted fact(s) hold, {len(problems)} problem(s)")
    return 1 if problems else 0
