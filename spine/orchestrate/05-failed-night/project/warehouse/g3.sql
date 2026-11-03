-- G3: does the EPG cover every minute a box watched a channel? A minute
-- with no slot has no title, and an inner join drops it without a word.
CREATE TEMP TABLE linear AS
SELECT channel, TIMESTAMP_TRUNC(event_ts, MINUTE) AS minute,
       COUNT(*) AS box_minutes
FROM silver.viewing_events
WHERE dt = @dt AND type = 'heartbeat' AND channel IS NOT NULL
GROUP BY channel, minute;

CREATE TEMP TABLE slotted AS
SELECT l.*, s.title_id
FROM linear AS l
LEFT JOIN silver.epg_slots AS s
  ON s.channel = l.channel AND s.dt = @dt
 AND l.minute >= s.slot_start AND l.minute < s.slot_end;

INSERT INTO audit.gate_results
SELECT 'G3', @dt, COUNTIF(title_id IS NULL) = 0,
       FORMAT('%d of %d channel minutes have no EPG slot',
              COUNTIF(title_id IS NULL), COUNT(*)), CURRENT_TIMESTAMP()
FROM slotted;

-- each channel's watched minutes, and what an inner join on the EPG keeps
SELECT IFNULL(channel, 'every channel') AS channel,
       SUM(box_minutes) AS box_minutes,
       SUM(IF(title_id IS NULL, 0, box_minutes)) AS inner_join_keeps,
       FORMAT_TIMESTAMP('%H:%M', MIN(IF(title_id IS NULL, minute, NULL)))
         AS no_slot_from
FROM slotted
GROUP BY ROLLUP (channel)
ORDER BY channel IS NULL, channel;
