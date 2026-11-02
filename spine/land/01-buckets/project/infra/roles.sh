# The role matrix as Google holds it: every binding of an sa-* account,
# on the project and on the raw bucket.
set -euo pipefail
echo "project $TF_VAR_project_id"
gcloud projects get-iam-policy "$TF_VAR_project_id" --format=json |
  jq -r '.bindings[] | .role as $r | .members[] | select(test("sa-"))
         | "  \(split("@")[0] | ltrimstr("serviceAccount:"))  \($r)"' | sort
echo "bucket $RAW"
gcloud storage buckets get-iam-policy "$RAW" --format=json |
  jq -r '.bindings[] | .role as $r | .members[] | select(test("sa-"))
         | "  \(split("@")[0] | ltrimstr("serviceAccount:"))  \($r)"' | sort
