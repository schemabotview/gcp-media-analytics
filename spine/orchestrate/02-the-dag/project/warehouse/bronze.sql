-- Bronze: one night as delivered, stamped with its file and load time.
-- Nothing is fixed here: a bad row is kept, to be judged later. The
-- night is replaced, never appended twice: a rerun gives the same rows.
DELETE FROM bronze.viewing_events WHERE dt = @dt;

INSERT INTO bronze.viewing_events
SELECT *, _FILE_NAME AS _src_file, CURRENT_TIMESTAMP() AS _ingest_ts
FROM bronze.viewing_raw
WHERE dt = @dt;

SELECT REGEXP_EXTRACT(_src_file, r'[^/]+$') AS file, COUNT(*) AS events
FROM bronze.viewing_events
WHERE dt = @dt
GROUP BY file
ORDER BY file;
