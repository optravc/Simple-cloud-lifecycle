# ============================================================
# outputs.tf — Useful outputs after terraform apply
# ============================================================

# ── Networking ────────────────────────────────────────────────

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# ── ALB ───────────────────────────────────────────────────────

output "alb_dns_name" {
  description = "ALB DNS name — ใช้เปิดเว็บ"
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "Application URL (frontend)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "Backend API URL"
  value       = "http://${aws_lb.main.dns_name}/api"
}

# ── RDS ───────────────────────────────────────────────────────

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.main.port
}

# ── Cognito ───────────────────────────────────────────────────

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.backend.id
}

# ── S3 ────────────────────────────────────────────────────────

output "s3_reports_bucket" {
  description = "S3 reports bucket name"
  value       = aws_s3_bucket.reports.bucket
}

# ── SES ───────────────────────────────────────────────────────

output "ses_sender_email" {
  description = "SES verified sender email"
  value       = aws_ses_email_identity.sender.email
}

# ── Secrets Manager ──────────────────────────────────────────

output "secrets_manager_arn" {
  description = "Secrets Manager ARN for backend env vars"
  value       = aws_secretsmanager_secret.backend_secrets.arn
  sensitive   = true
}

# ── EC2 / ASG ─────────────────────────────────────────────────

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}

# ── CloudWatch ────────────────────────────────────────────────

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${local.name_prefix}-overview"
}

# ── Monthly Cost Estimate ─────────────────────────────────────

output "estimated_monthly_cost" {
  description = "Approximate monthly cost breakdown (USD)"
  value       = <<-EOT
    ┌────────────────────────────────────────────────┐
    │ Estimated Monthly Cost (ap-southeast-1)        │
    ├────────────────────────────────────────────────┤
    │ EC2 t3.micro (1x)          ~$7.59/mo           │
    │ RDS db.t3.micro (20GB)     ~$14.00/mo          │
    │ ALB                        ~$16.00/mo           │
    │ S3 + CloudWatch            ~$2.00/mo            │
    │ Secrets Manager            ~$0.40/mo            │
    ├────────────────────────────────────────────────┤
    │ TOTAL                      ~$58/mo              │
    │ (Covered by AWS Credit)                         │
    └────────────────────────────────────────────────┘
  EOT
}
