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
