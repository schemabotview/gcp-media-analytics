-- G2: a row Silver could not trust is set aside with its reason, and the
-- verdict recorded. The night still goes on: G2 quarantines, it does not
-- stop the load.
CREATE TEMP TABLE judged AS
SELECT v.* EXCEPT (_ingest_ts),
       CASE WHEN v.event_id IS NULL THEN 'no event_id'
            WHEN t.title_id IS NULL THEN 'title not in the catalogue'
       END AS reason
FROM bronze.viewing_events AS v
LEFT JOIN (SELECT DISTINCT title_id FROM bronze.titles_raw
           WHERE dt = @dt) AS t USING (title_id)
WHERE v.dt = @dt;

INSERT INTO bronze.viewing_quarantine
SELECT * FROM judged WHERE reason IS NOT NULL;

INSERT INTO audit.gate_results
SELECT 'G2', @dt, COUNTIF(reason IS NOT NULL) = 0,
       FORMAT('%d of %d rows quarantined', COUNTIF(reason IS NOT NULL),
              COUNT(*)), CURRENT_TIMESTAMP()
FROM judged;

SELECT reason, COUNT(*) AS rows_, MIN(title_id) AS a_title
FROM bronze.viewing_quarantine WHERE dt = @dt GROUP BY reason;
