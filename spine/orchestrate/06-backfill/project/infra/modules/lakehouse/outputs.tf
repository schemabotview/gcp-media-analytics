output "datasets" {
  value = { for k, d in google_bigquery_dataset.layer : k => d.dataset_id }
}
