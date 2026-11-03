-- Silver: one row per real event. A retry is the same event_id twice:
-- keep the first copy loaded. Platforms in Sun's names, not each client's.
INSERT INTO silver.viewing_events
SELECT * EXCEPT (_src_file, _ingest_ts)
         REPLACE (CASE platform WHEN 'STB' THEN 'settop'
                                WHEN 'iOS' THEN 'app-ios'
                                WHEN 'Android' THEN 'app-android'
                                WHEN 'Web' THEN 'web' END AS platform)
FROM bronze.viewing_events
WHERE dt = @dt
  AND event_id NOT IN (SELECT event_id FROM bronze.viewing_quarantine
                       WHERE dt = @dt AND event_id IS NOT NULL)
QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id
                           ORDER BY _ingest_ts, _src_file) = 1;

SELECT
  (SELECT COUNT(*) FROM bronze.viewing_events WHERE dt = @dt) AS bronze_rows,
  (SELECT COUNT(*) FROM bronze.viewing_quarantine WHERE dt = @dt)
    AS quarantined_rows,
  (SELECT COUNT(*) FROM silver.viewing_events WHERE dt = @dt) AS silver_rows;
