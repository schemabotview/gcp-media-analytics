-- The derby's peak again, now from Silver: the batch's answer, next morning.
SELECT FORMAT_TIMESTAMP('%H:%M', TIMESTAMP_TRUNC(event_ts, MINUTE))
         AS minute,
       COUNT(DISTINCT household_id) AS households
FROM silver.viewing_events
WHERE dt = @dt AND channel = 'SUN-SPORTS-1'
  AND title_id = 'T-5001'
GROUP BY minute
ORDER BY households DESC
LIMIT 3
