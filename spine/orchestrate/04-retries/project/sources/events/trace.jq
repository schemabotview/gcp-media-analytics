# One device's derby-night viewing, an event per row:
#   jq -rf sources/events/trace.jq --arg d STB-13795 data/viewing/*
# A box sends `play`, a `heartbeat` each minute it plays (60 s watched),
# `buffer` when the picture stalls (how long, in ms), and `stop`.
def pad(n): ("          " + tostring)[-n:];
select(.device_id == $d and .channel == "SUN-SPORTS-1"
       and .event_ts >= "2026-10-31T17")
| "\(.event_ts[11:19])  \((.type + "         ")[:9])  \(.title_id)"
  + "  \(.watched_s | pad(3)) s  \(.buffer_ms | pad(6)) ms"
