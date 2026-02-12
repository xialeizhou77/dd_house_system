import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export const houseRouter = Router();

houseRouter.use(authMiddleware);

// 根据编号查询选房人信息
houseRouter.get('/person/:code', (req, res) => {
  const { code } = req.params;
  const { persons } = req.app.get('mockData');
  const person = persons.find(p => p.id === code || p.orderNo === code || p.idNumber === code || p.phone === code);

  if (!person) {
    return res.status(404).json({ message: '未找到选房人信息' });
  }

  res.json(person);
});

// 获取未选房列表
houseRouter.get('/persons/unselected', (req, res) => {
  const { persons } = req.app.get('mockData');
  const unselected = persons.filter(p => p.status === '未选房');
  res.json(unselected);
});

// 获取全部选房人列表
houseRouter.get('/persons/all', (req, res) => {
  const { persons } = req.app.get('mockData');
  res.json(persons);
});

// 获取可选房源列表
houseRouter.get('/houses/available', (req, res) => {
  const { houses } = req.app.get('mockData');
  const available = houses.filter(h => h.status === '可选');
  res.json(available);
});

// 获取全部房源列表
houseRouter.get('/houses/all', (req, res) => {
  const { houses } = req.app.get('mockData');
  res.json(houses);
});

// 执行选房
houseRouter.post('/select', (req, res) => {
  const { personId, houseId } = req.body;
  const mockData = req.app.get('mockData');

  const person = mockData.persons.find(p => p.id === personId);
  const house = mockData.houses.find(h => h.id === houseId);

  if (!person) return res.status(404).json({ message: '选房人不存在' });
  if (!house) return res.status(404).json({ message: '房源不存在' });
  if (person.status === '已选房') return res.status(400).json({ message: '该人选房已完成' });
  if (house.status === '已选') return res.status(400).json({ message: '该房源已被选择' });

  person.status = '已选房';
  house.status = '已选';

  res.json({ success: true, message: '选房成功', data: { person, house } });
});
