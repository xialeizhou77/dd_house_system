import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authRouter } from './routes/auth.js';
import { houseRouter } from './routes/house.js';
import { statsRouter } from './routes/stats.js';
import { coordsRouter } from './routes/coords.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'house-system-secret-key-2024';

// 生产环境：前后端同源，无需 CORS；开发环境：允许 Vite 开发服务器
app.use(cors(isProd ? { origin: true, credentials: true } : { origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Mock users (password: 123456)
const users = [
  { id: 1, username: 'admin', password: bcrypt.hashSync('123456', 10), name: '管理员' },
  { id: 2, username: 'user1', password: bcrypt.hashSync('123456', 10), name: '张三' },
];

// Mock house selection data
export const mockData = {
  persons: [
    { id: 'P001', orderNo: '0001', name: '张三', idNumber: '110101199001011234', phone: '13800138001', status: '未选房' },
    { id: 'P002', orderNo: '0002', name: '李四', idNumber: '110101199002021234', phone: '13800138002', status: '已选房' },
    { id: 'P003', orderNo: '0003', name: '王五', idNumber: '110101199003031234', phone: '13800138003', status: '未选房' },
    { id: 'P004', orderNo: '0004', name: '赵玉凤', idNumber: '110228197712316420', phone: '13800138004', status: '未选房' },
  ],
  houses: [
    { id: 'H001', building: '1栋', unit: '1单元', floor: 5, room: '501', area: 85, status: '可选' },
    { id: 'H002', building: '1栋', unit: '1单元', floor: 5, room: '502', area: 90, status: '已选' },
    { id: 'H003', building: '1栋', unit: '1单元', floor: 6, room: '601', area: 85, status: '可选' },
    { id: 'H004', building: '1栋', unit: '2单元', floor: 3, room: '301', area: 100, status: '可选' },
    { id: 'H005', building: '2栋', unit: '1单元', floor: 4, room: '401', area: 95, status: '已选' },
    { id: 'H006', building: '2栋', unit: '1单元', floor: 7, room: '701', area: 120, status: '可选' },
  ],
};

app.set('jwtSecret', JWT_SECRET);
app.set('users', users);
app.set('mockData', mockData);

app.use('/api/auth', authRouter);
app.use('/api/house', houseRouter);
app.use('/api/stats', statsRouter);
app.use('/api/building-coords', coordsRouter);

// 生产环境：托管前端静态文件，SPA 路由回退到 index.html
if (isProd) {
  const distPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}${isProd ? ' (生产)' : ''}`);
});
