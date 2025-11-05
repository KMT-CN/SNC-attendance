// API 配置文件
const API_CONFIG = {
    // 后端 API 地址 - 根据实际部署修改
    // Docker Compose 部署时,使用相对路径通过 Nginx 反向代理访问
    // 前后端分别部署时,需要修改为实际的后端地址
    
    // 使用相对路径,通过前端 Nginx 反向代理访问后端
    // 这样无论是通过域名、IP 还是 localhost 访问,都能正常工作
    BASE_URL: '/api',
    
    // 其他配置选项(根据实际情况取消注释):
    // BASE_URL: 'http://localhost:10234/api',  // 本地开发,直接访问后端
    // BASE_URL: 'http://YOUR_VPS_IP:10234/api',  // 跨域访问远程后端
    // BASE_URL: 'https://api.yourdomain.com/api',  // 后端独立域名
    
    // 超时设置（毫秒）
    TIMEOUT: 30000,
    
    // Token 存储键名
    TOKEN_KEY: 'attendance_token'
};

// API 请求封装类
class API {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.isRedirecting = false; // 防止重复跳转
    }

    // 获取存储的 Token
    getToken() {
        return localStorage.getItem(API_CONFIG.TOKEN_KEY);
    }

    // 设置 Token
    setToken(token) {
        localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    }

    // 清除 Token
    clearToken() {
        localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    }

    // 通用请求方法
    async request(url, options = {}) {
        const token = this.getToken();
        
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            const data = await response.json();

            if (!response.ok) {
                // 如果是 401 未授权，清除 Token 并跳转到登录页
                if (response.status === 401) {
                    console.error('401 Unauthorized - clearing token and redirecting to login');
                    this.clearToken();
                    // 清除所有用户相关的 localStorage 数据
                    localStorage.removeItem('username');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('isSuperAdmin');
                    
                    // 只有在不是登录页时才跳转，避免循环，并且防止重复跳转
                    const currentPath = window.location.pathname;
                    if (!this.isRedirecting && !currentPath.endsWith('/index.html') && !currentPath.endsWith('/')) {
                        this.isRedirecting = true;
                        // 延迟跳转，避免重复跳转
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 100);
                    }
                }
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // GET 请求
    get(url, params) {
        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url = `${url}?${queryString}`;
        }
        return this.request(url, { method: 'GET' });
    }

    // POST 请求
    post(url, body) {
        return this.request(url, { method: 'POST', body });
    }

    // PUT 请求
    put(url, body) {
        return this.request(url, { method: 'PUT', body });
    }

    // DELETE 请求
    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
}

// 创建 API 实例
const api = new API(API_CONFIG.BASE_URL);

// 认证相关 API
const authAPI = {
    // 检查系统是否需要初始化设置
    checkSetup: () => fetch(`${API_CONFIG.BASE_URL}/auth/check-setup`)
        .then(res => res.json())
        .catch(() => ({ success: false, data: { hasUsers: true, needsSetup: false } })),
    
    // 登录
    login: (username, password) => api.post('/auth/login', { username, password }),
    
    // 注册
    register: (username, password) => api.post('/auth/register', { username, password })
};

// 签到表相关 API
const tableAPI = {
    // 获取所有签到表
    getAll: () => api.get('/tables'),
    
    // 获取单个签到表
    getById: (id) => api.get(`/tables/${id}`),
    
    // 创建签到表
    create: (name, description) => api.post('/tables', { name, description }),
    
    // 删除签到表
    delete: (id) => api.delete(`/tables/${id}`)
};

// 成员相关 API
const memberAPI = {
    // 获取成员列表
    getAll: (tableId) => api.get('/members', tableId ? { tableId } : null),
    
    // 添加成员
    create: (tableId, name, employeeId, contact) => 
        api.post('/members', { tableId, name, employeeId, contact }),
    
    // 删除成员
    delete: (id) => api.delete(`/members/${id}`),
    
    // 批量删除成员
    batchDelete: (ids) => api.post('/members/batch-delete', { ids }),
    
    // 绑定卡片
    bindCard: (memberId, cardId) => api.put(`/members/${memberId}/bind-card`, { cardId }),
    
    // 解绑卡片
    unbindCard: (memberId) => api.put(`/members/${memberId}/unbind-card`, {}),
    
    // 根据卡片ID查询成员
    getByCard: (cardId) => api.get(`/members/by-card/${cardId}`)
};

// 签到记录相关 API
const recordAPI = {
    // 获取签到记录
    getAll: (params) => api.get('/records', params),
    
    // 创建/更新签到记录
    create: (tableId, memberId, recordType, date, time) => 
        api.post('/records', { tableId, memberId, recordType, date, time }),
    
    // 刷卡签到/签退
    cardCheckin: (cardId, tableId, recordType) => 
        api.post('/records/card-checkin', { cardId, tableId, recordType }),
    
    // 更新记录
    update: (id, data) => api.put(`/records/${id}`, data),
    
    // 删除记录
    delete: (id) => api.delete(`/records/${id}`)
};

// 系统设置相关 API
const settingsAPI = {
    // 获取所有设置
    getAll: () => api.get('/settings'),
    
    // 设置活动表格
    setActiveTable: (tableId) => api.put('/settings/active-table', { tableId }),
    
    // 设置模式
    setMode: (mode) => api.put('/settings/mode', { mode })
};

// 用户管理相关 API
const userAPI = {
    // 获取所有用户
    getAll: () => api.get('/users'),
    
    // 获取单个用户
    getById: (id) => api.get(`/users/${id}`),
    
    // 创建用户
    create: (username, password, role, userGroup) => api.post('/users', { username, password, role, userGroup }),
    
    // 更新用户信息
    update: (id, data) => api.put(`/users/${id}`, data),
    
    // 修改用户密码
    changePassword: (id, newPassword) => api.put(`/users/${id}/password`, { newPassword }),
    
    // 删除用户
    delete: (id) => api.delete(`/users/${id}`),
    
    // 批量删除用户
    batchDelete: (userIds) => api.post('/users/batch-delete', { userIds })
};

// 导出供其他模块使用
export { api, API_CONFIG, authAPI, tableAPI, memberAPI, recordAPI, settingsAPI, userAPI };
