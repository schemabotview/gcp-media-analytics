# Managed Airflow: Composer 3 runs the same DAG folder on Google's side.
# PLANNED, NEVER APPLIED in this course: an environment costs money every
# hour it exists, whether a DAG runs or not.
resource "google_project_iam_member" "agent" {
  project = var.project_id
  role    = "roles/composer.ServiceAgentV2Ext"
  member  = "serviceAccount:service-${var.project_number}@cloudcomposer-accounts.iam.gserviceaccount.com"
}

resource "google_composer_environment" "media" {
  name   = "viewing-pulse"
  region = var.region
  config {
    software_config {
      image_version = "composer-3-airflow-2.10.5"
      pypi_packages = { apache-airflow-providers-google = "==14.0.0" }
    }
    environment_size = "ENVIRONMENT_SIZE_SMALL"
    node_config {
      service_account = var.worker
    }
  }
  depends_on = [google_project_iam_member.agent]
}
