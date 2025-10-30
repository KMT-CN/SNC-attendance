// MongoDB 初始化脚本
db = db.getSiblingDB('attendance');

// 创建索引
db.users.createIndex({ username: 1 }, { unique: true });
db.tables.createIndex({ createdAt: -1 });
db.members.createIndex({ tableId: 1 });
db.members.createIndex({ employeeId: 1 });
db.records.createIndex({ tableId: 1, memberId: 1, checkinDate: -1 });
db.records.createIndex({ checkinDate: -1 });

print('MongoDB 初始化完成！');
