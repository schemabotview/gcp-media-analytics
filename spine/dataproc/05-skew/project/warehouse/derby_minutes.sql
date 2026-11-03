-- The second half's busiest minute: households seen on the derby's channel.
SELECT TIMESTAMP_TRUNC(event_ts, MINUTE) AS minute,
       COUNT(DISTINCT household_id) AS households
FROM bronze.viewing_events
WHERE event_ts >= '2026-10-31 18:35:00' AND event_ts < '2026-10-31 19:25:00'
  AND channel = 'SUN-SPORTS-1'
GROUP BY minute
ORDER BY households DESC
LIMIT 1
