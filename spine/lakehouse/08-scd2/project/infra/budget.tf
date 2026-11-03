resource "google_project_service" "budgets" {
  for_each           = toset(["billingbudgets.googleapis.com", "monitoring.googleapis.com"])
  service            = each.value
  disable_on_destroy = false
}

data "google_project" "this" {}

resource "google_monitoring_notification_channel" "email" {
  display_name = "media-data"
  type         = "email"
  labels       = { email_address = var.alert_email }
  depends_on   = [google_project_service.budgets]
}

# 80% of a month's budget, forecast or spent: an email, never a cut-off.
resource "google_billing_budget" "month" {
  billing_account = var.billing_account
  display_name    = "viewing-pulse-${var.env}"
  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }
  amount {
    specified_amount {
      currency_code = "GBP"
      units         = "50"
    }
  }
  threshold_rules {
    threshold_percent = 0.8
  }
  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "FORECASTED_SPEND"
  }
  all_updates_rule {
    monitoring_notification_channels = [google_monitoring_notification_channel.email.id]
    disable_default_iam_recipients   = true
  }
  depends_on = [google_project_service.budgets]
}
