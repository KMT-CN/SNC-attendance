FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖：当存在 package-lock.json 时使用 npm ci，否则回退到 npm install
# 这样可以避免在仓库中缺少 lockfile 时构建失败（npm ci 需要 lockfile）
RUN if [ -f package-lock.json ]; then \
			npm ci --only=production; \
		else \
			npm install --only=production; \
		fi

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "src/server.js"]
