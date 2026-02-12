const villageOptions = ['一村', '二村', '三村', '四村'];
const townOptions = ['密云镇', '溪翁庄镇'];
const familyNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];

// 每个村近 10 天的选房套数（行：村，列：日期）
const villageDayCounts = {
  一村: [2, 3, 4, 5, 4, 6, 5, 7, 6, 8],
  二村: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6],
  三村: [0, 1, 1, 2, 2, 3, 3, 3, 4, 4],
  四村: [1, 1, 2, 2, 3, 3, 2, 3, 4, 5],
};

// 生成稳定、可视化友好的 mock 选房记录，用于「选房管理」和首页可视化
export const selectionData = (() => {
  const rows = [];
  const base = new Date();
  base.setDate(base.getDate() - 9); // 最近 10 天
  let id = 1;

  villageOptions.forEach((village, vIdx) => {
    const counts = villageDayCounts[village];
    counts.forEach((count, dayIndex) => {
      const dateObj = new Date(base);
      dateObj.setDate(base.getDate() + dayIndex);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const selectDate = `${yyyy}-${mm}-${dd}`;

      for (let k = 0; k < count; k += 1) {
        const padded = String(id).padStart(4, '0');
        const firstRound = id % 3 === 0 ? '已选' : '未选';
        const secondRound = firstRound === '已选' ? '已选' : (id % 7 === 0 ? '已选' : '未选');
        const selectionRound = firstRound === '已选' ? 1 : 2; // 1=仅第一轮, 2=进入第二轮
        const stayNo = `S${padded}`;
        const archiveNo = `DA-2024-${padded}`;
        const name = `${familyNames[id % familyNames.length]}${firstRound === '已选' ? '明' : '伟'}${String(id).slice(-1)}`;
        const idNumber = `11010119900101${padded}`;
        const phone = `138${String(10000000 + id).slice(-8)}`;
        const confirmer = id % 2 === 0 ? '张三' : '李四';
        const checker = id % 2 === 0 ? '王五' : '赵六';
        const building = 1 + ((id + vIdx) % 9);
        const district = vIdx % 2 === 0 ? '西区' : '东区';
        const unit = ((id + vIdx) % 2) + 1;
        const floor = ((id + dayIndex) % 11) + 1;
        const houseNo = `${building}-${unit}-${floor.toString().padStart(2, '0')}01`;
        const buildingKey = `${district}_${building}`;
        const isSelected = firstRound === '已选' || secondRound === '已选';
        const selectedUnitDisplay = isSelected ? `${district}${building}号楼 ${unit}单元 ${floor}01` : '';
        const 已选区 = isSelected ? district : '';
        const 已选楼号 = isSelected ? String(building) : '';
        const finalArea = id % 2 === 0 ? '87㎡' : '100㎡';
        const town = townOptions[vIdx % townOptions.length];

        rows.push({
          id,
          queryNo: padded,
          name,
          idNumber,
          phone,
          firstRound,
          secondRound,
          selectionRound,
          stayNo,
          archiveNo,
          confirmer,
          checker,
          houseNo,
          buildingKey,
          已选房源: selectedUnitDisplay,
          已选区,
          已选楼号,
          finalArea,
          village,
          town,
          selectDate,
        });

        id += 1;
      }
    });
  });

  return rows;
})();

