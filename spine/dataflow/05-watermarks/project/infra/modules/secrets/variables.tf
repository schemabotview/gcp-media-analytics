variable "region" {
  type = string
}

variable "reader" {
  description = "The one service account that reads the CRM password."
  type        = string
}
