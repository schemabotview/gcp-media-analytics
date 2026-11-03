# Three topics, one per kind of message, and a dead-letter topic for the
# messages nobody can read.
locals {
  topics = ["viewing-events", "network-telemetry", "device-events"]
}

resource "google_project_service" "pubsub" {
  service            = "pubsub.googleapis.com"
  disable_on_destroy = false
}

resource "google_pubsub_topic" "events" {
  for_each                   = toset(local.topics)
  name                       = each.value
  message_retention_duration = "86400s" # a day, to replay a night
  depends_on                 = [google_project_service.pubsub]
}

resource "google_pubsub_topic" "dead_letter" {
  name       = "dead-letter"
  depends_on = [google_project_service.pubsub]
}

# Dataflow's subscriptions: each message delivered until acknowledged.
# After 5 failed deliveries a message goes to dead-letter instead.
resource "google_pubsub_subscription" "dataflow" {
  for_each             = google_pubsub_topic.events
  name                 = "${each.key}-dataflow"
  topic                = each.value.id
  ack_deadline_seconds = 20
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  retry_policy {
    minimum_backoff = "10s" # every retry 10 s apart: five attempts in under a minute
    maximum_backoff = "10s"
  }
}

# Where dead letters are read from, by a person.
resource "google_pubsub_subscription" "audit" {
  name                 = "dead-letter-audit"
  topic                = google_pubsub_topic.dead_letter.id
  ack_deadline_seconds = 60
}

# Pub/Sub's own service agent moves a dead letter: it must be allowed to
# publish to dead-letter, and to acknowledge the original.
resource "google_pubsub_topic_iam_member" "dead_letter" {
  topic  = google_pubsub_topic.dead_letter.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${var.pubsub_agent}"
}

resource "google_pubsub_subscription_iam_member" "dead_letter" {
  for_each     = google_pubsub_subscription.dataflow
  subscription = each.value.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${var.pubsub_agent}"
}
