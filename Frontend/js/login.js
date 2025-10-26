// 登录页面逻辑
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');

    // 检查是否已登录
    if (api.getToken()) {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // 清除之前的错误消息
        errorMsg.textContent = '';
        errorMsg.classList.remove('show');

        // 表单验证
        if (username.trim() === '' || password.trim() === '') {
            showError('用户名和密码不能为空');
            return;
        }

        // 禁用提交按钮，防止重复提交
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';

        try {
            // 调用后端登录 API
            const response = await authAPI.login(username, password);
            
            if (response.success) {
                // 保存 Token
                api.setToken(response.data.token);
                
                // 保存用户信息
                localStorage.setItem('username', response.data.user.username);
                localStorage.setItem('userId', response.data.user.id);
                localStorage.setItem('userRole', response.data.user.role);
                
                // 跳转到管理面板
                window.location.href = 'dashboard.html';
            } else {
                showError(response.message || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            showError(error.message || '登录失败，请检查网络连接或联系管理员');
            console.error('Login error:', error);
        } finally {
            // 恢复提交按钮
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
});
