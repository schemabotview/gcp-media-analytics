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
