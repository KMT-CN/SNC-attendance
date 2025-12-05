# Stage 1: Build the application
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (or yarn.lock)
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有前端文件
COPY . .

# 构建静态文件
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# 从 builder 阶段复制构建好的文件到 Nginx 根目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置模板 (不放在 /etc/nginx/templates/ 以避免被默认脚本处理)
COPY nginx.conf /etc/nginx/nginx.conf.template

# 暴露端口
EXPOSE 80

# 启动 Nginx
# 1. 使用 envsubst 替换 Nginx 配置中的 ${BACKEND_API_URL}
# 2. 根据环境变量 JS_API_BASE_URL 生成 config.js，注入到前端代码中
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_API_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && echo \"window.ENV = { API_BASE_URL: '${JS_API_BASE_URL:-/api}' };\" > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]
