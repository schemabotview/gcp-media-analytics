variable "project_id" {
  description = "The project everything lands in (TF_VAR_project_id)."
  type        = string
}

variable "region" {
  description = "Where every regional resource lives: London."
  type        = string
  default     = "europe-west2"
}

variable "env" {
  description = "dev or prod: a label on everything, and a state prefix."
  type        = string
  default     = "dev"
}

variable "billing_account" {
  description = "The billing account the budget watches (TF_VAR_billing_account)."
  type        = string
}

variable "alert_email" {
  description = "Who hears about money and failures."
  type        = string
  default     = "media-data@sun.example"
}

variable "operator" {
  description = "Who runs Terraform and may act as the service accounts."
  type        = string
}
