# ============================================================
# variables.tf — Simple Cloud Lifecycle (FinOps Dashboard)
# ============================================================

variable "aws_region" {
  description = "AWS Region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "simple-cloud-lifecycle"
}

variable "environment" {
  description = "Deployment environment (sandbox | staging | production)"
  type        = string
  default     = "sandbox"

  validation {
    condition     = contains(["sandbox", "staging", "production"], var.environment)
    error_message = "Environment must be one of: sandbox, staging, production."
  }
}

variable "owner_team" {
  description = "Team that owns the resources"
  type        = string
  default     = "team-alpha"
}

variable "cost_center" {
  description = "Cost center for billing allocation"
  type        = string
  default     = "rd-department"
}

# ── Lifecycle ───────────────────────────────────────────────

variable "sandbox_expiry_days" {
  description = "Number of days before sandbox resources are auto-stopped by Cloud Custodian"
  type        = number
  default     = 14
}

# ── Networking ──────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AZs to deploy subnets into"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (ALB)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (ECS tasks + RDS)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ── RDS ─────────────────────────────────────────────────────

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "postgres"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "optravc"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password (use Secrets Manager in production)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ── EC2 / Docker Compose ─────────────────────────────────────

variable "app_instance_type" {
  description = "EC2 instance type for app server (backend + frontend via docker-compose)"
  type        = string
  default     = "t3.micro" # Free tier eligible, ~$7/month
}

variable "app_max_instances" {
  description = "Maximum number of EC2 instances in ASG (min is always 1)"
  type        = number
  default     = 2
}

# ── Cognito ──────────────────────────────────────────────────

variable "cognito_user_pool_name" {
  description = "Name for the Cognito User Pool"
  type        = string
  default     = "simple-cloud-lifecycle-users"
}

# ── SES ─────────────────────────────────────────────────────

variable "ses_sender_email" {
  description = "Verified email address used as SES sender"
  type        = string
  default     = "noptrapk@gmail.com"
}

# ── S3 ───────────────────────────────────────────────────────

variable "s3_reports_bucket_name" {
  description = "S3 bucket name for cost reports / exports (must be globally unique)"
  type        = string
  default     = "simple-cloud-lifecycle-reports"
}

# ── CloudWatch ───────────────────────────────────────────────

variable "log_retention_days" {
  description = "CloudWatch log group retention period in days"
  type        = number
  default     = 30
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm SNS notifications"
  type        = string
  default     = "noptrapk@gmail.com"
}
