-- One household over time, and the package it had on derby day.
SELECT package_id, valid_from, valid_to, is_current,
       DATE '2026-10-31' >= valid_from
         AND (valid_to IS NULL OR DATE '2026-10-31' < valid_to)
         AS derby_day
FROM silver.dim_subscriber
WHERE household_id = @hh
ORDER BY valid_from
