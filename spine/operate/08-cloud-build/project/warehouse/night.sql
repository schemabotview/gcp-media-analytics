-- One night through every layer: a rerun must leave every number as it was.
SELECT
  (SELECT COUNT(*) FROM bronze.viewing_events WHERE dt = @dt) AS bronze,
  (SELECT COUNT(*) FROM bronze.viewing_quarantine WHERE dt = @dt)
    AS quarantined,
  (SELECT COUNT(*) FROM silver.viewing_events WHERE dt = @dt) AS silver,
  (SELECT SUM(live_minutes + catchup_minutes)
   FROM gold.content_performance_daily WHERE dt = @dt) AS gold_minutes,
  (SELECT COUNT(*) FROM gold.qos_by_exchange WHERE dt = @dt) AS exchanges
