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
