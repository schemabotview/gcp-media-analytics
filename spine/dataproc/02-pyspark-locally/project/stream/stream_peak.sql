-- What the Dataflow job wrote: each minute's latest firing, and how many.
SELECT FORMAT_TIMESTAMP('%H:%M', minute) AS minute,
       MAX(households) AS households, COUNT(*) AS firings
FROM live.concurrent_viewers
WHERE writer = 'dataflow'
GROUP BY minute
ORDER BY minute
