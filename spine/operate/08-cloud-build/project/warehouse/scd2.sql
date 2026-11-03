-- SCD2: each household's package in one night's CRM snapshot, merged into
-- the dimension. A changed household arrives twice: under its key, to close
-- the current row; and with no key, so it can only be inserted.
CREATE TEMP TABLE night AS
SELECT household_id, package_id, valid_from
FROM bronze.subscriptions
WHERE dt = @dt AND valid_to IS NULL;

MERGE silver.dim_subscriber AS d
USING (
  SELECT household_id AS hh, * FROM night
  UNION ALL
  SELECT NULL, n.* FROM night AS n
  JOIN silver.dim_subscriber AS c
    ON c.household_id = n.household_id AND c.is_current
   AND c.package_id != n.package_id
) AS n
ON d.household_id = n.hh AND d.is_current
WHEN MATCHED AND d.package_id != n.package_id THEN
  UPDATE SET valid_to = n.valid_from, is_current = FALSE
WHEN NOT MATCHED THEN
  INSERT (household_id, package_id, valid_from, valid_to, is_current)
  VALUES (n.household_id, n.package_id, n.valid_from, NULL, TRUE);

SELECT @dt AS dt, COUNTIF(is_current) AS current_rows,
       COUNTIF(NOT is_current) AS closed_rows
FROM silver.dim_subscriber;
