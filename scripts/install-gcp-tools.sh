#!/usr/bin/env bash
# Install the course's pinned Google Cloud tooling (COURSE-PLAN.md, "Stack and pins"). Idempotent;
# usable as part of the cloud environment's setup script, after install-toolchain.sh.
#
#   fake-gcs-server  FAKE_GCS_VERSION  Cloud Storage's emulator (JSON API), the raw zone on Priya's
#                                     laptop; the release's Linux binary at /usr/local/bin
#   Terraform        TF_VERSION        HashiCorp's release zip, its SHA256 checked against the
#                                     release's SHA256SUMS. The google provider comes from the
#                                     registry at `terraform init`, pinned by infra/'s
#                                     required_providers and the committed .terraform.lock.hcl.
#   gcloud / bq      (present)         the Google Cloud CLI; its version is recorded, not installed
#                                     here (the cloud image ships one)
set -euo pipefail
FAKE_GCS_VERSION="${FAKE_GCS_VERSION:-1.56.1}"
TF_VERSION="${TF_VERSION:-1.17.0}"

if [[ "$(cat /usr/local/share/fake-gcs-server.version 2>/dev/null)" != "$FAKE_GCS_VERSION" ]]; then
  work=$(mktemp -d)
  tgz="fake-gcs-server_${FAKE_GCS_VERSION}_Linux_amd64.tar.gz"
  curl -fsSL -o "$work/$tgz" "https://github.com/fsouza/fake-gcs-server/releases/download/v${FAKE_GCS_VERSION}/$tgz"
  tar xzf "$work/$tgz" -C "$work" fake-gcs-server
  install -m 755 "$work/fake-gcs-server" /usr/local/bin/fake-gcs-server
  echo "$FAKE_GCS_VERSION" > /usr/local/share/fake-gcs-server.version
  rm -rf "$work"
fi

if ! terraform version 2>/dev/null | grep -qx "Terraform v${TF_VERSION}"; then
  work=$(mktemp -d)
  zip="terraform_${TF_VERSION}_linux_amd64.zip"
  base="https://releases.hashicorp.com/terraform/${TF_VERSION}"
  curl -fsSL -o "$work/$zip" "$base/$zip"
  curl -fsSL -o "$work/sums" "$base/terraform_${TF_VERSION}_SHA256SUMS"
  (cd "$work" && grep " ${zip}\$" sums | sha256sum -c --quiet)
  python3 -m zipfile -e "$work/$zip" "$work/out"
  install -m 755 "$work/out/terraform" /usr/local/bin/terraform
  rm -rf "$work"
fi

# The Pub/Sub emulator (Course 6): a gcloud component, run by scripts/spine.py with java
gcloud components list --filter="id:pubsub-emulator" --format="value(state.name)" 2>/dev/null | grep -q Installed \
  || gcloud components install pubsub-emulator beta --quiet >/dev/null 2>&1 || echo "pubsub-emulator: install it with gcloud components"

echo "fake-gcs-server $(cat /usr/local/share/fake-gcs-server.version)"
terraform version | head -1
gcloud version 2>/dev/null | head -1 || echo "gcloud: not installed (needed only to record)"
