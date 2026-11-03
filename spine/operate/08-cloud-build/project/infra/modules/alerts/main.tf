# The live lane's early warning: if the oldest message nobody has
# acknowledged on Dataflow's subscription is over five minutes old, the job
# has stopped keeping up, during a match that means the live count is wrong.
resource "google_monitoring_alert_policy" "backlog" {
  display_name = "viewing-events: Dataflow falling behind"
  combiner     = "OR"
  conditions {
    display_name = "oldest unacked message > 300 s for 2 min"
    condition_threshold {
      filter          = "resource.type = \"pubsub_subscription\" AND resource.labels.subscription_id = \"viewing-events-dataflow\" AND metric.type = \"pubsub.googleapis.com/subscription/oldest_unacked_message_age\""
      comparison      = "COMPARISON_GT"
      threshold_value = 300
      duration        = "120s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MAX"
      }
    }
  }
  notification_channels = [var.channel]
  documentation {
    content = "Is live-viewers running? gcloud dataflow jobs list"
  }
}
