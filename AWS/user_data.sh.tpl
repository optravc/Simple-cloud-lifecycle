#!/bin/bash
set -euxo pipefail

# ============================================================
# User Data Script — Simple Cloud Lifecycle App Server
# ติดตั้ง Docker + Docker Compose แล้ว deploy ผ่าน docker-compose
# ============================================================

# ── Variables from Terraform template ─────────────────────────
AWS_REGION="${aws_region}"
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
SECRET_ARN="${secret_arn}"
LOG_GROUP="${log_group_name}"

# ── System updates ────────────────────────────────────────────
dnf update -y
dnf install -y docker git jq amazon-cloudwatch-agent

# ── Start Docker ──────────────────────────────────────────────
systemctl enable docker
systemctl start docker

# ── Install Docker Compose v2 ─────────────────────────────────
DOCKER_COMPOSE_VERSION="v2.29.1"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/$${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── CloudWatch Agent config ──────────────────────────────────
cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json <<'CWAGENT'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/app/backend.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "backend-{instance_id}",
            "retention_in_days": 30
          },
          {
            "file_path": "/var/log/app/frontend.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "frontend-{instance_id}",
            "retention_in_days": 30
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "SimpleCloudLifecycle",
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["disk_used_percent"], "resources": ["*"] }
    },
    "append_dimensions": {
      "InstanceId": "$${aws:InstanceId}",
      "AutoScalingGroupName": "$${aws:AutoScalingGroupName}"
    }
  }
}
CWAGENT

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json -s

# ── Create app directory ──────────────────────────────────────
mkdir -p /opt/app /var/log/app

# ── Fetch secrets from Secrets Manager ────────────────────────
SECRETS=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ARN" \
  --region "$AWS_REGION" \
  --query SecretString --output text)

# สร้าง .env file จาก secrets
echo "$SECRETS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > /opt/app/.env

# ── Clone repository & deploy ─────────────────────────────────
mkdir -p /opt/app/repo
git clone https://github.com/optravc/Simple-cloud-lifecycle.git /opt/app/repo
cd /opt/app/repo

# Copy .env to backend
cp /opt/app/.env backend/.env

# ── Docker Compose — build & run ──────────────────────────────
docker compose up -d --build 2>&1 | tee /var/log/app/deploy.log

# ── Redirect container logs to files ──────────────────────────
docker compose logs -f backend-api  > /var/log/app/backend.log  2>&1 &
docker compose logs -f frontend-web > /var/log/app/frontend.log 2>&1 &

# ── Health check loop ─────────────────────────────────────────
MAX_RETRIES=30
RETRY=0
until curl -sf http://localhost:8080/health > /dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "ERROR: Backend health check failed after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Waiting for backend... ($RETRY/$MAX_RETRIES)"
  sleep 10
done

echo "=== Deployment complete! ==="
