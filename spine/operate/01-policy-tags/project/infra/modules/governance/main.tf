# Column-level security: a taxonomy of what is sensitive, a policy tag
# per kind, and only the named readers may see a tagged column. Everyone
# else may still query the table, just not those columns.
resource "google_data_catalog_taxonomy" "pii" {
  display_name           = "sun-pii"
  region                 = var.region
  activated_policy_types = ["FINE_GRAINED_ACCESS_CONTROL"]
}

resource "google_data_catalog_policy_tag" "contact" {
  taxonomy     = google_data_catalog_taxonomy.pii.id
  display_name = "contact"
  description  = "a way to reach a person: email, phone"
}

resource "google_data_catalog_policy_tag_iam_member" "readers" {
  policy_tag = google_data_catalog_policy_tag.contact.name
  role       = "roles/datacatalog.categoryFineGrainedReader"
  member     = "group:pii-readers@sun.example"
}

# Households in Silver: the contact columns carry the tag
resource "google_bigquery_table" "dim_household" {
  project             = var.project_id
  dataset_id          = "silver"
  table_id            = "dim_household"
  deletion_protection = false
  schema = jsonencode([
    { name = "household_id", type = "STRING", mode = "REQUIRED" },
    { name = "region", type = "STRING" },
    { name = "exchange_id", type = "STRING" },
    { name = "email", type = "STRING",
    policyTags = { names = [google_data_catalog_policy_tag.contact.name] } },
    { name = "phone", type = "STRING",
    policyTags = { names = [google_data_catalog_policy_tag.contact.name] } },
  ])
}
