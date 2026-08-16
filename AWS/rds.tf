# ============================================================
# rds.tf — PostgreSQL RDS Instance + Subnet Group
# ============================================================

# ── DB Subnet Group (ต้องมีอย่างน้อย 2 AZ) ──────────────────

resource "aws_db_subnet_group" "main" {
  name        = "${local.name_prefix}-db-subnet-group"
  description = "Subnet group for ${local.name_prefix} PostgreSQL"
  subnet_ids  = aws_subnet.private[*].id

  tags = local.common_tags
}

# ── DB Parameter Group ───────────────────────────────────────

resource "aws_db_parameter_group" "postgres" {
  name        = "${local.name_prefix}-pg-params"
  family      = "postgres16"
  description = "Custom parameters for ${local.name_prefix} PostgreSQL"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # log queries ที่ใช้เวลา > 1 วินาที
  }

  tags = local.common_tags
}

# ── RDS Instance ─────────────────────────────────────────────

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  # Engine
  engine         = "postgres"
  engine_version = "16.9"
  instance_class = var.db_instance_class

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100 # auto-scaling storage สูงสุด 100 GB
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Config
  parameter_group_name = aws_db_parameter_group.postgres.name
  multi_az             = false # sandbox — ถ้า production ให้เปลี่ยนเป็น true

  # Backup
  backup_retention_period = 7
  backup_window           = "03:00-04:00"   # UTC (= 10:00-11:00 ICT)
  maintenance_window      = "sun:04:00-sun:05:00"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  # Lifecycle
  deletion_protection       = false # sandbox — production ให้เปลี่ยนเป็น true
  skip_final_snapshot       = true  # sandbox only
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres"
  })
}

# ── Enhanced Monitoring Role สำหรับ RDS ──────────────────────

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
