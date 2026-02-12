import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COORDS_FILE = path.join(__dirname, '../data/buildingCoords.json');

export const coordsRouter = Router();

function readCoords() {
  try {
    const data = fs.readFileSync(COORDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeCoords(data) {
  fs.writeFileSync(COORDS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

coordsRouter.get('/', (req, res) => {
  const coords = readCoords();
  res.json(coords);
});

coordsRouter.post('/', (req, res) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ message: '请求体应为楼栋坐标数组' });
  }
  const normalized = body.map((item) => {
    if (!item || typeof item.id !== 'string' || typeof item.label !== 'string' || !item.zone) {
      return null;
    }
    const top = item.top != null ? (typeof item.top === 'string' ? item.top : `${item.top}%`) : '0%';
    const left = item.left != null ? (typeof item.left === 'string' ? item.left : `${item.left}%`) : '0%';
    return { id: item.id, label: item.label, zone: item.zone, top, left };
  });
  if (normalized.some((x) => x === null)) {
    return res.status(400).json({ message: '每项需包含 id, label, zone，可选 top, left' });
  }
  writeCoords(normalized);
  res.json({ success: true, data: normalized });
});
