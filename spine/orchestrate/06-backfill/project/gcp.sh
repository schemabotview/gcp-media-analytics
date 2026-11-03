# Priya's shell on Google Cloud: the real APIs, no emulator. Her project and
# identity come from gcloud; Terraform reads them as variables.
export TF_VAR_project_id=$(gcloud config get project 2>/dev/null)
export TF_VAR_operator="serviceAccount:$(gcloud config get account 2>/dev/null)"
export RAW=gs://$TF_VAR_project_id-raw
export TF_IN_AUTOMATION=1
export TF_VAR_billing_account=$GOOGLE_BILLING_ACCOUNT
# The Dataflow job's identity and staging bucket (Course 7)
export DATAFLOW_SA=sa-dataflow@$TF_VAR_project_id.iam.gserviceaccount.com
export STAGING=gs://$TF_VAR_project_id-dataflow
# The Spark batches' identity (Course 9)
export DATAPROC_SA=sa-dataproc@$TF_VAR_project_id.iam.gserviceaccount.com
