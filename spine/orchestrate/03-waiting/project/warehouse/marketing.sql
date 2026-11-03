-- What marketing sees of the derby: minutes and households per region.
SELECT region, minutes, households
FROM marketing.title_audience
WHERE dt = '2026-10-31' AND title = 'Northbridge v Eastfield'
ORDER BY minutes DESC
