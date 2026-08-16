# ============================================================
# iam.tf — Least Privilege IAM Roles & Policies for FinOps Backend
# ============================================================

# ── Backend Runtime Policies (สิทธิ์จำกัดเฉพาะที่ระบบใช้จริง) ───────

# 1. EC2 & Unattached Waste Inspector & Sweeper Actions
resource "aws_iam_role_policy" "app_ec2" {
  name = "${local.name_prefix}-app-ec2"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2:DescribeVolumes",
          "ec2:DescribeAddresses",
          "ec2:DescribeTags"
        ]
        Resource = "*" # NOSONAR
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:TerminateInstances",
          "ec2:RunInstances",
          "ec2:CreateImage",
          "ec2:CreateTags"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:volume/*",
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:image/*"
        ]
      }
    ]
  })
}

# 2. Cost Explorer & ML Financial Analytics (Read-Only)
resource "aws_iam_role_policy" "app_cost_explorer" {
  name = "${local.name_prefix}-app-cost-explorer"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetUsageForecast",
        "ce:GetDimensionValues",
        "ce:GetTags",
        "ce:GetAnomalies",
        "ce:GetSavingsPlansPurchaseRecommendation"
      ]
      Resource = [
        "arn:aws:ce:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      ]
    }]
  })
}

# 3. AWS Compute Optimizer Rightsizing (Read-Only)
resource "aws_iam_role_policy" "app_compute_optimizer" {
  name = "${local.name_prefix}-app-compute-optimizer"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "compute-optimizer:GetEC2InstanceRecommendations",
        "compute-optimizer:GetEnrollmentStatus",
        "compute-optimizer:GetRecommendationSummaries"
      ]
      Resource = [
        "arn:aws:compute-optimizer:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      ]
    }]
  })
}

# 4. CloudWatch Metrics
resource "aws_iam_role_policy" "app_cloudwatch" {
  name = "${local.name_prefix}-app-cloudwatch"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ]
      Resource = [
        "arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      ]
    }]
  })
}

# 5. S3 Bucket (Scoped strictly to Reports Bucket ARN)
resource "aws_iam_role_policy" "app_s3" {
  name = "${local.name_prefix}-app-s3"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.reports.arn,
        "${aws_s3_bucket.reports.arn}/*"
      ]
    }]
  })
}

# 6. SES Email Notification (Scoped strictly to Sender Email Condition)
resource "aws_iam_role_policy" "app_ses" {
  name = "${local.name_prefix}-app-ses"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ]
      Resource = [
        "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/*"
      ]
      Condition = {
        StringEquals = {
          "ses:FromAddress" = var.ses_sender_email
        }
      }
    }]
  })
}

# 7. Cognito Authentication (Scoped strictly to User Pool ARN)
resource "aws_iam_role_policy" "app_cognito" {
  name = "${local.name_prefix}-app-cognito"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cognito-idp:AdminGetUser",
        "cognito-idp:ListUsers",
        "cognito-idp:AdminListGroupsForUser"
      ]
      Resource = aws_cognito_user_pool.main.arn
    }]
  })
}