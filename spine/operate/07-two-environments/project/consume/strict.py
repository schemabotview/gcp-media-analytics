"""A subscriber that refuses what it cannot read: anything that is not
JSON is nacked, and Pub/Sub delivers it again - until the subscription's
dead-letter policy gives up on it.

    python consume/strict.py viewing-events-dataflow
"""
import json
import os
import sys
import time

from google.cloud import pubsub_v1

WATCH = 75  # seconds: five attempts, ten seconds apart, and a margin

sub = pubsub_v1.SubscriberClient()
path = sub.subscription_path(os.environ["GOOGLE_CLOUD_PROJECT"], sys.argv[1])


def handle(message: pubsub_v1.subscriber.message.Message) -> None:
    try:
        json.loads(message.data)
    except ValueError:
        print(f"attempt {message.delivery_attempt}: not JSON, nack")
        message.nack()
        return
    message.ack()


future = sub.subscribe(path, callback=handle)
time.sleep(WATCH)
future.cancel()
print("no more deliveries: the subscription has let it go")
