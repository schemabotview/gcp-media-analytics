# The role matrix as Google holds it: every binding of the five job
# accounts, on the project and on the raw bucket. Nothing else is listed.
set -euo pipefail
JOBS='^serviceAccount:sa-(ingest|dataflow|dataproc|airflow|cicd)@'
matrix() {
  jq -r --arg jobs "$JOBS" '.bindings[] | .role as $r | .members[]
    | select(test($jobs)) | "  \(split("@")[0][15:])  \($r)"' | sort
}
echo "project $TF_VAR_project_id"
gcloud projects get-iam-policy "$TF_VAR_project_id" --format=json | matrix
echo "bucket $RAW"
gcloud storage buckets get-iam-policy "$RAW" --format=json | matrix
