# The batch lane's warehouse: a dataset per layer. Bronze holds what was
# delivered, Silver what it means, Gold what the business asks; audit holds
# every gate's verdict. A dataset fixes its location for good.
locals {
  layers = {
    bronze = "as delivered, with where each row came from"
    silver = "deduplicated and conformed: one row per real event"
    gold   = "the answers, one table per question"
    audit  = "every gate's result, every night"
  }
}

resource "google_bigquery_dataset" "layer" {
  for_each                   = local.layers
  dataset_id                 = each.key
  description                = each.value
  location                   = var.region
  delete_contents_on_destroy = true # dev: a teardown takes the rows too
}

# A viewing event as the device platform exports it, one JSON line each.
locals {
  event = [
    { name = "event_id", type = "STRING" },
    { name = "type", type = "STRING" },
    { name = "device_id", type = "STRING" },
    { name = "household_id", type = "STRING" },
    { name = "platform", type = "STRING" },
    { name = "channel", type = "STRING" },
    { name = "title_id", type = "STRING" },
    { name = "event_ts", type = "TIMESTAMP" },
    { name = "watched_s", type = "INT64" },
    { name = "buffer_ms", type = "INT64" },
  ]
}

# The raw zone, read in place: no copy, no load. BigQuery reads the files at
# query time, and the path's dt=2026-10-31 becomes a column.
resource "google_bigquery_table" "viewing_raw" {
  dataset_id          = google_bigquery_dataset.layer["bronze"].dataset_id
  table_id            = "viewing_raw"
  deletion_protection = false
  external_data_configuration {
    source_format = "NEWLINE_DELIMITED_JSON"
    autodetect    = false
    source_uris   = ["gs://${var.raw_bucket}/source=viewing/*"]
    schema        = jsonencode(local.event)
    hive_partitioning_options {
      mode              = "CUSTOM"
      source_uri_prefix = "gs://${var.raw_bucket}/source=viewing/{dt:DATE}"
    }
  }
}

# Bronze: every delivered row, kept as delivered, plus where it came from.
# Split into an hour's partitions by event time, and sorted inside each by
# channel then title: a query that filters on them reads less.
resource "google_bigquery_table" "viewing_events" {
  dataset_id          = google_bigquery_dataset.layer["bronze"].dataset_id
  table_id            = "viewing_events"
  deletion_protection = false
  time_partitioning {
    type  = "HOUR"
    field = "event_ts"
  }
  clustering = ["channel", "title_id"]
  schema = jsonencode(concat(local.event, [
    { name = "dt", type = "DATE" },
    { name = "_src_file", type = "STRING" },     # the object it came from
    { name = "_ingest_ts", type = "TIMESTAMP" }, # when it was loaded
  ]))
}

# The catalogue as the vendor delivers it, read in place.
resource "google_bigquery_table" "titles_raw" {
  dataset_id          = google_bigquery_dataset.layer["bronze"].dataset_id
  table_id            = "titles_raw"
  deletion_protection = false
  external_data_configuration {
    source_format = "CSV"
    autodetect    = false
    source_uris   = ["gs://${var.raw_bucket}/source=catalogue/*"]
    csv_options {
      quote             = "\""
      skip_leading_rows = 1
    }
    schema = jsonencode([
      { name = "title_id", type = "STRING" },
      { name = "title", type = "STRING" },
      { name = "kind", type = "STRING" },
      { name = "runtime_min", type = "INT64" },
    ])
    hive_partitioning_options {
      mode              = "CUSTOM"
      source_uri_prefix = "gs://${var.raw_bucket}/source=catalogue/{dt:DATE}"
    }
  }
}

# Rows a gate kept out of Silver, and why.
resource "google_bigquery_table" "viewing_quarantine" {
  dataset_id          = google_bigquery_dataset.layer["bronze"].dataset_id
  table_id            = "viewing_quarantine"
  deletion_protection = false
  schema = jsonencode(concat(local.event, [
    { name = "dt", type = "DATE" },
    { name = "_src_file", type = "STRING" },
    { name = "reason", type = "STRING" },
  ]))
}

# Every gate's verdict, every night.
resource "google_bigquery_table" "gate_results" {
  dataset_id          = google_bigquery_dataset.layer["audit"].dataset_id
  table_id            = "gate_results"
  deletion_protection = false
  schema = jsonencode([
    { name = "gate", type = "STRING", mode = "REQUIRED" },
    { name = "dt", type = "DATE", mode = "REQUIRED" },
    { name = "passed", type = "BOOL", mode = "REQUIRED" },
    { name = "detail", type = "STRING" },
    { name = "checked_at", type = "TIMESTAMP", mode = "REQUIRED" },
  ])
}

# Silver: one row per real event, in Sun's own names. Partitioned and
# clustered as Bronze is, so the same filters read the same little.
resource "google_bigquery_table" "silver_viewing" {
  dataset_id          = google_bigquery_dataset.layer["silver"].dataset_id
  table_id            = "viewing_events"
  deletion_protection = false
  time_partitioning {
    type  = "HOUR"
    field = "event_ts"
  }
  clustering = ["channel", "title_id"]
  schema = jsonencode(concat(local.event, [
    { name = "dt", type = "DATE" },
  ]))
}

# The CRM's subscriptions, one night's snapshot per dt, as loaded.
resource "google_bigquery_table" "subscriptions" {
  dataset_id          = google_bigquery_dataset.layer["bronze"].dataset_id
  table_id            = "subscriptions"
  deletion_protection = false
  schema = jsonencode([
    { name = "subscription_id", type = "STRING" },
    { name = "household_id", type = "STRING" },
    { name = "package_id", type = "STRING" },
    { name = "valid_from", type = "DATE" },
    { name = "valid_to", type = "DATE" },
    { name = "updated_at", type = "TIMESTAMP" },
    { name = "dt", type = "DATE" },
  ])
}

# Each household's package over time: a new row for every change, the old
# row closed (SCD type 2). What a household had on any day is one lookup.
resource "google_bigquery_table" "dim_subscriber" {
  dataset_id          = google_bigquery_dataset.layer["silver"].dataset_id
  table_id            = "dim_subscriber"
  deletion_protection = false
  schema = jsonencode([
    { name = "household_id", type = "STRING", mode = "REQUIRED" },
    { name = "package_id", type = "STRING", mode = "REQUIRED" },
    { name = "valid_from", type = "DATE", mode = "REQUIRED" },
    { name = "valid_to", type = "DATE" }, # empty while current
    { name = "is_current", type = "BOOL", mode = "REQUIRED" },
  ])
}

# The EPG, flattened: one row per channel slot.
resource "google_bigquery_table" "epg_slots" {
  dataset_id          = google_bigquery_dataset.layer["silver"].dataset_id
  table_id            = "epg_slots"
  deletion_protection = false
  schema = jsonencode([
    { name = "channel", type = "STRING", mode = "REQUIRED" },
    { name = "title_id", type = "STRING", mode = "REQUIRED" },
    { name = "slot_start", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "slot_end", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "dt", type = "DATE", mode = "REQUIRED" },
  ])
}

# Gold: the derby's buffering per exchange, one partition per night. A
# rerun replaces its night's partition and nothing else.
resource "google_bigquery_table" "qos_by_exchange" {
  dataset_id          = google_bigquery_dataset.layer["gold"].dataset_id
  table_id            = "qos_by_exchange"
  deletion_protection = false
  time_partitioning {
    type  = "DAY"
    field = "dt"
  }
  schema = jsonencode([
    { name = "exchange_id", type = "STRING", mode = "REQUIRED" },
    { name = "watched_s", type = "INT64", mode = "REQUIRED" },
    { name = "buffering_s", type = "FLOAT64", mode = "REQUIRED" },
    { name = "ratio", type = "FLOAT64", mode = "REQUIRED" },
    { name = "dt", type = "DATE", mode = "REQUIRED" },
  ])
}

# Every household's region, from the CRM's nightly file, read in place.
resource "google_bigquery_table" "households_raw" {
  dataset_id          = google_bigquery_dataset.layer["bronze"].dataset_id
  table_id            = "households_raw"
  deletion_protection = false
  external_data_configuration {
    source_format = "CSV"
    autodetect    = false
    source_uris   = ["gs://${var.raw_bucket}/source=crm/*households.csv"]
    csv_options {
      quote             = "\""
      skip_leading_rows = 1
    }
    schema = jsonencode([for c in ["household_id", "first_name", "last_name",
      "email", "phone", "postcode", "region", "exchange_id", "bill_day",
    "joined_at", "updated_at"] : { name = c, type = "STRING" }])
    hive_partitioning_options {
      mode              = "CUSTOM"
      source_uri_prefix = "gs://${var.raw_bucket}/source=crm/{dt:DATE}"
    }
  }
}

# Gold: what each title earned in a night, per platform and region. The
# households are a count AND a sketch: counts cannot be added up, sketches
# can be merged.
resource "google_bigquery_table" "content_performance_daily" {
  dataset_id          = google_bigquery_dataset.layer["gold"].dataset_id
  table_id            = "content_performance_daily"
  deletion_protection = false
  time_partitioning {
    type  = "DAY"
    field = "dt"
  }
  clustering = ["title_id"]
  schema = jsonencode([
    { name = "dt", type = "DATE", mode = "REQUIRED" },
    { name = "title_id", type = "STRING", mode = "REQUIRED" },
    { name = "title", type = "STRING" },
    { name = "kind", type = "STRING" },
    { name = "platform", type = "STRING" },
    { name = "region", type = "STRING" },
    { name = "package_id", type = "STRING" },
    { name = "live_minutes", type = "INT64" },
    { name = "catchup_minutes", type = "INT64" },
    { name = "households", type = "INT64" },
    { name = "households_sketch", type = "BYTES" }, # HLL++
  ])
}
