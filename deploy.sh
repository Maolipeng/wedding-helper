#!/bin/bash

# 配置
PROJECT_PATH="/root/fe-project/wedding-helper"
PM2_APP_NAME="wedding-helper"
GIT_BRANCH="main" 

# 执行部署
cd $PROJECT_PATH
git pull origin $GIT_BRANCH
pnpm install --frozen-lockfile
pnpm build
pm2 restart $PM2_APP_NAME