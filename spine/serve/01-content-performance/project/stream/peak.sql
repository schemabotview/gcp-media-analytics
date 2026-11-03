-- The derby's live peak, as the pipeline wrote it.
SELECT FORMAT_TIMESTAMP('%H:%M', minute) AS minute, households, watched_s
FROM live.concurrent_viewers
WHERE channel = 'SUN-SPORTS-1'
ORDER BY households DESC, minute
LIMIT 3
