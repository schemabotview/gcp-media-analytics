-- The same curve, the time filter forgotten.
SELECT TIMESTAMP_TRUNC(event_ts, MINUTE) AS minute,
       COUNT(DISTINCT household_id) AS households
FROM silver.viewing_events
WHERE channel = 'SUN-SPORTS-1'
GROUP BY minute
