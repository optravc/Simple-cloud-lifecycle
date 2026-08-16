# ============================================================
# s3.tf — S3 Bucket for Cost Reports & Exports
# ============================================================

resource "aws_s3_bucket" "reports" {
  bucket = "${var.s3_reports_bucket_name}-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-reports"
    Purpose = "cost-reports-exports"
  })
}

# ── Block all public access ───────────────────────────────────

resource "aws_s3_bucket_public_access_block" "reports" {
  bucket = aws_s3_bucket.reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Encryption at rest ────────────────────────────────────────

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ── Versioning ────────────────────────────────────────────────

resource "aws_s3_bucket_versioning" "reports" {
  bucket = aws_s3_bucket.reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── Lifecycle rules — ลบไฟล์เก่าอัตโนมัติ ────────────────────

resource "aws_s3_bucket_lifecycle_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  rule {
    id     = "expire-old-reports"
    status = "Enabled"

    filter {
      prefix = "reports/"
    }

    # ย้ายไป Glacier หลัง 90 วัน
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # ลบทิ้งหลัง 365 วัน
    expiration {
      days = 365
    }
  }

  rule {
    id     = "cleanup-incomplete-multipart"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ── CORS — ให้ frontend เรียก presigned URL ได้ ───────────────

resource "aws_s3_bucket_cors_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
