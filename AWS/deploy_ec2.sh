#!/bin/bash
set -ex
mkdir -p /opt/app
cd /opt/app
if [[ ! -d "repo" ]]; then
  git clone https://github.com/optravc/simple-cloud-lifecycle.git repo
fi
cd repo
# Force sync กับ remote main (ไม่ conflict แม้ branch diverge)
git fetch origin
git reset --hard origin/main

SECRETS=$(aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:ap-southeast-1:439855819034:secret:scl-sandbox/backend/env-bv4vDy --region ap-southeast-1 --query SecretString --output text)
echo "$SECRETS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > backend/.env

aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 439855819034.dkr.ecr.ap-southeast-1.amazonaws.com

docker compose pull
docker compose up -d

