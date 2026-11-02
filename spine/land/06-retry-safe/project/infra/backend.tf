# State lives in Cloud Storage, not on Priya's laptop. The bucket is named
# at init (-backend-config=bucket=...): a backend block cannot read a
# variable, and the bucket must exist before Terraform can use it.
terraform {
  backend "gcs" {
    prefix = "env/dev"
  }
}
