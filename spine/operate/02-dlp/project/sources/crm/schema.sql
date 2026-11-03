-- Sun's CRM: who the households are and what they subscribe to.
CREATE TABLE packages (
  package_id    text PRIMARY KEY,
  name          text NOT NULL,
  monthly_price numeric(10,2) NOT NULL
);
CREATE TABLE households (
  household_id text PRIMARY KEY,
  first_name   text NOT NULL,
  last_name    text NOT NULL,
  email        text NOT NULL,
  phone        text NOT NULL,
  postcode     text NOT NULL,
  region       text NOT NULL,
  exchange_id  text NOT NULL,     -- the broadband exchange that serves it
  bill_day     smallint NOT NULL,
  joined_at    timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL
);
-- One row per version of a household's package; valid_to NULL is current.
CREATE TABLE subscriptions (
  subscription_id text PRIMARY KEY,
  household_id    text NOT NULL REFERENCES households,
  package_id      text NOT NULL REFERENCES packages,
  valid_from      date NOT NULL,
  valid_to        date,
  updated_at      timestamptz NOT NULL
);
