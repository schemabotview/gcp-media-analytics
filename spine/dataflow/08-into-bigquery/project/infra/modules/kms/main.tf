resource "google_project_service" "kms" {
  service            = "cloudkms.googleapis.com"
  disable_on_destroy = false
}

# A key ring cannot be deleted, ever: a teardown destroys the key's
# versions, and the next recording imports kr-media and k-raw again.
resource "google_kms_key_ring" "media" {
  name       = "kr-media"
  location   = var.region
  depends_on = [google_project_service.kms]
}

resource "google_kms_crypto_key" "raw" {
  name            = "k-raw"
  key_ring        = google_kms_key_ring.media.id
  rotation_period = "7776000s" # 90 days: new objects use the new version
}

# Cloud Storage's own service agent encrypts with it, on the bucket's behalf.
data "google_storage_project_service_account" "gcs" {}

resource "google_kms_crypto_key_iam_member" "gcs" {
  crypto_key_id = google_kms_crypto_key.raw.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs.email_address}"
}
