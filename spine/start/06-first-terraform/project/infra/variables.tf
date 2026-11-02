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
