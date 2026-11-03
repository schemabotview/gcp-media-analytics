variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "worker" {
  description = "The batches' service account: sa-dataproc."
  type        = string
}
