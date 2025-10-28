// 检查用户数据的脚本
// 使用方法: node check-users.js

require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
    try {
        // 连接数据库
        console.log('正在连接数据库...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ 数据库连接成功\n');

        // 获取用户集合
        const User = mongoose.connection.collection('users');

        // 统计用户数量
        const count = await User.countDocuments();
        console.log('='.repeat(50));
        console.log('📊 数据库状态');
        console.log('='.repeat(50));
        console.log(`用户总数: ${count}`);
        console.log(`需要初始化: ${count === 0 ? '是 ✅' : '否 ❌'}`);
        console.log('='.repeat(50));

        if (count > 0) {
            console.log('\n👥 用户列表:');
            console.log('-'.repeat(50));
            
            const users = await User.find({}).toArray();
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. 用户名: ${user.username}`);
                console.log(`   角色: ${user.role || 'N/A'}`);
                console.log(`   超级管理员: ${user.isSuperAdmin ? '是 ⭐' : '否'}`);
                console.log(`   创建时间: ${user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : 'N/A'}`);
            });
            console.log('\n' + '-'.repeat(50));
        } else {
            console.log('\n💡 提示: 数据库中没有用户');
            console.log('   现在访问登录页面，可以注册第一个超级管理员账户');
        }

        await mongoose.connection.close();
        console.log('\n✅ 数据库连接已关闭');
    } catch (error) {
        console.error('\n❌ 错误:', error.message);
        console.error('\n可能的原因:');
        console.error('  1. MongoDB 服务未启动');
        console.error('  2. .env 文件中的 MONGODB_URI 配置错误');
        console.error('  3. 网络连接问题');
        process.exit(1);
    }
}

checkUsers();
