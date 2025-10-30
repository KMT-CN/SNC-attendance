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
let users = [];
let currentUser = null;
// PN532 控制器（懒加载模块）
let pn532Controller = null;

// 初始化应用
function initializeApp() {
    // 显示用户名
    const usernameElement = document.getElementById('username');
    usernameElement.textContent = localStorage.getItem('username') || '管理员';
    
    // 获取当前用户信息
    const userRole = localStorage.getItem('userRole');
    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
    currentUser = {
        username: localStorage.getItem('username'),
        role: userRole,
        isSuperAdmin: isSuperAdmin
    };

    // 如果是超级管理员，显示用户管理菜单
    if (isSuperAdmin) {
        document.getElementById('usersNavItem').style.display = 'block';
    }

    // 加载数据
    loadData();

    // 绑定事件
    bindEvents();

    // 初始显示
    updateDisplay();
}

// 启动读卡器：动态导入模块并用当前设置创建控制器
async function startCardListener() {
    if (pn532Controller) {
        // 已经启动或正在运行
        showToast('读卡器已启动或正在运行', 'info');
        return;
    }

    try {
        const mod = await import('./pn532.js');
        if (!mod || !mod.createPN532) {
            throw new Error('pn532 模块缺少 createPN532 导出');
        }

        pn532Controller = mod.createPN532(() => activeTable, () => currentMode);
        pn532Controller.start();
        showToast('读卡器已启动，等待刷卡...', 'success');
    } catch (error) {
        console.error('启动读卡器失败:', error);
        showToast('启动读卡器失败: ' + (error.message || error), 'error');
        pn532Controller = null;
    }
}

// 停止读卡器（如需要）
function stopCardListener() {
    if (pn532Controller && pn532Controller.stop) {
        try {
            pn532Controller.stop();
            showToast('读卡器已停止', 'info');
        } catch (err) {
            console.error('停止读卡器时出错:', err);
        }
    }
    pn532Controller = null;
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

        // 如果是超级管理员，加载用户列表
        if (currentUser && currentUser.isSuperAdmin) {
            try {
                const usersResponse = await userAPI.getAll();
                users = usersResponse.data || [];
            } catch (error) {
                console.error('Load users error:', error);
            }
        }

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

    // 绑定卡片
    document.getElementById('bindCardForm').addEventListener('submit', handleBindCard);

    // 开始读卡（懒加载 pn532 模块）
    const startBtn = document.getElementById('startListeningBtn');
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            await startCardListener();
        });
    }

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

    // 用户管理（仅超级管理员）
    if (currentUser && currentUser.isSuperAdmin) {
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', openAddUserModal);
        }
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', handleAddUser);
        }
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', handleEditUser);
        }
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handleChangePassword);
        }
    }

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
            // 点击模态外部时隐藏模态（统一使用 style.display 控制）
            e.target.style.display = 'none';
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
    if (currentUser && currentUser.isSuperAdmin) {
        updateUsersDisplay();
    }
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
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无成员数据</td></tr>';
        return;
    }

    tbody.innerHTML = filteredMembers.map(member => {
        const cardStatus = member.cardId ? 
            `<span style="color: #28a745;">✓ 已绑定</span>` : 
            `<span style="color: #6c757d;">未绑定</span>`;
        
        const cardAction = member.cardId ? 
            `<button class="btn btn-secondary" onclick="unbindCard('${member.id}')">解绑卡片</button>` : 
            `<button class="btn btn-primary" onclick="bindCard('${member.id}', '${escapeHtml(member.name)}', '${escapeHtml(member.employeeId)}')">绑定卡片</button>`;
        
        return `
            <tr>
                <td><input type="checkbox" class="member-checkbox" data-id="${member.id}"></td>
                <td>${escapeHtml(member.name)}</td>
                <td>${escapeHtml(member.employeeId)}</td>
                <td>${escapeHtml(member.contact || '-')}</td>
                <td>${cardStatus}</td>
                <td>${formatDate(member.joinedAt)}</td>
                <td class="actions">
                    ${cardAction}
                    <button class="btn btn-danger" onclick="deleteMember('${member.id}')">删除</button>
                </td>
            </tr>
        `;
    }).join('');

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
        const table = tables.find(t => t.id === activeTable);
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
    showModal('createTableModal');
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

    // 如果在成员管理页面已经选择了表格，则在添加成员时默认选中该表格
    const tableFilter = document.getElementById('tableFilter');
    const memberTableSelect = document.getElementById('memberTable');
    
    if (tableFilter && memberTableSelect && tableFilter.value) {
        memberTableSelect.value = tableFilter.value;
    } else if (memberTableSelect) {
        // 否则，确保没有残留选项
        memberTableSelect.value = '';
    }

    showModal('addMemberModal');
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
    
    showModal('manualRecordModal');
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
    // 统一使用 style.display 控制可见性（默认隐藏）
    modal.style.display = 'block';

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
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 显示模态框（取消隐藏）
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
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

// ============ 卡片绑定功能 ============

// 打开绑定卡片对话框
function bindCard(memberId, memberName, memberEmployeeId) {
    const modal = document.getElementById('bindCardModal');
    document.getElementById('bindMemberId').value = memberId;
    document.getElementById('bindMemberName').value = memberName;
    document.getElementById('bindMemberEmployeeId').value = memberEmployeeId;
    document.getElementById('cardId').value = '';
    modal.style.display = 'block';
}

// 处理绑定卡片表单提交
async function handleBindCard(e) {
    e.preventDefault();
    
    const memberId = document.getElementById('bindMemberId').value;
    const cardId = document.getElementById('cardId').value.trim();
    
    if (!cardId) {
        showToast('请输入卡片ID', 'error');
        return;
    }
    
    try {
        const response = await memberAPI.bindCard(memberId, cardId);
        
        if (response.success) {
            showToast('卡片绑定成功');
            closeModal('bindCardModal');
            await loadData();
            updateDisplay();
        }
    } catch (error) {
        console.error('绑定卡片失败:', error);
        showToast('绑定失败: ' + error.message, 'error');
    }
}

// 解绑卡片
function unbindCard(memberId) {
    showConfirm('确定要解绑该成员的卡片吗？', async () => {
        try {
            const response = await memberAPI.unbindCard(memberId);
            
            if (response.success) {
                showToast('卡片解绑成功');
                await loadData();
                updateDisplay();
            }
        } catch (error) {
            console.error('解绑卡片失败:', error);
            showToast('解绑失败: ' + error.message, 'error');
        }
    });
}

// ============ 用户管理功能 ============

// 更新用户列表显示
function updateUsersDisplay() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无用户数据</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => {
        const roleText = user.isSuperAdmin ? '超级管理员' : (user.role === 'admin' ? '管理员' : '普通用户');
        const canEdit = !user.isSuperAdmin || user._id === currentUser.userId;
        const canDelete = !user.isSuperAdmin && user._id !== localStorage.getItem('userId');
        
        return `
            <tr>
                <td>${escapeHtml(user.username)}</td>
                <td>
                    <span class="badge ${user.isSuperAdmin ? 'badge-superadmin' : (user.role === 'admin' ? 'badge-admin' : 'badge-user')}">
                        ${roleText}
                    </span>
                </td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${formatDate(user.updatedAt)}</td>
                <td>
                    ${canEdit ? `<button class="btn btn-sm btn-secondary" onclick="editUser('${user._id}', '${escapeHtml(user.username)}', '${user.role}', ${user.isSuperAdmin})">编辑</button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="openChangePasswordModal('${user._id}', '${escapeHtml(user.username)}')">改密码</button>
                    ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}', '${escapeHtml(user.username)}')">删除</button>` : ''}
                    ${!canEdit && !canDelete ? '<span style="color: #999;">-</span>' : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// 打开添加用户模态框
function openAddUserModal() {
    const modal = document.getElementById('addUserModal');
    document.getElementById('addUserForm').reset();
    showModal('addUserModal');
}

// 处理添加用户
async function handleAddUser(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    if (!username || !password) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('密码至少6个字符', 'error');
        return;
    }
    
    try {
        const response = await userAPI.create(username, password, role);
        
        if (response.success) {
            showToast('用户添加成功');
            closeModal('addUserModal');
            await loadData();
            updateDisplay();
        }
    } catch (error) {
        console.error('添加用户失败:', error);
        showToast('添加失败: ' + error.message, 'error');
    }
}

// 编辑用户
function editUser(userId, username, role, isSuperAdmin) {
    if (isSuperAdmin && userId !== localStorage.getItem('userId')) {
        showToast('不能修改超级管理员信息', 'error');
        return;
    }
    
    const modal = document.getElementById('editUserModal');
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUsername').value = username;
    document.getElementById('editUserRole').value = role;
    
    // 超级管理员不能修改自己的角色
    if (isSuperAdmin) {
        document.getElementById('editUserRole').disabled = true;
    } else {
        document.getElementById('editUserRole').disabled = false;
    }
    
    showModal('editUserModal');
}

// 处理编辑用户
async function handleEditUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value.trim();
    const role = document.getElementById('editUserRole').value;
    
    if (!username) {
        showToast('用户名不能为空', 'error');
        return;
    }
    
    try {
        const response = await userAPI.update(userId, username, role);
        
        if (response.success) {
            showToast('用户信息更新成功');
            closeModal('editUserModal');
            await loadData();
            updateDisplay();
        }
    } catch (error) {
        console.error('更新用户失败:', error);
        showToast('更新失败: ' + error.message, 'error');
    }
}

// 打开修改密码模态框
function openChangePasswordModal(userId, username) {
    const modal = document.getElementById('changePasswordModal');
    document.getElementById('changePasswordUserId').value = userId;
    document.getElementById('changePasswordUsername').value = username;
    document.getElementById('newUserPassword').value = '';
    document.getElementById('confirmUserPassword').value = '';
    showModal('changePasswordModal');
}

// 处理修改密码
async function handleChangePassword(e) {
    e.preventDefault();
    
    const userId = document.getElementById('changePasswordUserId').value;
    const newPassword = document.getElementById('newUserPassword').value;
    const confirmPassword = document.getElementById('confirmUserPassword').value;
    
    if (!newPassword || !confirmPassword) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('密码至少6个字符', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }
    
    try {
        const response = await userAPI.changePassword(userId, newPassword);
        
        if (response.success) {
            showToast('密码修改成功');
            closeModal('changePasswordModal');
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        showToast('修改失败: ' + error.message, 'error');
    }
}

// 删除用户
function deleteUser(userId, username) {
    showConfirm(`确定要删除用户"${username}"吗？`, async () => {
        try {
            const response = await userAPI.delete(userId);
            
            if (response.success) {
                showToast('用户删除成功');
                await loadData();
                updateDisplay();
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            showToast('删除失败: ' + error.message, 'error');
        }
    });
}
