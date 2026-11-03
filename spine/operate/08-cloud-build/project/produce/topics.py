"""The emulator's topics and subscriptions: what §6.2's Terraform makes on
Google Cloud, made here because the emulator keeps nothing between runs.

    python produce/topics.py
"""
import os

from google.cloud import pubsub_v1

project = os.environ["GOOGLE_CLOUD_PROJECT"]
pub, sub = pubsub_v1.PublisherClient(), pubsub_v1.SubscriberClient()
for t in ("viewing-events", "network-telemetry", "device-events"):
    topic = pub.create_topic(name=pub.topic_path(project, t)).name
    sub.create_subscription(name=sub.subscription_path(
        project, f"{t}-dataflow"), topic=topic, ack_deadline_seconds=10)
sub.create_subscription(request={
    "name": sub.subscription_path(project, "viewing-events-ordered"),
    "topic": pub.topic_path(project, "viewing-events"),
    "enable_message_ordering": True})
