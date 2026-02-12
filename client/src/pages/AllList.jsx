import { useEffect, useState } from 'react';
import api from '../api/client';
import './List.css';

export default function AllList({ round = 1 }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/house/persons/all')
      .then(({ data }) => setList(data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="list-page">
      <h3 className="page-title">第{round}轮选房 - 全部列表</h3>
      {loading ? (
        <p className="loading-msg">加载中...</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>姓名</th>
                <th>身份证号</th>
                <th>联系电话</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5}>暂无数据</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.name}</td>
                    <td>{row.idNumber}</td>
                    <td>{row.phone}</td>
                    <td>
                      <span className={`status-badge ${row.status === '已选房' ? 'done' : 'pending'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
