"""Pull messages from a subscription, and acknowledge them - or not.

    python consume/pull.py viewing-events-dataflow --max 3
    python consume/pull.py viewing-events-dataflow --max 1 --no-ack

A message nobody acknowledges is delivered again once its ack deadline
passes: Pub/Sub keeps it until somebody says it was handled.
"""
import argparse
import json
import os

from google.cloud import pubsub_v1

p = argparse.ArgumentParser()
p.add_argument("subscription")
p.add_argument("--max", type=int, default=10)
p.add_argument("--no-ack", action="store_true")
a = p.parse_args()

sub = pubsub_v1.SubscriberClient()
path = sub.subscription_path(os.environ["GOOGLE_CLOUD_PROJECT"],
                             a.subscription)
got = sub.pull(subscription=path, max_messages=a.max,
               return_immediately=True).received_messages
for r in got:
    e, m = json.loads(r.message.data), r.message
    print(f"message {m.message_id}  {m.attributes['type']:<9} "
          f"{m.attributes['device_id']}  {e['event_ts'][11:19]}")
if got and not a.no_ack:
    sub.acknowledge(subscription=path, ack_ids=[r.ack_id for r in got])
print(f"{len(got)} pulled, {0 if a.no_ack else len(got)} acknowledged")
