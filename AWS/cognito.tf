# ============================================================
# cognito.tf — Cognito User Pool + App Client
# ============================================================

# ── User Pool ────────────────────────────────────────────────

resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name

  # ใช้ Email เป็น username
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # MFA — Off สำหรับ sandbox
  mfa_configuration = "OFF"

  # Email configuration — ใช้ Cognito default สำหรับ sandbox
  # production: เปลี่ยนเป็น SES
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Schema attributes (เพิ่ม custom attribute)
  schema {
    attribute_data_type      = "String"
    name                     = "role"
    mutable                  = true
    required                 = false
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  # User Pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF" # sandbox — production: "ENFORCED"
  }

  tags = local.common_tags
}

# ── App Client (สำหรับ Go backend ตรวจสอบ JWT) ───────────────

resource "aws_cognito_user_pool_client" "backend" {
  name         = "${local.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # ไม่ต้องการ Client Secret (SPA/Mobile pattern)
  generate_secret = false

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Token validity
  access_token_validity  = 1   # ชั่วโมง
  id_token_validity      = 1   # ชั่วโมง
  refresh_token_validity = 30  # วัน

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Prevent user existence errors (security best practice)
  prevent_user_existence_errors = "ENABLED"

  # Allowed callback URLs (สำหรับ hosted UI ถ้าใช้)
  callback_urls = ["http://localhost:3000/callback"]
  logout_urls   = ["http://localhost:3000"]
}

# ── Admin Group (สำหรับ RBAC ใน backend) ─────────────────────

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator group with full access"
  precedence   = 1
}

resource "aws_cognito_user_group" "viewer" {
  name         = "viewer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Read-only viewer group"
  precedence   = 10
}
