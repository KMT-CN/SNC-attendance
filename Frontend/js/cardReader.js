// 读卡器管理类
class CardReaderManager {
    constructor() {
        this.port = null;
        this.reader = null;
        this.isReading = false;
        this.currentTable = null;
        this.currentMode = 'checkin';
        this.api = new API(API_CONFIG.BASE_URL);
    }

    // 检查浏览器是否支持 Web Serial API
    isSupported() {
        return 'serial' in navigator;
    }

    // 连接读卡器
    async connect() {
        try {
            if (!this.isSupported()) {
                throw new Error('您的浏览器不支持 Web Serial API，请使用 Chrome、Edge 或 Opera 浏览器');
            }

            // 请求串口访问权限
            this.port = await navigator.serial.requestPort();
            
            // 打开串口连接（根据读卡器配置调整参数）
            await this.port.open({
                baudRate: 9600,  // 波特率，根据实际读卡器调整
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            });

            this.addLog('success', '读卡器连接成功');
            this.updateConnectionStatus(true);
            
            // 开始读取数据
            this.startReading();
            
            return true;
        } catch (error) {
            console.error('连接读卡器失败:', error);
            this.addLog('error', `连接失败: ${error.message}`);
            return false;
        }
    }

    // 断开连接
    async disconnect() {
        try {
            this.isReading = false;
            
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.addLog('info', '读卡器已断开连接');
            this.updateConnectionStatus(false);
        } catch (error) {
            console.error('断开连接失败:', error);
        }
    }

    // 开始读取数据
    async startReading() {
        if (!this.port) return;

        this.isReading = true;
        
        try {
            while (this.port.readable && this.isReading) {
                this.reader = this.port.readable.getReader();
                
                try {
                    while (this.isReading) {
                        const { value, done } = await this.reader.read();
                        if (done) break;
                        
                        // 处理接收到的数据
                        await this.handleCardData(value);
                    }
                } catch (error) {
                    console.error('读取数据错误:', error);
                    this.addLog('error', `读取错误: ${error.message}`);
                } finally {
                    this.reader.releaseLock();
                }
            }
        } catch (error) {
            console.error('读取过程错误:', error);
            this.addLog('error', `读取过程错误: ${error.message}`);
        }
    }

    // 处理卡片数据
    async handleCardData(data) {
        try {
            // 将 Uint8Array 转换为字符串
            const decoder = new TextDecoder();
            let cardId = decoder.decode(data).trim();
            
            // 移除可能的前缀和后缀字符（根据实际读卡器调整）
            cardId = cardId.replace(/[\r\n\x00]/g, '');
            
            if (!cardId) return;

            this.addLog('info', `读取到卡片: ${cardId}`);
            this.displayCardId(cardId);

            // 发送签到请求
            await this.checkin(cardId);
            
        } catch (error) {
            console.error('处理卡片数据错误:', error);
            this.addLog('error', `处理卡片数据错误: ${error.message}`);
        }
    }

    // 签到/签退
    async checkin(cardId) {
        try {
            if (!this.currentTable) {
                throw new Error('请先在系统设置中设置活动签到表');
            }

            const response = await this.api.post('/records/card-checkin', {
                cardId: cardId,
                tableId: this.currentTable,
                recordType: this.currentMode
            });

            if (response.success) {
                this.displaySuccess(response.data);
                this.addLog('success', 
                    `${response.message} - ${response.data.memberName} (${response.data.memberEmployeeId})`
                );
            }
        } catch (error) {
            console.error('签到失败:', error);
            this.displayError(error.message);
            this.addLog('error', `操作失败: ${error.message}`);
        }
    }

    // 更新连接状态显示
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const connectBtn = document.getElementById('connectBtn');

        if (connected) {
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = '读卡器已连接';
            connectBtn.textContent = '断开连接';
            connectBtn.classList.remove('btn-primary');
            connectBtn.classList.add('btn-danger');
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = '读卡器未连接';
            connectBtn.textContent = '连接读卡器';
            connectBtn.classList.remove('btn-danger');
            connectBtn.classList.add('btn-primary');
        }
    }

    // 显示卡片ID
    displayCardId(cardId) {
        const cardDisplay = document.getElementById('cardDisplay');
        const cardIdElement = document.getElementById('cardId');
        
        cardDisplay.classList.add('active');
        cardIdElement.textContent = cardId;
        
        // 3秒后恢复默认状态
        setTimeout(() => {
            if (!document.getElementById('memberInfo').style.display === 'none') {
                cardDisplay.classList.remove('active');
            }
        }, 3000);
    }

    // 显示成功信息
    displaySuccess(data) {
        const cardDisplay = document.getElementById('cardDisplay');
        const memberInfo = document.getElementById('memberInfo');
        
        cardDisplay.classList.remove('active', 'error');
        cardDisplay.classList.add('success');
        
        document.getElementById('memberName').textContent = data.memberName;
        document.getElementById('memberEmployeeId').textContent = data.memberEmployeeId;
        document.getElementById('operationTime').textContent = 
            `${data.checkinDate || data.checkoutDate} ${data.checkinTime || data.checkoutTime}`;
        document.getElementById('operationResult').textContent = 
            data.recordType === 'checkin' ? '签到成功 ✓' : '签退成功 ✓';
        
        memberInfo.style.display = 'block';
        
        // 5秒后恢复默认状态
        setTimeout(() => {
            cardDisplay.classList.remove('success');
            memberInfo.style.display = 'none';
            document.getElementById('cardId').textContent = '';
        }, 5000);
    }

    // 显示错误信息
    displayError(message) {
        const cardDisplay = document.getElementById('cardDisplay');
        const memberInfo = document.getElementById('memberInfo');
        
        cardDisplay.classList.remove('active', 'success');
        cardDisplay.classList.add('error');
        
        document.getElementById('memberName').textContent = '操作失败';
        document.getElementById('memberEmployeeId').textContent = '-';
        document.getElementById('operationTime').textContent = new Date().toLocaleString();
        document.getElementById('operationResult').textContent = message + ' ✗';
        
        memberInfo.style.display = 'block';
        
        // 5秒后恢复默认状态
        setTimeout(() => {
            cardDisplay.classList.remove('error');
            memberInfo.style.display = 'none';
            document.getElementById('cardId').textContent = '';
        }, 5000);
    }

    // 添加日志
    addLog(type, message) {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString();
        const typeClass = type === 'success' ? 'log-success' : 
                         type === 'error' ? 'log-error' : 'log-info';
        
        logEntry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="${typeClass}">${message}</span>
        `;
        
        logContainer.insertBefore(logEntry, logContainer.firstChild);
        
        // 限制日志条数
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    // 清空日志
    clearLog() {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = '<div class="log-entry"><span class="log-time">日志已清空</span></div>';
    }

    // 加载系统设置
    async loadSettings() {
        try {
            const settings = await this.api.get('/settings');
            
            if (settings.success && settings.data) {
                this.currentTable = settings.data.activeTable;
                this.currentMode = settings.data.mode || 'checkin';
                
                // 更新显示
                if (this.currentTable) {
                    // 获取表格名称
                    const tables = await this.api.get('/tables');
                    const table = tables.data.find(t => t.id === this.currentTable);
                    if (table) {
                        document.getElementById('currentTable').textContent = table.name;
                    }
                } else {
                    document.getElementById('currentTable').textContent = '未设置';
                }
                
                const modeDisplay = document.getElementById('currentMode');
                modeDisplay.textContent = this.currentMode === 'checkin' ? '签到模式' : '签退模式';
                modeDisplay.className = `mode-display mode-${this.currentMode}`;
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            this.addLog('error', '加载设置失败');
        }
    }
}

// 初始化
let cardReader;

document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    const api = new API(API_CONFIG.BASE_URL);
    const token = api.getToken();
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化读卡器管理器
    cardReader = new CardReaderManager();

    // 检查浏览器支持
    if (!cardReader.isSupported()) {
        alert('您的浏览器不支持 Web Serial API\n\n请使用以下浏览器：\n- Google Chrome\n- Microsoft Edge\n- Opera');
        cardReader.addLog('error', '浏览器不支持 Web Serial API');
    }

    // 加载系统设置
    await cardReader.loadSettings();

    // 连接按钮事件
    document.getElementById('connectBtn').addEventListener('click', async () => {
        if (cardReader.port) {
            await cardReader.disconnect();
        } else {
            await cardReader.connect();
        }
    });

    // 清空日志按钮事件
    document.getElementById('clearLogBtn').addEventListener('click', () => {
        cardReader.clearLog();
    });

    // 定期刷新设置（每30秒）
    setInterval(() => {
        cardReader.loadSettings();
    }, 30000);
});

// 页面关闭时断开连接
window.addEventListener('beforeunload', () => {
    if (cardReader && cardReader.port) {
        cardReader.disconnect();
    }
});
