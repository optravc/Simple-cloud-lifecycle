# ============================================================
# cloudwatch.tf — Log Groups, Alarms, SNS, Dashboard
# Cost-Optimized: ปิด RDS + ALB Alarms (ไม่มีทั้งสองตัวแล้ว)
# ============================================================

# ── SNS Topic สำหรับ Alarms ───────────────────────────────────

resource "aws_sns_topic" "alarms" {
  name              = "${local.name_prefix}-alarms"
  kms_master_key_id = "alias/aws/sns"
  tags              = local.common_tags
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

/* ── Cost-Optimized: ปิด RDS Log Group + Alarms ──────────────
   (ย้ายไป branch enterprise-arch สำหรับ Production)

resource "aws_cloudwatch_log_group" "rds" {
  name              = "/aws/rds/instance/${local.name_prefix}-postgres/postgresql"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" { ... }
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" { ... }
resource "aws_cloudwatch_metric_alarm" "rds_connections_high" { ... }
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" { ... }
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" { ... }
*/

# ── CloudWatch Dashboard — FinOps Overview (EC2 Only) ─────────

resource "aws_cloudwatch_dashboard" "finops" {
  dashboard_name = "${local.name_prefix}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "EC2 App Server — CPU"
          region = var.aws_region
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app.name, { stat = "Average" }]
          ]
          period = 300
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Custom — Memory & Disk Utilization"
          region = var.aws_region
          metrics = [
            ["SimpleCloudLifecycle", "mem_used_percent", "AutoScalingGroupName", aws_autoscaling_group.app.name],
            ["SimpleCloudLifecycle", "disk_used_percent", "AutoScalingGroupName", aws_autoscaling_group.app.name]
          ]
          period = 300
          stat   = "Average"
          view   = "timeSeries"
        }
      }
    ]
  })
}
