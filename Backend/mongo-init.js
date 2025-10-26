// MongoDB 初始化脚本
db = db.getSiblingDB('attendance');

// 创建默认管理员用户
db.users.insertOne({
  username: 'admin',
  password: '$2a$10$X5XzN2YzWKJ3KGvY5h0cYuQZvLxKZhLjE5dZYKZN5YKZpN5YZ5YZY', // 密码: admin (需要用 bcrypt 加密)
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
});

// 创建索引
db.users.createIndex({ username: 1 }, { unique: true });
db.tables.createIndex({ createdAt: -1 });
db.members.createIndex({ tableId: 1 });
db.members.createIndex({ employeeId: 1 });
db.records.createIndex({ tableId: 1, memberId: 1, checkinDate: -1 });
db.records.createIndex({ checkinDate: -1 });

print('MongoDB 初始化完成！');
