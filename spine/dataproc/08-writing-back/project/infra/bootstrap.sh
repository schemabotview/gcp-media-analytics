# The state bucket: the one thing the CLI makes, because Terraform needs
# somewhere to keep its state before it can make anything else.
set -euo pipefail
STATE="gs://$TF_VAR_project_id-tfstate"
if ! gcloud storage buckets describe "$STATE" >/dev/null 2>&1; then
  gcloud storage buckets create "$STATE" --location=europe-west2 \
    --uniform-bucket-level-access --public-access-prevention --quiet
  gcloud storage buckets update "$STATE" --versioning --quiet
fi
echo "state: $STATE, versioned, ready"
