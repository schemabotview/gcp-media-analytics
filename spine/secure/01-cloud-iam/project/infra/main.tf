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
  project               = var.project_id
  region                = var.region
  billing_project       = var.project_id
  user_project_override = true
  # every resource carries these, so the project can be filtered to ours
  default_labels = {
    app   = "viewing-pulse"
    env   = var.env
    owner = "media-data"
  }
}

module "storage" {
  source     = "./modules/storage"
  project_id = var.project_id
  region     = var.region
}

# The bucket moved into the module: the same bucket, not a new one.
moved {
  from = google_storage_bucket.raw
  to   = module.storage.google_storage_bucket.raw
}
