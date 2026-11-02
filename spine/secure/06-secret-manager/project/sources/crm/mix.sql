-- Households by their current package.
SELECT p.name AS package, p.monthly_price, count(*) AS households
FROM subscriptions s JOIN packages p USING (package_id)
WHERE s.valid_to IS NULL
GROUP BY p.name, p.monthly_price
ORDER BY households DESC;
