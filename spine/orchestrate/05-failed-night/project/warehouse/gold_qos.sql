-- What Gold holds per night: one row per exchange, the worst ratio.
SELECT dt, COUNT(*) AS exchanges, ROUND(100 * MAX(ratio), 1) AS max_pct
FROM gold.qos_by_exchange
WHERE dt >= '2026-10-01'
GROUP BY dt
ORDER BY dt
