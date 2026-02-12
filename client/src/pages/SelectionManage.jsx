import { useMemo, useState } from 'react';
import { IconSearch, IconTrash } from '../components/Icons';
import './SelectionManage.css';
import { useSelectionData } from '../contexts/SelectionDataContext';

export default function SelectionManage() {
  const { rows, setRows } = useSelectionData();
  const [editingId, setEditingId] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const pageSize = 10;

  function handleChange(id, field, value) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function handleSave(id) {
    // 这里只是本地保存 mock，不调用后端
    setEditingId(null);
  }

  function toggleSelect(id, checked) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }

  function handleBatchDelete() {
    if (!selectedIds.length) return;
    setShowBatchConfirm(true);
  }

  function confirmBatchDelete() {
    setRows((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
    setSelectedIds([]);
    setShowBatchConfirm(false);
    setEditingId(null);
    // 如果当前页超出总页数，回退一页
    const newPageCount = Math.max(
      1,
      Math.ceil(
        (rows.length - selectedIds.length) / pageSize,
      ),
    );
    setPage((p) => Math.min(p, newPageCount));
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage],
  );

  return (
    <div className="selection-manage">
      <div className="selection-manage-header">
        <span className="header-label">排号编号：</span>
        <input className="header-input" placeholder="请输入排号编号" />
        <span className="header-label">档案编号：</span>
        <input className="header-input" placeholder="请输入档案编号" />
        <button className="header-btn header-btn-icon">
          <IconSearch />
          查询
        </button>
        <button
          className="header-btn header-btn-icon header-btn-danger"
          disabled={!selectedIds.length}
          onClick={handleBatchDelete}
        >
          <IconTrash />
          批量删除
        </button>
      </div>

      <div className="selection-manage-table-wrap">
        <table className="selection-manage-table">
          <thead>
            <tr>
              <th>选择</th>
              <th>选房轮次</th>
              <th>查询编号</th>
              <th>所属村</th>
              <th>所属村镇</th>
              <th>选房日期</th>
              <th>第一轮选房</th>
              <th>第二轮选房</th>
              <th>已选房源</th>
              <th>已选区</th>
              <th>已选楼号</th>
              <th>滞留编号</th>
              <th>档案编号</th>
              <th>签收确认人</th>
              <th>核对人</th>
              <th>房源号</th>
              <th>拟正数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => toggleSelect(row.id, e.target.checked)}
                    />
                  </td>
                  <td>{row.selectionRound === 1 ? '1' : '1、2'}</td>
                  <td>{row.queryNo}</td>
                  <td>{row.village}</td>
                  <td>{row.town}</td>
                  <td>{row.selectDate}</td>
                  <td>
                    <span className={`round-badge round-first ${row.firstRound === '已选' ? 'round-selected' : 'round-unselected'}`}>
                      {row.firstRound}
                    </span>
                  </td>
                  <td>
                    <span className={`round-badge round-second ${
                      row.firstRound === '已选'
                        ? 'round-grey'
                        : row.secondRound === '已选'
                          ? 'round-selected'
                          : 'round-unselected'
                    }`}>
                      {row.secondRound}
                    </span>
                  </td>
                  <td>{row.已选房源 || '—'}</td>
                  <td>{row.已选区 || '—'}</td>
                  <td>{row.已选楼号 || '—'}</td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={row.stayNo}
                        onChange={(e) => handleChange(row.id, 'stayNo', e.target.value)}
                      />
                    ) : (
                      row.stayNo
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={row.archiveNo}
                        onChange={(e) => handleChange(row.id, 'archiveNo', e.target.value)}
                      />
                    ) : (
                      row.archiveNo
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={row.confirmer}
                        onChange={(e) => handleChange(row.id, 'confirmer', e.target.value)}
                      />
                    ) : (
                      row.confirmer
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={row.checker}
                        onChange={(e) => handleChange(row.id, 'checker', e.target.value)}
                      />
                    ) : (
                      row.checker
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={row.houseNo}
                        onChange={(e) => handleChange(row.id, 'houseNo', e.target.value)}
                      />
                    ) : (
                      row.houseNo
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={row.finalArea}
                        onChange={(e) => handleChange(row.id, 'finalArea', e.target.value)}
                      />
                    ) : (
                      row.finalArea
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setViewRow(row)}
                    >
                      查看
                    </button>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() =>
                        isEditing ? handleSave(row.id) : setEditingId(row.id)
                      }
                    >
                      {isEditing ? '保存' : '修改'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="selection-pagination">
        <button
          type="button"
          className="pager-btn"
          disabled={currentPage === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          上一页
        </button>
        <span className="pager-info">
          第 {currentPage} / {pageCount} 页，共 {rows.length} 条
        </span>
        <button
          type="button"
          className="pager-btn"
          disabled={currentPage === pageCount}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          下一页
        </button>
      </div>

      {viewRow && (
        <div className="selection-view-overlay" onClick={() => setViewRow(null)}>
          <div
            className="selection-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>选房记录详情</h3>
            <div className="selection-view-body">
              <table className="selection-view-table">
                <tbody>
                  <tr>
                    <td className="cell-label">查询编号</td>
                    <td className="cell-value">{viewRow.queryNo}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">所属村</td>
                    <td className="cell-value">{viewRow.village}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">所属村镇</td>
                    <td className="cell-value">{viewRow.town}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">选房日期</td>
                    <td className="cell-value">{viewRow.selectDate}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">选房轮次</td>
                    <td className="cell-value">{viewRow.selectionRound === 1 ? '1' : '1、2'}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">第一轮选房</td>
                    <td className="cell-value">{viewRow.firstRound}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">第二轮选房</td>
                    <td className="cell-value">{viewRow.secondRound}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">已选房源</td>
                    <td className="cell-value">{viewRow.已选房源 || '—'}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">已选区</td>
                    <td className="cell-value">{viewRow.已选区 || '—'}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">已选楼号</td>
                    <td className="cell-value">{viewRow.已选楼号 || '—'}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">滞留编号</td>
                    <td className="cell-value">{viewRow.stayNo}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">档案编号</td>
                    <td className="cell-value">{viewRow.archiveNo}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">签收确认人</td>
                    <td className="cell-value">{viewRow.confirmer}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">核对人</td>
                    <td className="cell-value">{viewRow.checker}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">房源号</td>
                    <td className="cell-value">{viewRow.houseNo}</td>
                  </tr>
                  <tr>
                    <td className="cell-label">拟正数</td>
                    <td className="cell-value">{viewRow.finalArea}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="selection-view-actions">
              <button
                type="button"
                className="header-btn"
                onClick={() => setViewRow(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchConfirm && (
        <div className="selection-view-overlay" onClick={() => setShowBatchConfirm(false)}>
          <div
            className="selection-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>批量删除确认</h3>
            <div className="selection-view-body">
              <p className="confirm-text">
                确定要删除选中的 {selectedIds.length} 条记录吗？此操作仅删除当前列表中的 mock 数据。
              </p>
            </div>
            <div className="selection-view-actions">
              <button
                type="button"
                className="header-btn"
                onClick={() => setShowBatchConfirm(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="header-btn header-btn-danger"
                onClick={confirmBatchDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

