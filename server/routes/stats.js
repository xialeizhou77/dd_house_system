import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const statsRouter = Router();

statsRouter.use(authMiddleware);

// 获取选房统计
statsRouter.get('/', (req, res) => {
  const { persons, houses } = req.app.get('mockData');
  const totalHouses = houses.length;
  const selectedCount = houses.filter(h => h.status === '已选').length;
  const todaySelected = Math.floor(Math.random() * 5) + 1; // 模拟当日数据

  res.json({
    date: new Date().toLocaleDateString('zh-CN'),
    todaySelected,
    pendingDelivery: totalHouses - selectedCount,
    totalSelected: selectedCount,
    totalHouses,
  });
});
