"""Derby day as the boxes and the network saw it: viewing events and network telemetry.

Built from the same households (model.build) with their OWN random streams, so adding a fault here
never moves a CRM or billing value, and each concern below never moves another's:

  viewing   every device's sessions on 31 October: `play`, a `heartbeat` each minute it plays,
            `buffer` when it stalls, `stop`. The derby audience is constructed, not sampled, so
            its facts are exact: DERBY_PEAK households at PEAK_MINUTE, and nowhere else; buffering
            per exchange at BUFFER_RATIO, EX-LDN-04's extra all in the second half.
  telemetry each exchange, each minute: lines active, throughput, latency, packet loss.

What the stream DELIVERS — duplicates, boxes with slow clocks, a poison message — is the producer's
business (Course 6), planted there, not here: these files are what really happened.
"""
from __future__ import annotations

import random
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta

from .model import BUSINESS_DATE, CHANNELS, DERBY, EPG_GAP, EXCHANGES, SEED, UTC, World

DERBY_PEAK = 2140                          # households watching the derby at PEAK_MINUTE
PEAK_MINUTE = datetime(2026, 10, 31, 18, 41, tzinfo=UTC)
HALF_TIME = (datetime(2026, 10, 31, 18, 17, tzinfo=UTC), datetime(2026, 10, 31, 18, 33, tzinfo=UTC))
SECOND_HALF = datetime(2026, 10, 31, 18, 35, tzinfo=UTC)
BAD_EXCHANGE = 'EX-LDN-04'
BUFFER_RATIO = {'bad': 0.041, 'else': 0.006}   # buffering seconds / watched seconds, derby only
APP_SHARE = 0.4                            # households that also watch on the app
TRACED = 'STB-13795'                       # §3.4's box: EX-LDN-04, clean first half, stalls after 18:35
VIEWING_EVENTS = 400956                    # frozen when verify first passed
OTHER_SESSIONS = 3000                      # every non-derby viewing session of the day
DAY = datetime(BUSINESS_DATE.year, BUSINESS_DATE.month, BUSINESS_DATE.day, tzinfo=UTC)


@dataclass
class Session:
    device_id: str
    household_id: str
    platform: str
    channel: str | None        # None: an on-demand title
    title_id: str | None       # on demand: the title; live: from the schedule, minute by minute
    start: datetime
    end: datetime


def stream(name: str) -> random.Random:
    return random.Random(f'{SEED}-{name}')


def devices(w: World) -> dict[str, list[tuple[str, str]]]:
    """Every household's devices: its set-top box, and for some an app."""
    rng = stream('devices')
    out = {}
    for h in w.households:
        n = h.household_id[3:]
        ds = [(f'STB-{n}', 'settop')]
        if rng.random() < APP_SHARE:
            ds.append((f'APP-{n}', rng.choice(['app-ios', 'app-android', 'web'])))
        out[h.household_id] = ds
    return out


def at(minute: datetime, rng: random.Random) -> datetime:
    return minute + timedelta(seconds=rng.randrange(60), milliseconds=rng.randrange(1000))


def derby_sessions(w: World, devs: dict) -> list[Session]:
    """DERBY_PEAK households, every one present at PEAK_MINUTE. Presence in a minute = an event in
    it; a session's events are a minute apart, so a household is present from its play's minute to
    its stop's. Exactly one arrives in PEAK_MINUTE and one leaves in it: the minute before and the
    minute after each lack one household. A share leave at half-time and are back before it."""
    rng = stream('derby')
    _, _, channel, kickoff, final = DERBY
    hh = sorted(rng.sample([h.household_id for h in w.households], DERBY_PEAK))
    last_in, last_out = hh[rng.randrange(len(hh))], None
    while last_out in (None, last_in):
        last_out = hh[rng.randrange(len(hh))]
    out = []
    for hid in hh:
        ds = devs[hid]
        dev, plat = ds[1] if len(ds) > 1 and rng.random() < 0.3 else ds[0]
        if hid == last_in:
            start = at(PEAK_MINUTE, rng)
        else:
            m = int(min(max(rng.gauss(-8, 9), -25), 50))  # minutes after kick-off, most around it
            start = at(kickoff + timedelta(minutes=m), rng)
        if hid == last_out:
            end = at(PEAK_MINUTE, rng)
            start = min(start, PEAK_MINUTE)
        else:
            m = int(min(max(rng.gauss(2, 6), -40), 25)) if rng.random() < 0.85 else -rng.randrange(1, 40)
            end = at(max(final + timedelta(minutes=m), PEAK_MINUTE + timedelta(minutes=1)), rng)
        if start >= end:
            start = end - timedelta(minutes=5)
        leaves = hid not in (last_in, last_out) and rng.random() < 0.25 and start < HALF_TIME[0] - timedelta(minutes=3)
        if leaves:
            out.append(Session(dev, hid, plat, channel, None, start, at(HALF_TIME[0] + timedelta(minutes=rng.randrange(4)), rng)))
            back = HALF_TIME[1] + timedelta(minutes=rng.randrange(0, 7))  # back by 18:39
            out.append(Session(dev, hid, plat, channel, None, at(back, rng), end))
        else:
            out.append(Session(dev, hid, plat, channel, None, start, end))
    return out


def other_sessions(w: World, devs: dict, derby: list[Session]) -> list[Session]:
    """The rest of the day: live channels and on-demand films, evening-heavy. Nobody else is on
    the derby's channel during the match; a derby household's other sessions avoid the match."""
    rng = stream('other')
    films = [t['title_id'] for t in w.titles if t['kind'] in ('film', 'series')]
    busy = defaultdict(list)
    for s in derby:
        busy[s.household_id].append((s.start - timedelta(minutes=10), s.end + timedelta(minutes=10)))
    live = [c for c in CHANNELS if c != DERBY[2]]
    out = []
    hids = [h.household_id for h in w.households]
    while len(out) < OTHER_SESSIONS:
        hid = rng.choice(hids)
        hour = rng.choices(range(6, 24), [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 5, 6, 8, 8, 7, 5])[0]
        start = at(DAY + timedelta(hours=hour, minutes=rng.randrange(60)), rng)
        end = min(start + timedelta(minutes=rng.randrange(8, 80)), DAY + timedelta(hours=23, minutes=59, seconds=59))
        if end - start < timedelta(minutes=5) or any(a < end and start < b for a, b in busy[hid]):
            continue
        if rng.random() < 0.15 and end <= DERBY[3] - timedelta(minutes=30):
            channel = DERBY[2]  # the sports channel before the build-up
        else:
            channel = rng.choice(live) if rng.random() < 0.7 else None
        dev, plat = rng.choice(devs[hid])
        out.append(Session(dev, hid, plat, channel, None if channel else rng.choice(films), start, end))
        busy[hid].append((start, end))
    return out


def schedule(w: World) -> dict[str, list[tuple[datetime, datetime, str]]]:
    """What really aired: the EPG feed's slots, plus the one the feed never sent (G3, §8.9)."""
    out = defaultdict(list)
    for s in w.epg:
        out[s['channel']].append((s['start'], s['end'], s['title_id']))
    films = sorted(t['title_id'] for t in w.titles if t['kind'] == 'film')
    out[EPG_GAP[0]].append((EPG_GAP[1], EPG_GAP[2], stream('gap').choice(films)))
    return out


def iso(t: datetime) -> str:
    return t.strftime('%Y-%m-%dT%H:%M:%S.') + f'{t.microsecond // 1000:03d}Z'


def build_events(w: World) -> tuple[list[dict], list[dict], dict]:
    devs = devices(w)
    exchange = {h.household_id: h.exchange_id for h in w.households}
    derby = derby_sessions(w, devs)
    sessions = derby + other_sessions(w, devs, derby)
    sched = schedule(w)
    ids = stream('ids')

    def title(s: Session, t: datetime) -> str:
        if s.channel is None:
            return s.title_id
        return next(tid for a, b, tid in sched[s.channel] if a <= t < b)

    events: list[dict] = []

    def emit(s: Session, kind: str, t: datetime, watched: int = 0, buffer_ms: int = 0) -> dict:
        e = {'event_id': f'{ids.getrandbits(64):016x}', 'type': kind, 'device_id': s.device_id,
             'household_id': s.household_id, 'platform': s.platform, 'channel': s.channel,
             'title_id': title(s, t), 'event_ts': iso(t), 'watched_s': watched, 'buffer_ms': buffer_ms}
        events.append(e)
        return e

    beats = defaultdict(list)  # the match's heartbeats (and stops) per exchange: where buffering goes
    in_derby = {id(s) for s in derby}
    for s in sessions:
        emit(s, 'play', s.start)
        t = s.start + timedelta(seconds=60)
        while t < s.end:
            e = emit(s, 'heartbeat', t, 60)
            if id(s) in in_derby and e['title_id'] == DERBY[0]:
                beats[exchange[s.household_id]].append((t, e))
            t += timedelta(seconds=60)
        e = emit(s, 'stop', s.end, int((s.end - (t - timedelta(seconds=60))).total_seconds()))
        if id(s) in in_derby and e['title_id'] == DERBY[0]:
            beats[exchange[s.household_id]].append((s.end, e))

    # Buffering, exact per exchange: B = ratio × watched, as `buffer` events just before a
    # heartbeat (the stall it reports). EX-LDN-04 gets the baseline everywhere and the rest after
    # SECOND_HALF.
    rng = stream('buffer')
    session_of = {}
    for s in derby:
        session_of.setdefault(s.device_id, []).append(s)
    for ex, _ in EXCHANGES:
        rows = beats[ex]
        watched = sum(e['watched_s'] for _, e in rows)
        total = round((BUFFER_RATIO['bad'] if ex == BAD_EXCHANGE else BUFFER_RATIO['else']) * watched * 1000)
        base = round(BUFFER_RATIO['else'] * watched * 1000)
        parts = [(base, [r for r in rows if r[1]['type'] == 'heartbeat'])]
        if ex == BAD_EXCHANGE:
            parts.append((total - base, [r for r in rows if r[1]['type'] == 'heartbeat' and r[0] >= SECOND_HALF]))
        for amount, pool in parts:
            n = max(1, amount // 6000)
            cuts = sorted(rng.sample(range(1, amount), n - 1)) if n > 1 else []
            sizes = [b - a for a, b in zip([0, *cuts], [*cuts, amount])]
            for size, (t, beat) in zip(sizes, rng.sample(pool, n)):
                s = next(x for x in session_of[beat['device_id']] if x.start <= t <= x.end)
                stall = max(t - timedelta(milliseconds=size + rng.randrange(500, 5000)), s.start + timedelta(milliseconds=1))
                emit(s, 'buffer', stall, 0, size)
    events.sort(key=lambda e: (e['event_ts'], e['event_id']))

    tele = telemetry(w, sessions, exchange)
    facts = {'derby_sessions': derby}
    return events, tele, facts


def telemetry(w: World, sessions: list[Session], exchange: dict) -> list[dict]:
    """Each exchange, each minute of the day. Lines active follow viewing; EX-LDN-04's latency and
    loss climb in the derby's second half — the network's side of the buffering."""
    rng = stream('telemetry')
    lines = {ex: sum(h.exchange_id == ex for h in w.households) for ex, _ in EXCHANGES}
    watching = defaultdict(int)
    for s in sessions:
        m = s.start.replace(second=0, microsecond=0)
        while m <= s.end:
            watching[(exchange[s.household_id], m)] += 1
            m += timedelta(minutes=1)
    out = []
    for i in range(24 * 60):
        m = DAY + timedelta(minutes=i)
        for ex, _ in EXCHANGES:
            v = watching[(ex, m)]
            bad = ex == BAD_EXCHANGE and SECOND_HALF <= m < DERBY[4]
            out.append({'exchange_id': ex, 'minute': m.strftime('%Y-%m-%dT%H:%MZ'), 'lines': lines[ex],
                        'streaming': v, 'throughput_mbps': round(v * rng.uniform(6.5, 8.5) + rng.uniform(40, 90), 1),
                        'latency_ms': round(rng.uniform(55, 95) if bad else rng.uniform(9, 16), 1),
                        'loss_pct': round(rng.uniform(1.2, 2.6) if bad else rng.uniform(0.0, 0.08), 2)})
    return out
