import type { Section } from '../types'

export const firstTerraform: Section = {
  id: 'first-terraform',
  title: 'A first Terraform file: the raw bucket, as code',
  scene: 'start-first-terraform',
  narration:
    "Every resource in this platform is created by Terraform, never by hand, so the first bucket is a short file of code. The editor shows main dot t f. The top pins the Google provider to an exact version and sets default labels, so everything this code creates is tagged app, env and owner. The highlighted block is the raw zone's bucket. Its name is built from the project i d, because bucket names are global across all of Google Cloud. It lives in europe west two, London, uses the Standard storage class, and has two safety settings switched on: uniform bucket level access, so permissions are only ever granted on the whole bucket, and public access prevention, so nothing in it can be made public. In the terminal, terraform init downloads the pinned provider. Then terraform apply plans one resource to add, shows it, and creates it in a few seconds. The last command reads the bucket back with g cloud: its name, its location, and its labels, including one Terraform adds by itself to mark what it provisioned. The side pane follows the path of that apply. Code goes to the provider, the provider calls the Cloud Storage A P I, the same one g cloud uses, and the bucket exists. One thing in this run is still fragile. Terraform remembers what it made in a state file, and right now that file sits on Priya's laptop. Next, the state moves to Google Cloud.",
}
