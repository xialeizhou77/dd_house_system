import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  IconManage,
  IconRound1,
  IconRound2,
  IconPlay,
  IconList,
  IconTable,
} from '../components/Icons';
import './HouseSelection.css';

const menuItems = [
  { key: 'manage', label: '选房管理', path: '/house-selection/manage', icon: IconManage },
  {
    key: 'round1',
    label: '第一轮选房',
    icon: IconRound1,
    children: [
      { key: 'round1/start', label: '开始选房', path: '/house-selection/round1/start', icon: IconPlay },
      { key: 'round1/unselected', label: '未选房列表', path: '/house-selection/round1/unselected', icon: IconList },
      { key: 'round1/all', label: '全部列表', path: '/house-selection/round1/all', icon: IconTable },
    ],
  },
  {
    key: 'round2',
    label: '第二轮选房',
    icon: IconRound2,
    children: [
      { key: 'round2/start', label: '开始选房', path: '/house-selection/round2/start', icon: IconPlay },
      { key: 'round2/unselected', label: '未选房列表', path: '/house-selection/round2/unselected', icon: IconList },
      { key: 'round2/all', label: '全部列表', path: '/house-selection/round2/all', icon: IconTable },
    ],
  },
];

function TreeNode({ item, level = 0 }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = item.children?.length;

  if (hasChildren) {
    return (
      <div className="tree-node">
        <div
          className="tree-node-label"
          style={{ paddingLeft: 12 + level * 16 }}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="tree-toggle">{expanded ? '▼' : '▶'}</span>
          {item.icon && <span className="tree-node-icon">{React.createElement(item.icon)}</span>}
          {item.label}
        </div>
        {expanded && (
          <div className="tree-children">
            {item.children.map((child) => (
              <TreeNode key={child.key} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <TreeLeaf item={item} level={level} />
  );
}

function TreeLeaf({ item, level }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <div
      className={`tree-leaf ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: 12 + level * 16 }}
      onClick={() => navigate(item.path)}
    >
      {item.icon && <span className="tree-leaf-icon">{React.createElement(item.icon)}</span>}
      {item.label}
    </div>
  );
}

export default function HouseSelection() {
  const location = useLocation();
  const isBuildingPage = location.pathname.includes('/building');

  return (
    <div className={`house-selection-layout ${isBuildingPage ? 'full-width' : ''}`}>
      {!isBuildingPage && (
        <aside className="house-selection-sidebar">
          <h3 className="sidebar-title">安置房选房</h3>
          <nav className="tree-nav">
            {menuItems.map((item) => (
              <TreeNode key={item.key} item={item} />
            ))}
          </nav>
        </aside>
      )}
      <div className="house-selection-content">
        <Outlet />
      </div>
    </div>
  );
}
