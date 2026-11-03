terraform {
  required_version = "~> 1.17.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.9.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.9.1"
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

module "iam" {
  source     = "./modules/iam"
  operator   = var.operator
  project_id = var.project_id
}

module "secrets" {
  source = "./modules/secrets"
  region = var.region
  reader = module.iam.emails["sa-ingest"]
}

module "kms" {
  source = "./modules/kms"
  region = var.region
}

# Pub/Sub's service agent exists once the API is on; its address is fixed
module "pubsub" {
  source       = "./modules/pubsub"
  pubsub_agent = "service-${data.google_project.this.number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# The live lane's table in BigQuery
module "live" {
  source = "./modules/live"
  region = var.region
}

# The live lane's job: its bucket, and sa-dataflow's grants
module "dataflow" {
  source       = "./modules/dataflow"
  project_id   = var.project_id
  region       = var.region
  worker       = module.iam.emails["sa-dataflow"]
  subscription = module.pubsub.subscriptions["viewing-events"]
  dataset      = module.live.dataset
}

module "storage" {
  source      = "./modules/storage"
  project_id  = var.project_id
  region      = var.region
  kms_key     = module.kms.raw_key
  writer      = module.iam.emails["sa-ingest"]
  reader      = module.iam.emails["sa-dataproc"]
  retention_s = var.raw_retention_s
  # the key's grant to Cloud Storage must exist before the bucket uses it
  depends_on = [module.kms]
}

# The bucket moved into the module: the same bucket, not a new one.
moved {
  from = google_storage_bucket.raw
  to   = module.storage.google_storage_bucket.raw
}

# The batch lane's warehouse: Bronze, Silver, Gold and the gates' audit
module "lakehouse" {
  source = "./modules/lakehouse"
  region = var.region
}
