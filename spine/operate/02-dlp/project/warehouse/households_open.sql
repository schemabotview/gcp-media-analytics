-- What anyone with access to Silver may read.
SELECT household_id, region, exchange_id
FROM silver.dim_household
ORDER BY household_id
LIMIT 3
