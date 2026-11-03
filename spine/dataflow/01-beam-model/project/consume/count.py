"""Drain a subscription and count what arrived: messages, and events.

    python consume/count.py viewing-events-dataflow

Every message has its own message_id. Two messages can still carry the same
event: at-least-once delivery means a consumer must expect duplicates.
"""
import json
import os
import sys
from collections import Counter

from google.cloud import pubsub_v1

sub = pubsub_v1.SubscriberClient()
path = sub.subscription_path(os.environ["GOOGLE_CLOUD_PROJECT"], sys.argv[1])
messages, events = set(), Counter()
while got := sub.pull(subscription=path, max_messages=1000,
                      return_immediately=True).received_messages:
    for r in got:
        messages.add(r.message.message_id)
        events[json.loads(r.message.data)["event_id"]] += 1
    sub.acknowledge(subscription=path, ack_ids=[r.ack_id for r in got])
twice = sorted(e for e, n in events.items() if n > 1)
print(f"{len(messages)} messages, {len(events)} distinct event_ids")
print(f"{len(twice)} events arrived twice, e.g. event_id {twice[0]}")
