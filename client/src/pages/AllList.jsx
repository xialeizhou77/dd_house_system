import { useMemo } from 'react';
import { useSelectionData } from '../contexts/SelectionDataContext';
import './List.css';

export default function AllList({ round = 1 }) {
  const { rows } = useSelectionData();

  const list = useMemo(() => {
    if (round === 1) {
      return rows.map((r) => ({
        id: r.id,
        orderNo: r.queryNo,
        name: r.name,
        idNumber: r.idNumber,
        phone: r.phone,
        status: r.firstRound === '已选' ? '已选房' : '未选房',
      }));
    }
    return rows
      .filter((r) => r.selectionRound === 2)
      .map((r) => ({
        id: r.id,
        orderNo: r.queryNo,
        name: r.name,
        idNumber: r.idNumber,
        phone: r.phone,
        status: r.secondRound === '已选' ? '已选房' : '未选房',
      }));
  }, [rows, round]);

  return (
    <div className="list-page">
      <h3 className="page-title">第{round}轮选房 - 全部列表</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>选房序号</th>
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
                  <td>{row.orderNo}</td>
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
    </div>
  );
}
