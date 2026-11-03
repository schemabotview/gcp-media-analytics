"""How derby night's events ARRIVED.

    python stream/arrivals.py --from 18:38 --minutes 6

Event time is when a box says something happened; processing time is when
the platform hears of it. Most boxes are heard within seconds. A few - the
SLOW boxes, with a clock minutes behind or a connection that buffers - are
heard minutes later. And a retry re-sends one event in every RESEND, as the
producer does (Course 6). Deterministic: the same night, the same arrivals.
"""
import argparse
import json
from datetime import datetime, timedelta

RESEND = 400
SLOW_EVERY = 37                     # one device in 37 is slow
SLOW_LAG = (240, 360)               # heard 4-6 minutes late
DAY = "data/viewing/2026-10-31.jsonl"


def ts(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00"))


def slow(device: str) -> bool:
    return int(device.split("-")[1]) % SLOW_EVERY == 0


def lag(e: dict) -> timedelta:
    spread = int(e["event_id"][:6], 16)
    if slow(e["device_id"]):
        lo, hi = SLOW_LAG
        return timedelta(seconds=lo + spread % (hi - lo))
    return timedelta(seconds=1 + spread % 4)


def events(start: str, minutes: int, channel=None, device=None) -> list:
    t0 = ts(f"2026-10-31T{start}:00Z")
    t1 = t0 + timedelta(minutes=minutes)
    with open(DAY) as f:
        return [e for e in map(json.loads, f)
                if t0 <= ts(e["event_ts"]) < t1
                and (channel is None or e["channel"] == channel)
                and (device is None or e["device_id"] == device)]


def delivered(evs: list) -> list:
    """(arrival time, event), in the order the platform heard them."""
    out = []
    for i, e in enumerate(evs, 1):
        heard = ts(e["event_ts"]) + lag(e)
        out.append((heard, e))
        if i % RESEND == 0:  # the retry: the same event, a moment later
            out.append((heard + timedelta(seconds=2), e))
    return sorted(out, key=lambda a: (a[0], a[1]["event_id"]))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--from", dest="start", required=True)
    p.add_argument("--minutes", type=int, required=True)
    a = p.parse_args()
    got = delivered(events(a.start, a.minutes, "SUN-SPORTS-1"))
    by = lambda t, e: (t - ts(e["event_ts"])).total_seconds()
    late = [(t, e) for t, e in got if by(t, e) > 60]
    boxes = {e["device_id"] for _, e in late}
    print(f"{len(got)} deliveries, {len(boxes)} slow boxes")
    print("event time  heard at    late by   device")
    for t, e in late[:3] + got[:3]:
        print(f"{e['event_ts'][11:19]}    {t:%H:%M:%S}    "
              f"{by(t, e):>5.0f} s   {e['device_id']}")
