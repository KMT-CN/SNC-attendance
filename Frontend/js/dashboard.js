// 管理面板逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (!api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化
    initializeApp();
});

// 全局变量
let currentTable = null;
let tables = [];
let members = [];
let records = [];
let selectedMembers = [];
let activeTable = null;
let currentMode = 'checkin';

// 初始化应用
function initializeApp() {
    // 显示用户名
    const usernameElement = document.getElementById('username');
    usernameElement.textContent = localStorage.getItem('username') || '管理员';

    // 加载数据
    loadData();

    // 绑定事件
    bindEvents();

    // 初始显示
    updateDisplay();
}

// 加载数据
async function loadData() {
    try {
        // 从后端 API 加载数据
        const [tablesResponse, membersResponse, recordsResponse, settingsResponse] = await Promise.all([
            tableAPI.getAll(),
            memberAPI.getAll(),
            recordAPI.getAll(),
            settingsAPI.getAll().catch(() => ({ success: true, data: {} }))
        ]);

        tables = tablesResponse.data || [];
        members = membersResponse.data || [];
        records = recordsResponse.data || [];
        
        const settings = settingsResponse.data || {};
        activeTable = settings.activeTable || null;
        currentMode = settings.mode || 'checkin';

    } catch (error) {
        console.error('Load data error:', error);
        showToast('加载数据失败: ' + error.message, 'error');
    }
}

// 创建示例数据
async function createSampleData() {
    // 后端部署后不需要示例数据，此函数保留但不执行
    console.log('使用后端 API，无需创建示例数据');
}

// 保存数据
async function saveData() {
    // 使用后端 API，不需要本地保存
    // 数据会自动通过 API 调用保存到后端
}

// 绑定事件
function bindEvents() {
    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // 导航切换
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    // 创建签到表
    document.getElementById('createTableBtn').addEventListener('click', openCreateTableModal);
    document.getElementById('createTableForm').addEventListener('submit', handleCreateTable);

    // 添加成员
    document.getElementById('addMemberBtn').addEventListener('click', openAddMemberModal);
    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);

    // 表格筛选
    document.getElementById('tableFilter').addEventListener('change', handleTableFilter);

    // 全选
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);

    // 批量删除
    document.getElementById('batchDeleteBtn').addEventListener('click', handleBatchDelete);

    // 手动记录签到/签退
    document.getElementById('manualRecordBtn').addEventListener('click', openManualRecordModal);
    document.getElementById('manualRecordForm').addEventListener('submit', handleManualRecord);
    document.getElementById('recordTable').addEventListener('change', handleRecordTableChange);

    // 记录筛选
    document.getElementById('recordTableFilter').addEventListener('change', updateRecordsDisplay);
    document.getElementById('recordDateFilter').addEventListener('change', updateRecordsDisplay);
    document.getElementById('clearFilterBtn').addEventListener('click', clearRecordFilters);

    // 设置活动表格
    document.getElementById('setActiveTableBtn').addEventListener('click', handleSetActiveTable);

    // 设置模式
    document.getElementById('setModeBtn').addEventListener('click', handleSetMode);

    // 导出
    document.getElementById('exportExcelBtn').addEventListener('click', () => handleExport('excel'));
    document.getElementById('exportCsvBtn').addEventListener('click', () => handleExport('csv'));

    // 模态框关闭
    const closeButtons = document.querySelectorAll('.close, [data-modal]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            }
        });
    });

    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

// 切换导航
function switchSection(section) {
    // 更新导航样式
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.section === section) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 显示对应内容
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => {
        if (sec.id === section) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });

    updateDisplay();
}

// 更新显示
function updateDisplay() {
    updateTablesDisplay();
    updateMembersDisplay();
    updateRecordsDisplay();
    updateSettingsDisplay();
    updateSelectOptions();
}

// 更新签到表显示
function updateTablesDisplay() {
    const tbody = document.getElementById('tablesTableBody');
    if (!tbody) return;

    if (tables.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无签到表，点击"创建新签到表"开始</td></tr>';
        return;
    }

    tbody.innerHTML = tables.map(table => {
        const memberCount = table.memberCount || 0;
        const statusClass = table.id === activeTable ? 'status-active' : 'status-inactive';
        const statusText = table.id === activeTable ? '活动中' : '未激活';

        return `
            <tr>
                <td>${escapeHtml(table.name)}</td>
                <td>${formatDate(table.createdAt)}</td>
                <td>${memberCount} 人</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions">
                    <button class="btn btn-primary" onclick="viewTable('${table.id}')">查看</button>
                    <button class="btn btn-danger" onclick="deleteTable('${table.id}')">删除</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 更新成员显示
function updateMembersDisplay() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    const tableFilter = document.getElementById('tableFilter').value;
    let filteredMembers = members;

    if (tableFilter) {
        filteredMembers = members.filter(m => m.tableId === tableFilter);
    }

    if (filteredMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无成员数据</td></tr>';
        return;
    }

    tbody.innerHTML = filteredMembers.map(member => `
        <tr>
            <td><input type="checkbox" class="member-checkbox" data-id="${member.id}"></td>
            <td>${escapeHtml(member.name)}</td>
            <td>${escapeHtml(member.employeeId)}</td>
            <td>${escapeHtml(member.contact || '-')}</td>
            <td>${formatDate(member.joinedAt)}</td>
            <td class="actions">
                <button class="btn btn-danger" onclick="deleteMember('${member.id}')">删除</button>
            </td>
        </tr>
    `).join('');

    // 绑定复选框事件
    const checkboxes = document.querySelectorAll('.member-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedMembers);
    });
}

// 更新签到记录显示
async function updateRecordsDisplay() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    const tableFilter = document.getElementById('recordTableFilter')?.value;
    const dateFilter = document.getElementById('recordDateFilter')?.value;
    
    try {
        // 构建查询参数
        const params = {};
        if (tableFilter) params.tableId = tableFilter;
        if (dateFilter) params.date = dateFilter;
        
        // 从后端获取记录
        const response = await recordAPI.getAll(params);
        const filteredRecords = response.data || [];

        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无签到记录</td></tr>';
            return;
        }

        tbody.innerHTML = filteredRecords.map(record => {
            const memberName = record.memberName || '未知成员';
            const memberEmployeeId = record.memberEmployeeId || '-';
            
            let statusClass = '';
            let statusText = '';
            
            if (record.status === 'completed') {
                statusClass = 'status-active';
                statusText = '已完成';
            } else if (record.status === 'checkedin') {
                statusClass = 'status-warning';
                statusText = '已签到';
            } else {
                statusClass = 'status-inactive';
                statusText = '未签到';
            }

            return `
                <tr>
                    <td>${escapeHtml(memberName)}</td>
                    <td>${escapeHtml(memberEmployeeId)}</td>
                    <td>${record.checkinDate || '-'}</td>
                    <td>${record.checkinTime || '-'}</td>
                    <td>${record.checkoutDate || '-'}</td>
                    <td>${record.checkoutTime || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn btn-primary" onclick="editRecord('${record.id}')">编辑</button>
                        <button class="btn btn-danger" onclick="deleteRecord('${record.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // 更新全局 records 变量
        records = filteredRecords;
    } catch (error) {
        console.error('Update records display error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载记录失败</td></tr>';
    }
}

// 更新设置显示
function updateSettingsDisplay() {
    // 更新当前活动表格
    const activeTableName = document.getElementById('activeTableName');
    if (activeTableName) {
        const table = tables.find(t => t.id === parseInt(activeTable));
        activeTableName.textContent = table ? table.name : '未设置';
    }

    // 更新当前模式
    const modeName = document.getElementById('modeName');
    if (modeName) {
        modeName.textContent = currentMode === 'checkin' ? '签到模式' : '签退模式';
    }

    // 设置模式选择器
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    modeRadios.forEach(radio => {
        radio.checked = radio.value === currentMode;
    });
}

// 更新下拉选项
function updateSelectOptions() {
    const selects = [
        'tableFilter',
        'memberTable',
        'activeTable',
        'exportTable',
        'recordTableFilter',
        'recordTable'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        const options = tables.map(table => 
            `<option value="${table.id}">${escapeHtml(table.name)}</option>`
        ).join('');

        if (selectId === 'tableFilter' || selectId === 'recordTableFilter') {
            select.innerHTML = '<option value="">选择签到表</option>' + options;
        } else {
            select.innerHTML = '<option value="">请选择表格</option>' + options;
        }

        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// 打开创建表格模态框
function openCreateTableModal() {
    document.getElementById('createTableModal').classList.add('show');
}

// 处理创建表格
async function handleCreateTable(e) {
    e.preventDefault();
    
    const name = document.getElementById('tableName').value.trim();
    const description = document.getElementById('tableDescription').value.trim();

    if (!name) {
        showToast('请输入表格名称', 'error');
        return;
    }

    try {
        await tableAPI.create(name, description);
        await loadData();
        updateDisplay();
        closeModal('createTableModal');
        document.getElementById('createTableForm').reset();
        showToast('签到表创建成功');
    } catch (error) {
        showToast('创建失败: ' + error.message, 'error');
    }
}

// 打开添加成员模态框
function openAddMemberModal() {
    if (tables.length === 0) {
        showToast('请先创建签到表', 'error');
        return;
    }
    document.getElementById('addMemberModal').classList.add('show');
}

// 处理添加成员
async function handleAddMember(e) {
    e.preventDefault();

    const tableId = document.getElementById('memberTable').value;
    const name = document.getElementById('memberName').value.trim();
    const employeeId = document.getElementById('memberId').value.trim();
    const contact = document.getElementById('memberContact').value.trim();

    if (!tableId || !name || !employeeId) {
        showToast('请填写必填项', 'error');
        return;
    }

    try {
        await memberAPI.create(tableId, name, employeeId, contact);
        await loadData();
        updateDisplay();
        closeModal('addMemberModal');
        document.getElementById('addMemberForm').reset();
        showToast('成员添加成功');
    } catch (error) {
        showToast('添加失败: ' + error.message, 'error');
    }
}

// 查看表格
function viewTable(tableId) {
    // 切换到成员管理并筛选
    switchSection('members');
    document.getElementById('tableFilter').value = tableId;
    handleTableFilter();
}

// 删除表格
async function deleteTable(tableId) {
    showConfirm('确定要删除此签到表吗？删除后相关成员和签到记录也会被移除', async () => {
        try {
            await tableAPI.delete(tableId);
            await loadData();
            updateDisplay();
            showToast('签到表已删除');
        } catch (error) {
            showToast('删除失败: ' + error.message, 'error');
        }
    });
}

// 删除成员
async function deleteMember(memberId) {
    showConfirm('确定要删除此成员吗？', async () => {
        try {
            await memberAPI.delete(memberId);
            await loadData();
            updateDisplay();
            showToast('成员已删除');
        } catch (error) {
            showToast('删除失败: ' + error.message, 'error');
        }
    });
}

// 处理表格筛选
function handleTableFilter() {
    updateMembersDisplay();
}

// 处理全选
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.member-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
    });
    updateSelectedMembers();
}

// 更新选中的成员
function updateSelectedMembers() {
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    selectedMembers = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
}

// 批量删除
async function handleBatchDelete() {
    if (selectedMembers.length === 0) {
        showToast('请先选择要删除的成员', 'error');
        return;
    }

    showConfirm(`确定要删除选中的 ${selectedMembers.length} 个成员吗？`, async () => {
        try {
            await memberAPI.batchDelete(selectedMembers);
            selectedMembers = [];
            await loadData();
            updateDisplay();
            document.getElementById('selectAll').checked = false;
            showToast('批量删除成功');
        } catch (error) {
            showToast('删除失败: ' + error.message, 'error');
        }
    });
}

// 打开手动记录模态框
function openManualRecordModal() {
    if (tables.length === 0) {
        showToast('请先创建签到表', 'error');
        return;
    }
    
    // 设置默认日期和时间
    const now = new Date();
    document.getElementById('recordDate').value = formatDateOnly(now);
    document.getElementById('recordTime').value = formatTimeOnly(now);
    
    document.getElementById('manualRecordModal').classList.add('show');
}

// 处理记录表格变化
async function handleRecordTableChange() {
    const tableId = document.getElementById('recordTable').value;
    const memberSelect = document.getElementById('recordMember');
    
    if (!tableId) {
        memberSelect.innerHTML = '<option value="">请先选择签到表</option>';
        return;
    }
    
    try {
        const response = await memberAPI.getAll(tableId);
        const tableMembers = response.data || [];
        
        if (tableMembers.length === 0) {
            memberSelect.innerHTML = '<option value="">该表格暂无成员</option>';
            return;
        }
        
        memberSelect.innerHTML = '<option value="">请选择成员</option>' + 
            tableMembers.map(m => 
                `<option value="${m.id}">${escapeHtml(m.name)} (${escapeHtml(m.employeeId)})</option>`
            ).join('');
    } catch (error) {
        console.error('Load members error:', error);
        memberSelect.innerHTML = '<option value="">加载成员失败</option>';
    }
}

// 处理手动记录
async function handleManualRecord(e) {
    e.preventDefault();
    
    const tableId = document.getElementById('recordTable').value;
    const memberId = document.getElementById('recordMember').value;
    const recordType = document.getElementById('recordType').value;
    const recordDate = document.getElementById('recordDate').value;
    const recordTime = document.getElementById('recordTime').value;
    
    if (!tableId || !memberId || !recordDate || !recordTime) {
        showToast('请填写所有必填项', 'error');
        return;
    }
    
    try {
        await recordAPI.create(tableId, memberId, recordType, recordDate, recordTime);
        await loadData();
        updateDisplay();
        closeModal('manualRecordModal');
        document.getElementById('manualRecordForm').reset();
        showToast(`${recordType === 'checkin' ? '签到' : '签退'}记录已保存`);
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    }
}

// 清除记录筛选
function clearRecordFilters() {
    document.getElementById('recordTableFilter').value = '';
    document.getElementById('recordDateFilter').value = '';
    updateRecordsDisplay();
}

// 编辑记录
function editRecord(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    
    // 打开模态框并填充数据
    document.getElementById('recordTable').value = record.tableId;
    handleRecordTableChange();
    
    setTimeout(() => {
        document.getElementById('recordMember').value = record.memberId;
        
        if (record.checkoutDate && record.checkoutTime) {
            document.getElementById('recordType').value = 'checkout';
            document.getElementById('recordDate').value = record.checkoutDate;
            document.getElementById('recordTime').value = record.checkoutTime;
        } else if (record.checkinDate && record.checkinTime) {
            document.getElementById('recordType').value = 'checkin';
            document.getElementById('recordDate').value = record.checkinDate;
            document.getElementById('recordTime').value = record.checkinTime;
        }
        
        openManualRecordModal();
    }, 100);
}

// 删除记录
async function deleteRecord(recordId) {
    showConfirm('确定要删除此签到记录吗？', async () => {
        try {
            await recordAPI.delete(recordId);
            await loadData();
            updateDisplay();
            showToast('记录已删除');
        } catch (error) {
            showToast('删除失败: ' + error.message, 'error');
        }
    });
}

// 设置活动表格
async function handleSetActiveTable() {
    const tableId = document.getElementById('activeTable').value;
    
    if (!tableId) {
        showToast('请选择表格', 'error');
        return;
    }

    try {
        await settingsAPI.setActiveTable(tableId);
        activeTable = tableId;
        updateDisplay();
        showToast('活动表格设置成功');
    } catch (error) {
        showToast('设置失败: ' + error.message, 'error');
    }
}

// 设置模式
async function handleSetMode() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    
    try {
        await settingsAPI.setMode(selectedMode);
        currentMode = selectedMode;
        updateDisplay();
        showToast(`已切换到${currentMode === 'checkin' ? '签到' : '签退'}模式`);
    } catch (error) {
        showToast('设置失败: ' + error.message, 'error');
    }
}

// 导出数据
function handleExport(format) {
    const tableId = document.getElementById('exportTable').value;
    
    if (!tableId) {
        showToast('请选择要导出的表格', 'error');
        return;
    }

    const table = tables.find(t => t.id === parseInt(tableId));
    const tableMembers = members.filter(m => m.tableId === parseInt(tableId));

    if (tableMembers.length === 0) {
        showToast('该表格没有成员数据', 'error');
        return;
    }

    if (format === 'excel') {
        exportToExcel(table, tableMembers);
    } else if (format === 'csv') {
        exportToCSV(table, tableMembers);
    }

    showToast(`正在导出为 ${format.toUpperCase()} 格式...`);
}

// 导出为Excel（实际应该使用库如 xlsx）
function exportToExcel(table, tableMembers) {
    // 这里是简化版本，实际应该使用 SheetJS (xlsx) 库
    const data = tableMembers.map(m => ({
        '姓名': m.name,
        '学号/工号': m.employeeId,
        '联系方式': m.contact || '-',
        '加入时间': formatDate(m.joinedAt)
    }));

    console.log('Export to Excel:', table.name, data);
    showToast('Excel导出功能需要集成相关库', 'error');
}

// 导出为CSV
function exportToCSV(table, tableMembers) {
    // 获取该表格的所有签到记录
    const tableRecords = records.filter(r => r.tableId === table.id);
    
    const headers = ['姓名', '学号/工号', '联系方式', '签到日期', '签到时间', '签退日期', '签退时间', '状态'];
    const rows = [];
    
    // 为每个成员创建行，包含他们的签到记录
    tableMembers.forEach(member => {
        const memberRecords = tableRecords.filter(r => r.memberId === member.id);
        
        if (memberRecords.length === 0) {
            // 如果没有记录，显示成员信息但无签到数据
            rows.push([
                member.name,
                member.employeeId,
                member.contact || '-',
                '-',
                '-',
                '-',
                '-',
                '未签到'
            ]);
        } else {
            // 为每条记录创建一行
            memberRecords.forEach(record => {
                let status = '未签到';
                if (record.status === 'completed') status = '已完成';
                else if (record.status === 'checkedin') status = '已签到';
                
                rows.push([
                    member.name,
                    member.employeeId,
                    member.contact || '-',
                    record.checkinDate || '-',
                    record.checkinTime || '-',
                    record.checkoutDate || '-',
                    record.checkoutTime || '-',
                    status
                ]);
            });
        }
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // 添加 BOM 以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${table.name}_${formatDateOnly(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV 导出成功');
}

// 显示确认对话框
function showConfirm(message, callback) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');

    messageElement.textContent = message;
    modal.classList.add('show');

    // 移除旧的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // 添加新的事件监听器
    newConfirmBtn.addEventListener('click', function() {
        callback();
        closeModal('confirmModal');
    });
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// 显示提示
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 退出登录
function logout() {
    showConfirm('确定要退出登录吗？', () => {
        api.clearToken();
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

// 工具函数：格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 工具函数：转义HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 工具函数：只格式化日期（不含时间）
function formatDateOnly(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 工具函数：只格式化时间（不含日期）
function formatTimeOnly(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
