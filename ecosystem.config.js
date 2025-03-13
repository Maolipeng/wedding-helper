module.exports = {
  apps: [{
    name: "wedding-helper",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 3001 -H '0.0.0.0'",
    instances: "max",
    exec_mode: "cluster",
    watch: false,
    env: {
      PORT: 3001,
      NODE_ENV: "production",
        HOST: "0.0.0.0"
      // 不在这里放置敏感信息
    },
    // 使用环境变量文件
    env_file: ".env.production"
  }]
}