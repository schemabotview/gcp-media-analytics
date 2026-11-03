-- The night as delivered, read straight from the raw zone's files.
SELECT dt, platform, COUNT(*) AS events,
       COUNT(DISTINCT _FILE_NAME) AS files
FROM bronze.viewing_raw
WHERE dt = '2026-10-31'
GROUP BY dt, platform
ORDER BY events DESC
