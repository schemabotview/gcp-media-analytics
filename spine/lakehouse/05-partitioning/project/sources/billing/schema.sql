-- Sun's billing: every charge it posts. A re-rated charge keeps its id and
-- moves its updated_at.
CREATE TABLE charges (
  charge_id    text PRIMARY KEY,
  household_id text NOT NULL,
  kind         text NOT NULL,      -- subscription | rental | upgrade
  reference    text NOT NULL,      -- the package or the title charged for
  amount       numeric(10,2) NOT NULL,
  status       text NOT NULL,      -- posted | re-rated
  posted_at    timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL
);
