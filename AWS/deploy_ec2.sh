#!/bin/bash
set -ex
mkdir -p /opt/app
cd /opt/app
if [[ ! -d "repo" ]]; then
  git clone https://github.com/optravc/simple-cloud-lifecycle.git repo
fi
cd repo
git pull origin main || true

SECRETS=$(aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:ap-southeast-1:439855819034:secret:scl-sandbox/backend/env-bv4vDy --region ap-southeast-1 --query SecretString --output text)
echo "$SECRETS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > backend/.env

docker compose up -d --build
