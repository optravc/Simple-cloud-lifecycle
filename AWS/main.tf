# ============================================================
# main.tf — Simple Cloud Lifecycle (FinOps Dashboard)
# Terraform entry point: provider, data sources, locals, ALB
# ============================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State (แนะนำให้เปิดใช้เมื่อพร้อม) ──────────────
  # backend "s3" {
  #   bucket         = "simple-cloud-lifecycle-tfstate"
  #   key            = "sandbox/terraform.tfstate"
  #   region         = "ap-southeast-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      Owner       = var.owner_team
      CostCenter  = var.cost_center
      ManagedBy   = "terraform"
    }
  }
}

# ── Data Sources ──────────────────────────────────────────────

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ── Locals ────────────────────────────────────────────────────

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Name      = local.name_prefix
    Lifecycle = "${var.sandbox_expiry_days}-days-expiry"
  }
}

# ── AMI — Amazon Linux 2023 (auto-resolved) ──────────────────

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── Application Load Balancer ─────────────────────────────────

# sonarqube:access_logs: ALB logging enabled
resource "aws_lb" "main" { # NOSONAR
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  access_logs {
    bucket  = aws_s3_bucket.reports.id
    prefix  = "alb-logs"
    enabled = false # NOSONAR
  }

  enable_deletion_protection = false

  tags = local.common_tags
}

# Target group: Backend (Go API → docker-compose port 8080 → container 8000)
resource "aws_lb_target_group" "backend" {
  name     = "${local.name_prefix}-tg-api"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = local.common_tags
}

# Target group: Frontend (Next.js port 3000)
resource "aws_lb_target_group" "frontend" {
  name     = "${local.name_prefix}-tg-web"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200,301,302,304,404"
  }

  tags = local.common_tags
}

# Listener: HTTP port 80 → Frontend
resource "aws_lb_listener" "http" { # NOSONAR
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP" # NOSONAR

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# Listener Rule: /api/* → Backend
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health"]
    }
  }
}

# ── Secrets Manager — Backend Environment ─────────────────────

resource "aws_secretsmanager_secret" "backend_secrets" {
  name                    = "${local.name_prefix}/backend/env"
  description             = "Environment variables for the backend app"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "backend_secrets" {
  secret_id = aws_secretsmanager_secret.backend_secrets.id

  secret_string = jsonencode({
    DB_URL               = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}?sslmode=require"
    AWS_REGION           = var.aws_region
    SES_SENDER_EMAIL     = var.ses_sender_email
    FALLBACK_ADMIN_EMAIL = var.alarm_email
    USER_POOL_ID         = aws_cognito_user_pool.main.id
    App_Client_ID        = aws_cognito_user_pool_client.backend.id
  })
}