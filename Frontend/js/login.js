// 导入 API 模块
import { api, authAPI } from './api.js';

// 登录页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const errorMsg = document.getElementById('errorMsg');

    // 检查是否已登录
    const token = api.getToken();
    console.log('登录页加载，Token 状态:', token ? '存在' : '不存在');
    
    if (token) {
        console.log('已登录，跳转到 dashboard');
        window.location.href = 'dashboard.html';
        return;
    }

    // 检查系统是否已有用户（判断是否首次使用）
    let needsSetup = false;
    try {
        const setupCheck = await authAPI.checkSetup();
        if (setupCheck.success) {
            needsSetup = setupCheck.data.needsSetup;
            console.log('系统状态:', setupCheck.data.hasUsers ? '已有用户' : '首次使用');
        }
    } catch (error) {
        console.log('检查系统状态失败，默认显示登录表单');
    }

    // 更新注册表单的按钮文本
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    
    if (needsSetup) {
        // 首次使用，显示注册表单
        registerSubmitBtn.textContent = '创建超级管理员账户';
        
        // 首次使用时，自动显示注册表单并隐藏切换按钮
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleFormBtn.style.display = 'none';
        console.log('检测到首次使用，显示注册表单');
    } else {
        // 已有用户，显示登录表单，并允许切换到注册
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleFormBtn.style.display = 'block'; // 允许切换
        console.log('系统已初始化，显示登录表单');
    }

    // 表单切换
    let isRegisterMode = needsSetup;
    toggleFormBtn.addEventListener('click', function() {
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            toggleFormBtn.textContent = '已有账户？点击登录';
        } else {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            toggleFormBtn.textContent = '还没有账户？点击注册';
        }
        clearError();
    });

    // 登录表单提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // 清除之前的错误消息
        clearError();

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
                localStorage.setItem('isSuperAdmin', response.data.user.isSuperAdmin || false);
                
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

    // 注册表单提交
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        // 清除之前的错误消息
        clearError();

        // 表单验证
        if (!username || !password || !confirmPassword) {
            showError('请填写所有必填项');
            return;
        }

        if (password.length < 6) {
            showError('密码至少需要6个字符');
            return;
        }

        if (password !== confirmPassword) {
            showError('两次输入的密码不一致');
            return;
        }

        // 禁用提交按钮，防止重复提交
        submitBtn.disabled = true;
        submitBtn.textContent = '创建中...';

        try {
            // 调用后端注册 API
            const response = await authAPI.register(username, password);
            
            if (response.success) {
                // 显示成功消息
                showSuccess('账户创建成功！正在登录...');
                
                // 自动登录 - 使用 await 确保完成后再跳转
                try {
                    await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟确保显示成功消息
                    
                    const loginResponse = await authAPI.login(username, password);
                    if (loginResponse.success) {
                        console.log('自动登录成功，保存用户信息...');
                        
                        // 保存 Token
                        api.setToken(loginResponse.data.token);
                        
                        // 保存用户信息
                        localStorage.setItem('username', loginResponse.data.user.username);
                        localStorage.setItem('userId', loginResponse.data.user.id);
                        localStorage.setItem('userRole', loginResponse.data.user.role);
                        localStorage.setItem('isSuperAdmin', String(loginResponse.data.user.isSuperAdmin || false));
                        
                        console.log('用户信息已保存，准备跳转...');
                        console.log('Token:', api.getToken() ? '已保存' : '未保存');
                        console.log('isSuperAdmin:', localStorage.getItem('isSuperAdmin'));
                        
                        // 确保数据保存后再跳转
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                        // 跳转到管理面板
                        window.location.href = 'dashboard.html';
                    } else {
                        showError('自动登录失败: ' + (loginResponse.message || '未知错误'));
                        // 切换回登录表单
                        setTimeout(() => {
                            if (toggleFormBtn) toggleFormBtn.click();
                        }, 2000);
                    }
                } catch (loginError) {
                    console.error('自动登录异常:', loginError);
                    showError('注册成功，但自动登录失败，请手动登录');
                    // 切换回登录表单
                    setTimeout(() => {
                        if (toggleFormBtn) toggleFormBtn.click();
                    }, 2000);
                }
            } else {
                showError(response.message || '注册失败，请稍后重试');
            }
        } catch (error) {
            showError(error.message || '注册失败，请检查网络连接或联系管理员');
            console.error('Register error:', error);
        } finally {
            // 恢复提交按钮
            submitBtn.disabled = false;
            submitBtn.textContent = '创建超级管理员账户';
        }
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.className = 'error-msg show';
    }

    function showSuccess(message) {
        errorMsg.textContent = message;
        errorMsg.className = 'error-msg show success';
    }

    function clearError() {
        errorMsg.textContent = '';
        errorMsg.className = 'error-msg';
    }
});
