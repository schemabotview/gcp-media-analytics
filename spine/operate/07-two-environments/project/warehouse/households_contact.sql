-- The same rows, with a tagged column.
SELECT household_id, email
FROM silver.dim_household
ORDER BY household_id
LIMIT 3
