variable "project_id" {
  type = string
}

variable "project_number" {
  type = string
}

variable "region" {
  type = string
}

variable "worker" {
  description = "The DAGs' service account: sa-airflow."
  type        = string
}
