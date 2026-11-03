variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "kms_key" {
  type = string
}

variable "writer" {
  description = "The account that lands the extracts."
  type        = string
}

variable "reader" {
  description = "The account that reads them for the QoS join."
  type        = string
}

variable "retention_s" {
  description = "How long an object is immutable, in seconds."
  type        = number
}
