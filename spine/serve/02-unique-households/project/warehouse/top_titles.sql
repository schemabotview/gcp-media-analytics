-- The night's five most-watched titles, live and catch-up.
SELECT title, SUM(live_minutes) AS live, SUM(catchup_minutes) AS catchup
FROM gold.content_performance_daily
WHERE dt = @dt
GROUP BY title
ORDER BY live + catchup DESC
LIMIT 5
