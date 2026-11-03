# What a Dataflow job needs: the API, a bucket for its staged code and
# temporary files, and its service account allowed to read the stream and
# write the live table - nothing else.
resource "google_project_service" "dataflow" {
  service            = "dataflow.googleapis.com"
  disable_on_destroy = false
}

resource "google_storage_bucket" "staging" {
  name                        = "${var.project_id}-dataflow"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = true # staged code, nothing to keep
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 1
    }
  }
}

resource "google_storage_bucket_iam_member" "staging" {
  bucket = google_storage_bucket.staging.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.worker}"
}

resource "google_pubsub_subscription_iam_member" "read" {
  for_each     = toset(["roles/pubsub.subscriber", "roles/pubsub.viewer"])
  subscription = var.subscription
  role         = each.value
  member       = "serviceAccount:${var.worker}"
}

resource "google_bigquery_dataset_iam_member" "write" {
  dataset_id = var.dataset
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${var.worker}"
}

# A job that takes event time from an attribute (timestamp_attribute) makes a
# second subscription of its own, to track the watermark. Creating one needs
# the project's pubsub.subscriptions.create: without it the job runs, reads,
# and never closes a window.
resource "google_project_iam_member" "track" {
  project = var.project_id
  role    = "roles/pubsub.editor"
  member  = "serviceAccount:${var.worker}"
}
