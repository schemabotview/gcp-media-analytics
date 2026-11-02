# Priya's shell on Google Cloud: the real APIs, no emulator. Her project and
# identity come from gcloud; Terraform reads them as variables.
export TF_VAR_project_id=$(gcloud config get project 2>/dev/null)
export TF_VAR_operator="serviceAccount:$(gcloud config get account 2>/dev/null)"
export RAW=gs://$TF_VAR_project_id-raw
export TF_IN_AUTOMATION=1
export TF_VAR_billing_account=$GOOGLE_BILLING_ACCOUNT
