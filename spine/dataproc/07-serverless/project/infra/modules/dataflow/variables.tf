variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "worker" {
  description = "The job's service account: sa-dataflow."
  type        = string
}

variable "subscription" {
  type = string
}

variable "dataset" {
  type = string
}
