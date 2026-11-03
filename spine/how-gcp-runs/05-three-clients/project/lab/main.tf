# The third client: Terraform reads the same project through the same API.
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "8.9.0"
    }
  }
}

variable "project_id" {
  type = string
}

data "google_project" "this" {
  project_id = var.project_id
}

output "project" {
  value = {
    id     = data.google_project.this.project_id
    number = data.google_project.this.number
  }
}
