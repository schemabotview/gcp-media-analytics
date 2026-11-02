# Priya's environment for viewing-pulse, sourced by her shell profile.
export GOOGLE_CLOUD_PROJECT=sun-media-dev
export RAW=gs://sun-media-dev-raw
# The raw zone, on her laptop: fake-gcs-server, Cloud Storage's emulator.
# The Python client and gcloud both talk to it instead of Google, with no
# credentials. On GCP there is no override: a service account's identity.
export STORAGE_EMULATOR_HOST=http://127.0.0.1:4443
export CLOUDSDK_API_ENDPOINT_OVERRIDES_STORAGE=http://127.0.0.1:4443/
export CLOUDSDK_AUTH_DISABLE_CREDENTIALS=true
export CLOUDSDK_CORE_PROJECT=$GOOGLE_CLOUD_PROJECT
