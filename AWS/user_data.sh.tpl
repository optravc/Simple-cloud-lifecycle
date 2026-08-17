#!/bin/bash
# ============================================================
# User Data Script — Simple Cloud Lifecycle App Server
# ติดตั้ง Docker + Docker Compose แล้ว deploy ผ่าน docker-compose
# ============================================================
# NOTE: ไม่ใช้ set -e เพื่อไม่ให้ script crash กลางทาง
#       ใช้ error handling แบบ explicit แทน
set -uo pipefail
exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1
echo "=== User Data START: $(date) ==="

# ── Variables from Terraform template ─────────────────────────
AWS_REGION="${aws_region}"
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
SECRET_ARN="${secret_arn}"
LOG_GROUP="${log_group_name}"

# ── Create 2GB Swap File (RAM Extension for t3.micro) ─────────
if [ ! -f /swapfile ]; then
  echo "--- Creating 2GB swap file ---"
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "--- Swap created: $(free -h) ---"
fi

# ── Install Docker (Amazon Linux 2023) ────────────────────────
echo "--- Installing Docker ---"
dnf install -y docker jq git 2>&1 || yum install -y docker jq git 2>&1
systemctl enable docker
systemctl start docker

# รอให้ Docker daemon พร้อม
for i in $(seq 1 12); do
  docker info > /dev/null 2>&1 && break
  echo "Waiting for Docker daemon... ($i/12)"
  sleep 5
done

# ── Install Docker Compose v2 ─────────────────────────────────
echo "--- Installing Docker Compose ---"
DOCKER_COMPOSE_VERSION="v2.29.1"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/download/$${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version

# ── CloudWatch Agent config ──────────────────────────────────
echo "--- Configuring CloudWatch Agent ---"
cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json <<'CWAGENT'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "userdata-{instance_id}",
            "retention_in_days": 14
          },
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
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json -s || true

# ── Create app directory ──────────────────────────────────────
mkdir -p /opt/app /var/log/app

# ── Fetch secrets from Secrets Manager (retry 5x) ─────────────
echo "--- Fetching secrets from Secrets Manager ---"
SECRETS=""
for i in $(seq 1 5); do
  SECRETS=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ARN" \
    --region "$AWS_REGION" \
    --query SecretString --output text 2>/dev/null) && break
  echo "Secrets fetch attempt $i/5 failed, retrying in 10s..."
  sleep 10
done

if [ -z "$SECRETS" ]; then
  echo "WARNING: Could not fetch secrets, using empty .env"
  touch /opt/app/.env
else
  echo "$SECRETS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > /opt/app/.env
  echo "--- Secrets written to .env ($(wc -l < /opt/app/.env) keys) ---"
fi

# ── Clone repository ──────────────────────────────────────────
echo "--- Cloning repository ---"
rm -rf /opt/app/repo
git clone https://github.com/optravc/Simple-cloud-lifecycle.git /opt/app/repo 2>&1
cd /opt/app/repo

# Copy .env to backend
cp /opt/app/.env backend/.env

# ── Docker Compose — build & run ──────────────────────────────
echo "--- Starting docker compose (build + up) ---"
# จำกัด Go compiler ให้ใช้ CPU core เดียว + GC เร็วขึ้น เพื่อประหยัด RAM บน t3.micro
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# build backend ก่อน แล้วค่อย frontend เพื่อไม่ให้ RAM ชนกัน
docker compose build --no-cache \
  --build-arg GOGC=50 \
  --build-arg GOMAXPROCS=1 \
  backend-api 2>&1 | tee /var/log/app/deploy.log

docker compose build --no-cache frontend-web 2>&1 | tee -a /var/log/app/deploy.log

docker compose up -d 2>&1 | tee -a /var/log/app/deploy.log

# ── Redirect container logs to files ──────────────────────────
docker compose logs -f backend-api  > /var/log/app/backend.log  2>&1 &
docker compose logs -f frontend-web > /var/log/app/frontend.log 2>&1 &

# ── Health check loop — Backend API ──────────────────────────
echo "--- Waiting for backend health check (port 8080) ---"
MAX_RETRIES=36   # 36 x 10s = 6 minutes
RETRY=0
until curl -sf http://localhost:8080/health > /dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "WARNING: Backend health check failed after $MAX_RETRIES attempts (non-fatal)"
    echo "--- Docker container status ---"
    docker compose ps
    docker compose logs --tail=50 backend-api
    break   # ไม่ exit! ให้ ALB health check ตัดสินเอง
  fi
  echo "Waiting for backend... ($RETRY/$MAX_RETRIES)"
  sleep 10
done

# ── Health check loop — Frontend ─────────────────────────────
echo "--- Waiting for frontend health check (port 3000) ---"
MAX_RETRIES_FE=24  # 24 x 5s = 2 minutes
RETRY_FE=0
until curl -sf http://localhost:3000 > /dev/null 2>&1; do
  RETRY_FE=$((RETRY_FE + 1))
  if [ $RETRY_FE -ge $MAX_RETRIES_FE ]; then
    echo "WARNING: Frontend health check timeout (non-fatal)"
    docker compose logs --tail=30 frontend-web
    break
  fi
  echo "Waiting for frontend... ($RETRY_FE/$MAX_RETRIES_FE)"
  sleep 5
done

echo "=== Deployment complete: $(date) ==="
echo "--- Final container status ---"
docker compose ps
echo "--- Memory usage ---"
free -h
