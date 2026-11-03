-- The derby card: the live lane's answer and the batch's, side by side.
WITH live AS (
  SELECT FORMAT_TIMESTAMP('%H:%M', minute) AS peak_at, households
  FROM live.concurrent_viewers
  WHERE writer = 'dataflow'
  ORDER BY households DESC LIMIT 1
), gold AS (
  SELECT SUM(live_minutes) AS live_minutes,
         HLL_COUNT.MERGE(households_sketch) AS households
  FROM gold.content_performance_daily
  WHERE dt = '2026-10-31' AND title_id = 'T-5001'
), qos AS (
  SELECT ARRAY_AGG(STRUCT(exchange_id, ratio) ORDER BY ratio DESC)
           AS by_ratio
  FROM gold.qos_by_exchange WHERE dt = '2026-10-31'
)
SELECT live.peak_at, live.households AS live, gold.households AS gold,
       gold.live_minutes AS minutes,
       qos.by_ratio[OFFSET(0)].exchange_id AS worst,
       ROUND(100 * qos.by_ratio[OFFSET(0)].ratio, 1) AS pct,
       ROUND(100 * qos.by_ratio[OFFSET(1)].ratio, 1) AS next_pct
FROM live, gold, qos
