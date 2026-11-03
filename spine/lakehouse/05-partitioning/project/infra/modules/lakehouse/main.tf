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
