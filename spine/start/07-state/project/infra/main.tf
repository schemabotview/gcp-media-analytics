terraform {
  required_version = "~> 1.17.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.9.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  # every resource carries these, so the project can be filtered to ours
  default_labels = {
    app   = "viewing-pulse"
    env   = var.env
    owner = "media-data"
  }
}

# The raw zone: where each night's extracts land, as received.
resource "google_storage_bucket" "raw" {
  name                        = "${var.project_id}-raw"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}
