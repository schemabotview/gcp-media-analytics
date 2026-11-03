-- Silver's households, from the CRM's nightly file: contact columns tagged.
DELETE FROM silver.dim_household WHERE TRUE;
INSERT INTO silver.dim_household
SELECT household_id, region, exchange_id, email, phone
FROM bronze.households_raw
WHERE dt = @dt;
