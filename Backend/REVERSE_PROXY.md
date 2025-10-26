# 反向代理配置指南

后端服务默认只监听 `127.0.0.1:10234`（端口可配置），不直接暴露到公网。你需要使用反向代理工具将服务对外发布。

## 🔧 支持的反向代理工具

### 1. Nginx（推荐）

#### 安装 Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**Windows:**
下载并安装：https://nginx.org/en/download.html

#### 基础配置（HTTP）

创建配置文件 `/etc/nginx/sites-available/attendance`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:10234/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:10234/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 前端静态文件（可选）
    location / {
        root /var/www/attendance/frontend;
        try_files $uri $uri/ /index.html;
    }

    # 日志
    access_log /var/log/nginx/attendance-access.log;
    error_log /var/log/nginx/attendance-error.log;
}
```

#### HTTPS 配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置 Nginx
sudo certbot --nginx -d your-domain.com

# 证书会自动续期
sudo certbot renew --dry-run
```

自动生成的 HTTPS 配置示例：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 其他配置同上...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 2. Caddy（自动 HTTPS）

#### 安装 Caddy

```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### Caddyfile 配置

创建 `/etc/caddy/Caddyfile`：

```caddyfile
your-domain.com {
    # 自动 HTTPS
    encode gzip
    
    # API 反向代理
    handle /api/* {
        reverse_proxy 127.0.0.1:10234
    }
    
    # 健康检查
    handle /health {
        reverse_proxy 127.0.0.1:10234
    }
    
    # 前端静态文件
    handle {
        root * /var/www/attendance/frontend
        file_server
        try_files {path} /index.html
    }
    
    # 日志
    log {
        output file /var/log/caddy/attendance.log
    }
}
```

启动 Caddy：

```bash
sudo systemctl enable caddy
sudo systemctl start caddy
```

**优势**：自动获取和续期 Let's Encrypt 证书，配置简单！

---

### 3. Apache（传统方案）

#### 安装 Apache

```bash
sudo apt install apache2
sudo a2enmod proxy proxy_http ssl rewrite headers
```

#### 配置文件

创建 `/etc/apache2/sites-available/attendance.conf`：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass /api/ http://127.0.0.1:10234/api/
    ProxyPassReverse /api/ http://127.0.0.1:10234/api/
    
    ProxyPass /health http://127.0.0.1:10234/health
    ProxyPassReverse /health http://127.0.0.1:10234/health
    
    # 前端静态文件
    DocumentRoot /var/www/attendance/frontend
    <Directory /var/www/attendance/frontend>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/attendance-error.log
    CustomLog ${APACHE_LOG_DIR}/attendance-access.log combined
</VirtualHost>
```

启用配置：

```bash
sudo a2ensite attendance.conf
sudo systemctl reload apache2

# 配置 HTTPS
sudo certbot --apache -d your-domain.com
```

---

### 4. Cloudflare Tunnel（无需开放端口）

#### 安装 cloudflared

```bash
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# 下载：https://github.com/cloudflare/cloudflared/releases
```

#### 登录并创建隧道

```bash
# 登录 Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create attendance-backend

# 创建配置文件 ~/.cloudflared/config.yml
```

配置文件内容：

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: api.your-domain.com
    service: http://127.0.0.1:10234
  - service: http_status:404
```

#### 配置 DNS 并启动

```bash
# 配置 DNS 记录
cloudflared tunnel route dns attendance-backend api.your-domain.com

# 启动隧道
cloudflared tunnel run attendance-backend

# 作为服务运行
sudo cloudflared service install
sudo systemctl start cloudflared
```

**优势**：
- ✅ 无需开放防火墙端口
- ✅ 自动 HTTPS
- ✅ DDoS 防护
- ✅ 全球 CDN 加速

---

### 5. Traefik（容器化环境）

如果你使用 Docker Compose，可以添加 Traefik：

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=your@email.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    networks:
      - attendance-network

  backend:
    # ... 你的后端配置
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.your-domain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=myresolver"
      - "traefik.http.services.backend.loadbalancer.server.port=10234"
```

---

## 📊 反向代理工具对比

| 工具 | 难度 | HTTPS | 性能 | 特色 |
|------|------|-------|------|------|
| **Nginx** | ⭐⭐ | 手动配置 | ⭐⭐⭐⭐⭐ | 最流行，文档丰富 |
| **Caddy** | ⭐ | 自动配置 | ⭐⭐⭐⭐ | 配置简单，自动 HTTPS |
| **Apache** | ⭐⭐⭐ | 手动配置 | ⭐⭐⭐ | 传统方案，功能强大 |
| **Cloudflare Tunnel** | ⭐⭐ | 自动配置 | ⭐⭐⭐⭐ | 无需开放端口，带 CDN |
| **Traefik** | ⭐⭐⭐ | 自动配置 | ⭐⭐⭐⭐ | 容器化原生支持 |

## 🎯 推荐方案

### 场景1：VPS 服务器部署
→ **Caddy**（最简单）或 **Nginx**（最流行）

### 场景2：家庭网络/内网穿透
→ **Cloudflare Tunnel**（无需公网 IP）

### 场景3：Docker 环境
→ **Traefik**（容器原生）

### 场景4：企业生产环境
→ **Nginx**（稳定性最高）

## 🔒 安全建议

1. **启用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 使用 Let's Encrypt 免费证书

2. **配置防火墙**
   ```bash
   # 只开放 80 和 443 端口
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **限制访问速率**
   - Nginx: `limit_req_zone`
   - Caddy: `rate_limit`
   - Cloudflare: 自动 DDoS 防护

4. **配置 CORS**
   - 在 `.env` 中设置 `CORS_ORIGIN` 为你的前端域名
   - 不要在生产环境使用 `CORS_ORIGIN=*`

5. **启用 HTTP/2**
   - Nginx: `listen 443 ssl http2`
   - Caddy: 自动启用
   - 提升性能

## 📝 测试反向代理

```bash
# 测试后端直接访问（应该可以）
curl http://127.0.0.1:10234/health

# 测试反向代理（应该返回相同结果）
curl https://your-domain.com/health

# 测试 API
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'
```

## 🆘 故障排查

### 502 Bad Gateway
- 检查后端服务是否运行：`docker ps`
- 检查端口是否正确：`netstat -tlnp | grep 10234`
- 查看后端日志：`docker logs snc-attendance-backend`

### 证书错误
- 确认域名解析正确：`nslookup your-domain.com`
- 重新获取证书：`sudo certbot renew --force-renewal`

### CORS 错误
- 更新 `.env` 中的 `CORS_ORIGIN`
- 重启后端：`docker-compose restart backend`

---

**推荐阅读：**
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Caddy 官方文档](https://caddyserver.com/docs/)
- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
