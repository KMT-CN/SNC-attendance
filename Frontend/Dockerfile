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

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
