# The live lane's table: one row per channel per minute, as the stream
# counts it. Partitioned by day, so a query reads only the nights it asks for.
resource "google_bigquery_dataset" "live" {
  dataset_id                 = "live"
  location                   = var.region
  delete_contents_on_destroy = true # dev: a teardown takes the rows too
}

resource "google_bigquery_table" "concurrent_viewers" {
  dataset_id          = google_bigquery_dataset.live.dataset_id
  table_id            = "concurrent_viewers"
  deletion_protection = false
  time_partitioning {
    type  = "DAY"
    field = "minute"
  }
  schema = jsonencode([
    { name = "minute", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "channel", type = "STRING", mode = "REQUIRED" },
    { name = "households", type = "INT64", mode = "REQUIRED" },
    { name = "watched_s", type = "INT64", mode = "REQUIRED" },
    { name = "writer", type = "STRING", mode = "NULLABLE" }, # dataflow, or none
  ])
}
