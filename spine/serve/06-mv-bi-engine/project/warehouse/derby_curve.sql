-- The derby's curve, a dashboard's favourite query: households per minute.
SELECT TIMESTAMP_TRUNC(event_ts, MINUTE) AS minute,
       COUNT(DISTINCT household_id) AS households
FROM silver.viewing_events
WHERE event_ts >= '2026-10-31 17:30:00' AND event_ts < '2026-10-31 19:30:00'
  AND channel = 'SUN-SPORTS-1'
GROUP BY minute
