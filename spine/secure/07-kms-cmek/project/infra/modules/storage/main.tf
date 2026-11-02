# The raw zone: where each night's extracts land, as received.
resource "google_storage_bucket" "raw" {
  name                        = "${var.project_id}-raw"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  # every new object is encrypted with Sun's own key, not Google's
  encryption {
    default_kms_key_name = var.kms_key
  }
}
