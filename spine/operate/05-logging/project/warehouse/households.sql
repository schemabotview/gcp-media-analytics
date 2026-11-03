-- Households who watched anything on the night, four ways.
SELECT
  (SELECT SUM(households) FROM gold.content_performance_daily
   WHERE dt = @dt) AS summed,
  (SELECT COUNT(DISTINCT household_id) FROM silver.viewing_events
   WHERE dt = @dt AND type = 'heartbeat') AS exact,
  (SELECT APPROX_COUNT_DISTINCT(household_id) FROM silver.viewing_events
   WHERE dt = @dt AND type = 'heartbeat') AS approx,
  (SELECT HLL_COUNT.MERGE(households_sketch)
   FROM gold.content_performance_daily WHERE dt = @dt) AS sketches
