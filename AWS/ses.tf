# ============================================================
# ses.tf — SES Email Identity for Notifications
# ============================================================

# ── Email Identity ────────────────────────────────────────────

resource "aws_ses_email_identity" "sender" {
  email = var.ses_sender_email
}

# ── SES Configuration Set (tracking + suppression) ───────────

resource "aws_ses_configuration_set" "main" {
  name = "${local.name_prefix}-config-set"

  # Reputation metrics
  reputation_metrics_enabled = true

  # Engagement tracking
  sending_enabled = true
}

# ── SNS Topic สำหรับ SES Bounce/Complaint notifications ──────

resource "aws_sns_topic" "ses_notifications" {
  name = "${local.name_prefix}-ses-notifications"
  tags = local.common_tags
}

resource "aws_ses_identity_notification_topic" "bounce" {
  topic_arn                = aws_sns_topic.ses_notifications.arn
  notification_type        = "Bounce"
  identity                 = aws_ses_email_identity.sender.email
  include_original_headers = false
}

resource "aws_ses_identity_notification_topic" "complaint" {
  topic_arn                = aws_sns_topic.ses_notifications.arn
  notification_type        = "Complaint"
  identity                 = aws_ses_email_identity.sender.email
  include_original_headers = false
}
