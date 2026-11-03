output "topics" {
  value = [for t in google_pubsub_topic.events : t.name]
}
