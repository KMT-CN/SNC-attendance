// 清空用户数据的脚本
// 使用方法: node clear-users.js

require('dotenv').config();
const mongoose = require('mongoose');

async function clearUsers() {
    try {
        // 连接数据库
        console.log('正在连接数据库...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ 数据库连接成功');

        // 获取用户集合
        const User = mongoose.connection.collection('users');

        // 统计当前用户数量
        const beforeCount = await User.countDocuments();
        console.log(`📊 当前用户数量: ${beforeCount}`);

        if (beforeCount === 0) {
            console.log('✅ 数据库中没有用户，无需清空');
            process.exit(0);
        }

        // 确认操作
        console.log('\n⚠️  警告: 即将删除所有用户数据！');
        console.log('   这将清空数据库中的所有用户账户');
        console.log('   删除后，首次注册的用户将成为超级管理员\n');

        // 删除所有用户
        const result = await User.deleteMany({});
        console.log(`✅ 已删除 ${result.deletedCount} 个用户`);

        // 验证删除结果
        const afterCount = await User.countDocuments();
        console.log(`📊 删除后用户数量: ${afterCount}`);

        if (afterCount === 0) {
            console.log('\n🎉 用户数据清空成功！');
            console.log('现在可以访问登录页面，注册第一个超级管理员账户了。');
        }

        await mongoose.connection.close();
        console.log('✅ 数据库连接已关闭');
        process.exit(0);
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

clearUsers();
