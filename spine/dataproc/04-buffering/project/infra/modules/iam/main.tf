# One service account per job: what a pipeline runs as, never a person.
locals {
  accounts = {
    sa-ingest   = "Lands the nightly extracts in the raw zone"
    sa-dataflow = "Runs the live viewer count"
    sa-dataproc = "Runs the QoS join"
    sa-airflow  = "Runs the nightly DAG"
    sa-cicd     = "Plans and deploys from CI"
  }
}

resource "google_service_account" "job" {
  for_each     = local.accounts
  account_id   = each.key
  display_name = each.key
  description  = each.value
}

# Priya may ACT AS each account — a short-lived token, minted on request —
# instead of holding a key file for it.
resource "google_service_account_iam_member" "operator" {
  for_each           = google_service_account.job
  service_account_id = each.value.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = var.operator
}

# The role matrix (§4.8): each account gets the narrowest roles its job needs,
# on the narrowest resource that holds them.
locals {
  project_roles = {
    "sa-dataflow/roles/dataflow.worker" = ["sa-dataflow", "roles/dataflow.worker"]
    "sa-dataproc/roles/dataproc.worker" = ["sa-dataproc", "roles/dataproc.worker"]
    "sa-airflow/roles/composer.worker"  = ["sa-airflow", "roles/composer.worker"]
  }
}

resource "google_project_iam_member" "job" {
  for_each = local.project_roles
  project  = var.project_id
  role     = each.value[1]
  member   = "serviceAccount:${google_service_account.job[each.value[0]].email}"
}
