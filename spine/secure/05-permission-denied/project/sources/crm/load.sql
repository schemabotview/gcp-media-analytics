\copy packages FROM 'data/crm/packages.csv' WITH (FORMAT csv, HEADER)
\copy households FROM 'data/crm/households.csv' WITH (FORMAT csv, HEADER)
\copy subscriptions FROM 'data/crm/subscriptions.csv' WITH (FORMAT csv, HEADER)
