"""Sun's source systems, generated from one seed: the CRM, billing, the catalogue and the EPG.

The generator builds the WHOLE world first — every household, every subscription version, every
charge, up to the end of the business date — and the files are cuts of it in time:

  the seed       what the CRM and billing hold at SEED_CUTOFF (00:00 UTC on 31 October): loaded
                 before Course 5 lands the night of the 30th (dt=2026-10-30)
  the day        every change stamped on BUSINESS_DATE, as SQL the CRM and billing applications would
                 have run: applied before Course 5 lands dt=2026-10-31 (`day-2026-10-31.sql`)
  the race       three charges billing re-rates at RERATE_AT, during the night's copy (§5.5)

Every planted fact a lesson is built on is a named constant here and asserted by verify.py
(COURSE-PLAN.md, "The data" and "Facts"). Standard library only. Same seed, same bytes.

Viewing events and network telemetry (the streaming path, Courses 6-9) are not generated yet: they
are added with Course 6, in this package, from the same households and exchanges.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

SEED = 20261031
UTC = timezone.utc
BUSINESS_DATE = date(2026, 10, 31)                          # derby night
PREVIOUS_DATE = date(2026, 10, 30)
SEED_CUTOFF = datetime(2026, 10, 31, 0, 0, tzinfo=UTC)      # dt=2026-10-30's window end
WINDOW_END = datetime(2026, 11, 1, 0, 0, tzinfo=UTC)        # dt=2026-10-31's window end
LAST_GOOD = datetime(2026, 10, 30, 0, 0, tzinfo=UTC)        # the watermark before Course 5's first night
RERATE_AT = datetime(2026, 11, 1, 2, 0, 4, tzinfo=UTC)      # §5.5: billing re-rates while the copy runs
FIRST_JOINED = date(2019, 3, 1)

# ── the facts (COURSE-PLAN.md, "Facts") ──────────────────────────────────────────────────────────
HOUSEHOLDS = 5000                                           # HH-10001 … HH-15000
EXCHANGES = [  # (exchange, region): 12 broadband exchanges; EX-LDN-04 buffers in the derby's second half
    ('EX-LDN-01', 'London'), ('EX-LDN-02', 'London'), ('EX-LDN-03', 'London'), ('EX-LDN-04', 'London'),
    ('EX-LDN-05', 'London'), ('EX-LDN-06', 'London'), ('EX-BHM-01', 'Midlands'), ('EX-BHM-02', 'Midlands'),
    ('EX-BHM-03', 'Midlands'), ('EX-MAN-01', 'North West'), ('EX-MAN-02', 'North West'), ('EX-MAN-03', 'North West'),
]
POSTCODES = {'London': ['E14', 'SE10', 'N1', 'W12', 'SW9', 'E1', 'NW5', 'SE15'], 'Midlands': ['B1', 'B15', 'B29', 'CV1'],
             'North West': ['M1', 'M14', 'M20', 'SK4']}
PACKAGES = [  # (package_id, name, monthly price)
    ('P-ESS', 'Essentials', Decimal('26.00')),
    ('P-ENT', 'Entertainment', Decimal('34.00')),
    ('P-SPT', 'Sports', Decimal('52.00')),
    ('P-ULT', 'Ultimate', Decimal('79.00')),
]
PRICE = {p: a for p, _, a in PACKAGES}
UPGRADED = 'HH-10042'                       # §8.8's SCD2: Entertainment → Sports on UPGRADED_ON
UPGRADED_ON = date(2026, 10, 15)
DERBY_UPGRADES = 37                         # households that buy Sports on derby day (the 31st)
RENTALS_PER_DAY = (880, 1040)               # film rentals a day, drawn per day in this range
RERATED = 3                                 # charges re-rated at RERATE_AT (§5.5's short copy)
RERATE_CREDIT = Decimal('-1.00')            # each re-rated rental is £1.00 cheaper
# Frozen when verify first passed (†): billing's charges in each night's window
CHARGES_30 = 1051                           # dt=2026-10-30: (30 Oct 00:00, 31 Oct 00:00]
CHARGES_31 = 1068                           # dt=2026-10-31: (31 Oct 00:00, 1 Nov 00:00]

DERBY = ('T-5001', 'Northbridge v Eastfield', 'SUN-SPORTS-1', datetime(2026, 10, 31, 17, 30, tzinfo=UTC),
         datetime(2026, 10, 31, 19, 25, tzinfo=UTC))
CHANNELS = ['SUN-ONE', 'SUN-SPORTS-1', 'SUN-SPORTS-2', 'SUN-MOVIES-1', 'SUN-MOVIES-2', 'SUN-NEWS']
EPG_GAP = ('SUN-MOVIES-2', datetime(2026, 10, 31, 20, 0, tzinfo=UTC), datetime(2026, 10, 31, 22, 0, tzinfo=UTC))  # G3, §8.9

FIRST = ['Amara', 'Ben', 'Chloe', 'Dev', 'Ella', 'Farid', 'Grace', 'Harry', 'Isla', 'Jack', 'Kiran', 'Leah', 'Mo',
         'Nadia', 'Owen', 'Priti', 'Quinn', 'Rosa', 'Sam', 'Tariq', 'Uma', 'Vik', 'Wren', 'Yusuf', 'Zara']
LAST = ['Adeyemi', 'Brooks', 'Chen', 'Doyle', 'Evans', 'Fraser', 'Gill', 'Hughes', 'Iqbal', 'Jones', 'Khan', 'Lewis',
        'Murphy', 'Nowak', 'Okafor', 'Patel', 'Quigley', 'Reid', 'Shah', 'Taylor', 'Walsh', 'Young']
FILM_A = ['Silent', 'Northern', 'Last', 'Copper', 'Glass', 'Paper', 'Hollow', 'Salt', 'Winter', 'Iron', 'Velvet', 'Distant']
FILM_B = ['Harbour', 'Orchard', 'Signal', 'Crossing', 'Tide', 'Garden', 'Engine', 'Lantern', 'Meridian', 'Quarry']


@dataclass
class Household:
    household_id: str
    first: str
    last: str
    email: str
    phone: str
    postcode: str
    region: str
    exchange_id: str
    bill_day: int
    joined_at: datetime


@dataclass
class Subscription:  # one version of a household's package: valid_to None is current
    subscription_id: str
    household_id: str
    package_id: str
    valid_from: date
    valid_to: date | None
    updated_at: datetime


@dataclass
class Charge:
    charge_id: str
    household_id: str
    kind: str                   # subscription | rental | upgrade
    reference: str              # the package or the title charged for
    amount: Decimal
    status: str                 # posted | re-rated
    posted_at: datetime
    updated_at: datetime


@dataclass
class World:
    households: list[Household]
    subscriptions: list[Subscription]
    charges: list[Charge]
    titles: list[dict]
    epg: list[dict]
    rerated: list[str] = field(default_factory=list)
    # a subscription version the business day closed, as it stood at the seed: updated_at before the day
    before: dict[str, datetime] = field(default_factory=dict)


def stamp(rng: random.Random, day: date, start_h: int = 0, end_h: int = 24) -> datetime:
    s = rng.randrange(start_h * 3600, end_h * 3600)
    return datetime(day.year, day.month, day.day, tzinfo=UTC) + timedelta(seconds=s)


def titles(rng: random.Random) -> list[dict]:
    out = []
    names = sorted({f'{a} {b}' for a in FILM_A for b in FILM_B})
    rng.shuffle(names)
    for i, name in enumerate(names[:90]):
        out.append({'title_id': f'T-{3001 + i}', 'title': f'The {name}', 'kind': 'film', 'runtime_min': rng.randrange(84, 151)})
    for i, name in enumerate(['Harbour Lights', 'The Exchange', 'Kitchen Table', 'Night Shift', 'Riverside',
                              'Signal Box', 'Small Hours', 'The Allotment']):
        out.append({'title_id': f'T-{4001 + i}', 'title': name, 'kind': 'series', 'runtime_min': 60})
    out.append({'title_id': DERBY[0], 'title': DERBY[1], 'kind': 'live-sport', 'runtime_min': 115})
    for i, name in enumerate(['Saturday Football Live', 'Rugby: Ironbridge v Westmere', 'Darts: The Masters', 'Boxing Night']):
        out.append({'title_id': f'T-{5002 + i}', 'title': name, 'kind': 'live-sport', 'runtime_min': 120})
    out.append({'title_id': 'T-6001', 'title': 'Sun News', 'kind': 'news', 'runtime_min': 60})
    return out


def epg(rng: random.Random, cat: list[dict]) -> list[dict]:
    """31 October's schedule, channel by channel, back to back from 06:00 to 02:00. The derby holds
    SUN-SPORTS-1 17:30-19:25; SUN-MOVIES-2's 20:00-22:00 slot is missing (EPG_GAP)."""
    day = datetime(2026, 10, 31, 6, 0, tzinfo=UTC)
    end = day + timedelta(hours=20)
    films = [t for t in cat if t['kind'] == 'film']
    series = [t for t in cat if t['kind'] == 'series']
    sport = [t for t in cat if t['kind'] == 'live-sport' and t['title_id'] != DERBY[0]]
    pick = {'SUN-ONE': series, 'SUN-SPORTS-1': sport, 'SUN-SPORTS-2': sport, 'SUN-MOVIES-1': films,
            'SUN-MOVIES-2': films, 'SUN-NEWS': [t for t in cat if t['kind'] == 'news']}
    slots = []
    for ch in CHANNELS:
        t = day
        while t < end:
            if ch == DERBY[2] and t <= DERBY[3] < t + timedelta(hours=2):
                if t < DERBY[3]:
                    slots.append({'channel': ch, 'start': t, 'end': DERBY[3], 'title_id': 'T-6001'})
                slots.append({'channel': ch, 'start': DERBY[3], 'end': DERBY[4], 'title_id': DERBY[0]})
                t = DERBY[4]
                continue
            if ch == EPG_GAP[0] and t == EPG_GAP[1]:
                t = EPG_GAP[2]  # the slot the EPG feed never sent
                continue
            title = rng.choice(pick[ch])
            length = timedelta(hours=1) if title['kind'] in ('series', 'news') else timedelta(hours=2)
            slots.append({'channel': ch, 'start': t, 'end': t + length, 'title_id': title['title_id']})
            t += length
    return slots


def build() -> World:
    rng = random.Random(SEED)
    households: list[Household] = []
    subs: list[Subscription] = []
    span = (SEED_CUTOFF.date() - FIRST_JOINED).days - 40
    for i in range(HOUSEHOLDS):
        hid = f'HH-{10001 + i}'
        first, last = rng.choice(FIRST), rng.choice(LAST)
        exchange, region = rng.choice(EXCHANGES)
        joined = stamp(rng, FIRST_JOINED + timedelta(days=rng.randrange(span)), 8, 21)
        # Reserved drama numbers (Ofcom's 07700 900000-900999) and a reserved domain: no real person
        h = Household(hid, first, last, f'{first}.{last}{rng.randrange(10, 99)}@mail.example'.lower(),
                      f'07700 900{rng.randrange(1000):03d}', f'{rng.choice(POSTCODES[region])} {rng.randrange(1, 10)}'
                      f'{rng.choice("ABDEFGHJLNPQRSTUWXYZ")}{rng.choice("ABDEFGHJLNPQRSTUWXYZ")}', region, exchange,
                      joined.day, joined)
        households.append(h)
        package = 'P-ENT' if hid == UPGRADED else rng.choices([p for p, _, _ in PACKAGES], [30, 34, 24, 12])[0]
        subs.append(Subscription(f'S-{len(subs) + 1:06d}', hid, package, joined.date(), None, joined))
    # §8.8: HH-10042 upgrades mid-month — the old version closes, a new one opens
    old = next(s for s in subs if s.household_id == UPGRADED)
    at = stamp(rng, UPGRADED_ON, 10, 18)
    old.valid_to, old.updated_at = UPGRADED_ON, at
    subs.append(Subscription(f'S-{len(subs) + 1:06d}', UPGRADED, 'P-SPT', UPGRADED_ON, None, at))
    # derby day: households without Sports buy it before kick-off
    current = {s.household_id: s for s in subs if s.valid_to is None}
    buyers = rng.sample(sorted(h for h, s in current.items() if s.package_id in ('P-ESS', 'P-ENT') and h != UPGRADED), DERBY_UPGRADES)
    upgrades, before = [], {}
    for hid in sorted(buyers):
        s = current[hid]
        at = stamp(rng, BUSINESS_DATE, 9, 17)
        before[s.subscription_id] = s.updated_at
        s.valid_to, s.updated_at = BUSINESS_DATE, at
        subs.append(Subscription(f'S-{len(subs) + 1:06d}', hid, 'P-SPT', BUSINESS_DATE, None, at))
        upgrades.append((hid, s.package_id, at))

    cat = titles(rng)
    films = [t['title_id'] for t in cat if t['kind'] == 'film']
    charges: list[Charge] = []
    days = [SEED_CUTOFF.date() - timedelta(days=d) for d in range(3, 0, -1)] + [BUSINESS_DATE]  # 28th … 31st

    def charge(hid: str, kind: str, ref: str, amount: Decimal, at: datetime) -> None:
        charges.append(Charge(f'C-{len(charges) + 1:07d}', hid, kind, ref, amount, 'posted', at, at))
    for day in days:
        pending = []
        for h in households:
            if h.bill_day == day.day and h.joined_at.date() < day:
                pkg = next(s.package_id for s in subs if s.household_id == h.household_id and s.valid_from <= day
                           and (s.valid_to is None or s.valid_to > day))
                pending.append((stamp(rng, day, 1, 4), h.household_id, 'subscription', pkg, PRICE[pkg]))
        for _ in range(rng.randrange(*RENTALS_PER_DAY)):
            h = rng.choice(households)
            pending.append((stamp(rng, day, 12, 24), h.household_id, 'rental', rng.choice(films),
                            rng.choice([Decimal('3.49'), Decimal('4.99'), Decimal('5.99')])))
        if day == BUSINESS_DATE:
            for hid, was, at in upgrades:  # a pro-rata day of the difference
                pending.append((at, hid, 'upgrade', 'P-SPT', ((PRICE['P-SPT'] - PRICE[was]) / 31).quantize(Decimal('0.01'))))
        for at, hid, kind, ref, amount in sorted(pending):
            charge(hid, kind, ref, amount, at)
    # §5.5's race: at 02:00:04 billing re-rates three of the night's rentals — their updated_at moves
    # past the window's end while the copy is reading it
    day_rentals = [c for c in charges if c.kind == 'rental' and c.posted_at.date() == BUSINESS_DATE]
    rerated = sorted(rng.sample(day_rentals, RERATED), key=lambda c: c.charge_id)
    return World(households, subs, charges, cat, epg(rng, cat), [c.charge_id for c in rerated], before)
