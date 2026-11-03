# What a Dataproc Serverless batch needs: the API, a subnet whose machines
# reach Google's APIs without public addresses, a bucket for the batch's
# files, and sa-dataproc allowed to read Silver and write Gold.
resource "google_project_service" "dataproc" {
  service            = "dataproc.googleapis.com"
  disable_on_destroy = false
}

resource "google_compute_network" "media" {
  name                    = "vpc-media"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "dataproc" {
  name                     = "sn-dataproc"
  network                  = google_compute_network.media.id
  region                   = var.region
  ip_cidr_range            = "10.20.0.0/24"
  private_ip_google_access = true # BigQuery and Storage, with no public IP
}

# Spark's driver and executors talk to each other on any port
resource "google_compute_firewall" "internal" {
  name          = "fw-dataproc-internal"
  network       = google_compute_network.media.id
  direction     = "INGRESS"
  source_ranges = [google_compute_subnetwork.dataproc.ip_cidr_range]
  allow {
    protocol = "all"
  }
}

resource "google_storage_bucket" "deps" {
  name                        = "${var.project_id}-dataproc"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = true # staged code and logs, nothing to keep
}

resource "google_storage_bucket_iam_member" "deps" {
  bucket = google_storage_bucket.deps.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.worker}"
}

# Reading a table through the Storage Read API is a read session
resource "google_project_iam_member" "bq" {
  for_each = toset(["roles/bigquery.readSessionUser", "roles/bigquery.jobUser"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${var.worker}"
}

resource "google_bigquery_dataset_iam_member" "read" {
  dataset_id = "silver"
  role       = "roles/bigquery.dataViewer"
  member     = "serviceAccount:${var.worker}"
}

resource "google_bigquery_dataset_iam_member" "write" {
  dataset_id = "gold"
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${var.worker}"
}
