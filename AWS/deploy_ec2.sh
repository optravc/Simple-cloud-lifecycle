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

SECRETS=$(aws secretsmanager get-secret-value --secret-id scl-sandbox/backend/env --region ap-southeast-2 --query SecretString --output text)
echo "$SECRETS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' > backend/.env

aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 010596578619.dkr.ecr.ap-southeast-2.amazonaws.com

docker compose pull
docker compose up -d

