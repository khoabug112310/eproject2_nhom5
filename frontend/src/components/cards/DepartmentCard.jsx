import React from 'react';

export default function DepartmentCard({ name, departmentName, description, doctorCount, onViewDoctors }) {
  const displayName = name || departmentName || 'Chuyên Khoa';
  
  // Dynamic Emoji Icon selection based on department name
  const getDeptIcon = (deptName) => {
    const lower = String(deptName).toLowerCase();
    if (lower.includes('nội')) return '🫁';
    if (lower.includes('ngoại')) return '🩹';
    if (lower.includes('nhi')) return '👶';
    if (lower.includes('sản') || lower.includes('phụ')) return '🤰';
    if (lower.includes('tim') || lower.includes('mạch')) return '🫀';
    if (lower.includes('cổ truyền') || lower.includes('đông y')) return '🌿';
    if (lower.includes('răng') || lower.includes('nha')) return '🦷';
    if (lower.includes('tai') || lower.includes('họng')) return '👂';
    if (lower.includes('mắt') || lower.includes('nhãn')) return '👁️';
    if (lower.includes('da liễu')) return '🧪';
    if (lower.includes('thần kinh') || lower.includes('não')) return '🧠';
    if (lower.includes('xét nghiệm')) return '🔬';
    return '🏥';
  };

  const iconEmoji = getDeptIcon(displayName);

  return (
    <div className="dept-card fade-in">
      <div className="dept-card-header">
        <div className="dept-icon-wrapper">
          {iconEmoji}
        </div>
        <div className="dept-card-info">
          <h4>{displayName}</h4>
          <span>{doctorCount || 0} Bác sĩ</span>
        </div>
      </div>
      <p className="dept-card-desc" title={description}>
        {description || 'Chuyên khoa cung cấp dịch vụ khám và điều trị chất lượng cao với trang thiết bị hiện đại và đội ngũ chuyên gia tận tâm.'}
      </p>
      <button className="dept-card-action" onClick={onViewDoctors}>
        Xem đội ngũ bác sĩ
      </button>
    </div>
  );
}
