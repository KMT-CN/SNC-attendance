import { Pn532 } from 'pn532.js'
import Pn532Hf14a from 'pn532.js/plugin/Hf14a.js'
import Pn532WebserialAdapter from 'pn532.js/plugin/WebserialAdapter.js'

// 该模块导出 createPN532 工厂函数，接受两个回调：
// getActiveTable() -> 返回当前活动表格 ID
// getRecordType() -> 返回当前记录类型 ("checkin" 或 "checkout")
export function createPN532(getActiveTable, getRecordType) {
    const pn532node = new Pn532()
    pn532node.use(new Pn532WebserialAdapter())
    pn532node.use(new Pn532Hf14a())

    let running = false;

    // start 开始循环读取卡片
    async function start() {
        if (running) return;
        running = true;
        let cachedUid = null;

        while (running) {
            try {
                const result = await pn532node.$hf14a.mfSelectCard();
                const uid = result?.uid?.hex;
                if (!uid) {
                    // 没读到卡，短暂等待
                    await new Promise(r => setTimeout(r, 200));
                    continue;
                }

                if (cachedUid === uid) {
                    // 已经处理过的卡，忽略
                    await new Promise(r => setTimeout(r, 100));
                    continue;
                }

                cachedUid = uid;
                console.log('Card detected with UID:', uid);
                document.getElementById('cardId').value = uid;

                // 先查询成员信息（使用页面全局的 memberAPI）
                try {
                    const memberResponse = await memberAPI.getByCard(uid);
                    if (memberResponse && memberResponse.success) {
                        const tableId = getActiveTable && getActiveTable();
                        const recordType = getRecordType && getRecordType();

                        try {
                            await recordAPI.cardCheckin(uid, tableId, recordType);
                            console.log('cardCheckin called', { uid, tableId, recordType });
                        } catch (err) {
                            console.error('cardCheckin error:', err);
                        }
                    } else {
                        console.log('Member not found for card:', uid);
                    }
                } catch (err) {
                    console.error('memberAPI.getByCard error:', err);
                }

                // 防抖：3 秒后允许同一卡再次触发
                setTimeout(() => { cachedUid = null; }, 3000);
            } catch (error) {
                console.error('Error reading card:', error);
                // 出现错误时小等待，避免 tight-loop
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    function stop() {
        running = false;
    }

    return { start, stop };
}
  