output "topics" {
  value = [for t in google_pubsub_topic.events : t.name]
}

output "subscriptions" {
  value = { for k, s in google_pubsub_subscription.dataflow : k => s.id }
}
