variable "region" {
  type = string
}

variable "raw_bucket" {
  description = "The raw zone, read in place by the external tables."
  type        = string
}
