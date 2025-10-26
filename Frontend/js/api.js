// API 配置文件
const API_CONFIG = {
    // 后端 API 地址 - 根据实际部署修改
    // 后端默认监听 127.0.0.1:10234，需要通过反向代理访问
    
    // 生产环境（使用反向代理域名）
    BASE_URL: 'https://your-domain.com/api',
    
    // 或者使用子域名
    // BASE_URL: 'https://api.your-domain.com/api',
    
    // 本地开发（直接访问后端端口）
    // BASE_URL: 'http://localhost:10234/api',
    
    // 超时设置（毫秒）
    TIMEOUT: 30000,
    
    // Token 存储键名
    TOKEN_KEY: 'attendance_token'
};

// API 请求封装类
class API {
    constructor(baseURL) {
        this.baseURL = baseURL;
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
                    this.clearToken();
                    if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
                        window.location.href = 'index.html';
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
    batchDelete: (ids) => api.post('/members/batch-delete', { ids })
};

// 签到记录相关 API
const recordAPI = {
    // 获取签到记录
    getAll: (params) => api.get('/records', params),
    
    // 创建/更新签到记录
    create: (tableId, memberId, recordType, date, time) => 
        api.post('/records', { tableId, memberId, recordType, date, time }),
    
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
