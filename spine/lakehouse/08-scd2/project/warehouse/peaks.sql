-- Each channel's busiest minute of the night, from Bronze: a scan, two
-- groupings and a sort, so BigQuery runs it in several stages.
WITH per_minute AS (
  SELECT channel, TIMESTAMP_TRUNC(event_ts, MINUTE) AS minute,
         COUNT(DISTINCT household_id) AS households
  FROM bronze.viewing_events
  WHERE channel IS NOT NULL
  GROUP BY channel, minute
)
SELECT channel,
       FORMAT_TIMESTAMP('%H:%M', ARRAY_AGG(minute ORDER BY households DESC
                                           LIMIT 1)[OFFSET(0)]) AS busiest,
       MAX(households) AS households
FROM per_minute
GROUP BY channel
ORDER BY households DESC
