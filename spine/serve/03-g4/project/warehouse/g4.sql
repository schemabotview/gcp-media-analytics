-- G4: every minute Silver holds is in Gold, once. Gold is a summary: it may
-- regroup minutes, never gain or lose one.
CREATE TEMP TABLE totals AS
SELECT
  (SELECT COUNT(*) FROM silver.viewing_events
   WHERE dt = @dt AND type = 'heartbeat') AS silver_minutes,
  (SELECT SUM(live_minutes + catchup_minutes)
   FROM gold.content_performance_daily WHERE dt = @dt) AS gold_minutes;

INSERT INTO audit.gate_results
SELECT 'G4', @dt, silver_minutes = gold_minutes,
       FORMAT('gold %d, silver %d', gold_minutes, silver_minutes),
       CURRENT_TIMESTAMP()
FROM totals;

SELECT silver_minutes, gold_minutes, gold_minutes - silver_minutes AS extra
FROM totals;
