# ============================================================
# ec2.tf — EC2 Auto Scaling Group + Docker Compose
# Production-ready & cost-effective deployment
# ============================================================

# ── Launch Template ───────────────────────────────────────────

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.app_instance_type

  # IAM Instance Profile
  iam_instance_profile {
    arn = aws_iam_instance_profile.app_server.arn
  }

  network_interfaces {
    # tfsec:ignore:aws-ec2-no-public-ip
    # sonarqube:S6329: sandbox scope without NAT gateway
    associate_public_ip_address = true # NOSONAR
    security_groups             = [aws_security_group.app_server.id]
  }

  # EBS Root Volume — encrypted
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  # Metadata options — IMDSv2 enforced (security best practice)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  # User data — install Docker, clone repo, run docker-compose
  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    aws_region     = var.aws_region
    project_name   = var.project_name
    environment    = var.environment
    secret_arn     = aws_secretsmanager_secret.backend_secrets.arn
    log_group_name = aws_cloudwatch_log_group.app_server.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-server"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-volume"
    })
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# ── Auto Scaling Group — self-healing (min=1, max=2) ──────────

resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-asg"
  desired_capacity    = 1
  min_size            = 1
  max_size            = var.app_max_instances
  vpc_zone_identifier = aws_subnet.public[*].id

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  # ALB integration
  target_group_arns = [
    aws_lb_target_group.backend.arn,
    aws_lb_target_group.frontend.arn
  ]

  # EC2 health check type prevents ASG from terminating instance while Docker builds
  health_check_type         = "EC2"
  health_check_grace_period = 2700 # 45 min

  # Instance refresh — rolling update เมื่อเปลี่ยน launch template
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 0 # sandbox: ยอมให้ downtime ได้ (instance เดียว)
      instance_warmup        = 300
    }
  }

  # Termination policy
  termination_policies = ["OldestInstance"]

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app-server"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Lifecycle"
    value               = "${var.sandbox_expiry_days}-days-expiry"
    propagate_at_launch = true
  }
}

# ── Security Group — App Server ───────────────────────────────

resource "aws_security_group" "app_server" {
  name        = "${local.name_prefix}-sg-app-server"
  # NOTE: description ห้ามแก้! จะทำให้ Terraform force-replace SG ทั้งตัว
  description = "Allow ALB traffic to app server (backend:8000 + frontend:3000)"
  vpc_id      = aws_vpc.main.id

  # Frontend Web (port 3000) จาก ALB
  ingress {
    description     = "Frontend Web 3000 from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Backend API (port 8080) จาก ALB — docker-compose maps 8080(host)→8000(container)
  ingress {
    description     = "Backend API 8080 from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Outbound — ให้ออก internet ได้ (Docker pull, AWS APIs, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-sg-app-server" })
}

# ── IAM Instance Profile ──────────────────────────────────────

resource "aws_iam_role" "app_server" {
  name = "${local.name_prefix}-app-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_instance_profile" "app_server" {
  name = "${local.name_prefix}-app-server-profile"
  role = aws_iam_role.app_server.name
}

# SSM — ให้ SSH ผ่าน Session Manager ได้ (ไม่ต้องเปิด port 22)
resource "aws_iam_role_policy_attachment" "app_server_ssm" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch Agent — ส่ง logs ไป CloudWatch
resource "aws_iam_role_policy_attachment" "app_server_cloudwatch" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Secrets Manager — อ่าน backend secrets
resource "aws_iam_role_policy" "app_server_secrets" {
  name = "${local.name_prefix}-app-server-secrets"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.backend_secrets.arn
    }]
  })
}

# ECR — อ่านและดึง images จาก ECR
resource "aws_iam_role_policy_attachment" "app_server_ecr" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# EC2 ReadOnly Access
resource "aws_iam_role_policy_attachment" "app_server_ec2_readonly" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"
}

# Billing ReadOnly Access
resource "aws_iam_role_policy_attachment" "app_server_billing_readonly" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/AWSBillingReadOnlyAccess"
}

# CloudWatch ReadOnly Access
resource "aws_iam_role_policy_attachment" "app_server_cloudwatch_readonly" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
}

# Compute Optimizer ReadOnly Access
resource "aws_iam_role_policy_attachment" "app_server_compute_optimizer_readonly" {
  role       = aws_iam_role.app_server.name
  policy_arn = "arn:aws:iam::aws:policy/ComputeOptimizerReadOnlyAccess"
}

# Cost Explorer & FinOps Policy
resource "aws_iam_role_policy" "app_server_finops" {
  name = "${local.name_prefix}-finops-policy"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = [
        "ce:*",
        "aws-portal:ViewBilling",
        "aws-portal:ViewUsage"
      ]
      Resource = "*"
    }]
  })
}

# EC2 Lifecycle Management Policy (RunInstances, StopInstances, TerminateInstances, CreateTags)
resource "aws_iam_role_policy" "app_server_ec2_manage" {
  name = "${local.name_prefix}-ec2-manage-policy"
  role = aws_iam_role.app_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:RunInstances",
        "ec2:StopInstances",
        "ec2:StartInstances",
        "ec2:TerminateInstances",
        "ec2:CreateTags",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:DescribeImages",
        "ec2:DescribeKeyPairs"
      ]
      Resource = "*"
    }]
  })
}

# CloudWatch Log Group สำหรับ App Server
resource "aws_cloudwatch_log_group" "app_server" {
  name              = "/ec2/${local.name_prefix}/app-server"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# ── CloudWatch Alarms — EC2 ───────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "app_cpu_high" {
  alarm_name          = "${local.name_prefix}-app-cpu-high"
  alarm_description   = "App Server CPU utilization > 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "app_status_check" {
  alarm_name          = "${local.name_prefix}-app-status-check-failed"
  alarm_description   = "App Server status check failed"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "breaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  tags          = local.common_tags
}
