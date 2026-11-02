output "raw_key" {
  value = google_kms_crypto_key.raw.id
}

output "ready" {
  description = "The grant the bucket's default key waits for."
  value       = google_kms_crypto_key_iam_member.gcs.etag
}
