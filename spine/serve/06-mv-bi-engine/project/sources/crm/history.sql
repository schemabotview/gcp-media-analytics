-- Every version of one household's package: psql -v hh=HH-10042
SELECT package_id, valid_from, valid_to
FROM subscriptions
WHERE household_id = :'hh'
ORDER BY valid_from;
