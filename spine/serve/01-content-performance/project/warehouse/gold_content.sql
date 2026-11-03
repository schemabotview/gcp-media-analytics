-- Gold: one night of content performance, per title, platform and region.
-- A minute is a heartbeat: live if the box was on a channel, catch-up if
-- not. Rerunnable: the night is deleted, then written again.
DELETE FROM gold.content_performance_daily WHERE dt = @dt;

INSERT INTO gold.content_performance_daily
SELECT @dt, v.title_id, t.title, t.kind, v.platform, h.region,
       COUNTIF(v.channel IS NOT NULL) AS live_minutes,
       COUNTIF(v.channel IS NULL) AS catchup_minutes,
       COUNT(DISTINCT v.household_id) AS households,
       HLL_COUNT.INIT(v.household_id) AS households_sketch
FROM silver.viewing_events AS v
JOIN bronze.titles_raw AS t ON t.title_id = v.title_id AND t.dt = @dt
JOIN bronze.households_raw AS h
  ON h.household_id = v.household_id AND h.dt = @dt
WHERE v.dt = @dt AND v.type = 'heartbeat'
GROUP BY v.title_id, t.title, t.kind, v.platform, h.region;
