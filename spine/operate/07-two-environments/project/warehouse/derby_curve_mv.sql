-- The same curve, from the materialized view.
SELECT minute, households
FROM gold.derby_curve
WHERE minute >= '2026-10-31 17:30:00' AND minute < '2026-10-31 19:30:00'
  AND channel = 'SUN-SPORTS-1'
