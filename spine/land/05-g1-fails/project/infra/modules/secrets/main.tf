resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# The CRM's password for the extract: generated, never typed, never printed.
resource "random_password" "crm" {
  length  = 32
  special = false
}

resource "google_secret_manager_secret" "crm" {
  secret_id = "crm-db-password"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "crm" {
  secret      = google_secret_manager_secret.crm.id
  secret_data = random_password.crm.result
}

# Only the extract's account may read it.
resource "google_secret_manager_secret_iam_member" "ingest" {
  secret_id = google_secret_manager_secret.crm.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.reader}"
}
