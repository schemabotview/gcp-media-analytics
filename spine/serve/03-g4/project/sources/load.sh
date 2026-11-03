# Load the CRM and billing from sun_gen's extracts into Priya's PostgreSQL.
set -e
for db in crm billing; do
  psql -q -d "$db" -f "sources/$db/schema.sql" -f "sources/$db/load.sql"
done
