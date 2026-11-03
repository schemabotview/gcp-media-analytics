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
  # Immutable by policy: no object can be deleted or replaced until it is
  # this old. dev holds an hour, so a recording can be torn down the same
  # day; prod's is set in prod.tfvars (Course 12).
  retention_policy {
    retention_period = var.retention_s
  }
  # Hot to cold: a night is read hard for a month, rarely after.
  dynamic "lifecycle_rule" {
    for_each = { NEARLINE = 30, COLDLINE = 90, ARCHIVE = 365 }
    content {
      action {
        type          = "SetStorageClass"
        storage_class = lifecycle_rule.key
      }
      condition {
        age = lifecycle_rule.value
      }
    }
  }
}

# Who may touch the raw zone: the extract writes and reads it back (G1);
# Dataproc reads it. Nobody's role can delete or replace an object.
locals {
  raw_roles = {
    "ingest-create" = ["roles/storage.objectCreator", var.writer]
    "ingest-view"   = ["roles/storage.objectViewer", var.writer]
    "dataproc-view" = ["roles/storage.objectViewer", var.reader]
  }
}

resource "google_storage_bucket_iam_member" "raw" {
  for_each = local.raw_roles
  bucket   = google_storage_bucket.raw.name
  role     = each.value[0]
  member   = "serviceAccount:${each.value[1]}"
}
