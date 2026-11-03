output "emails" {
  value = { for k, sa in google_service_account.job : k => sa.email }
}
