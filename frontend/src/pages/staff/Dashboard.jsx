import React from 'react';
import RoleDashboardShell from '../../components/RoleDashboardShell';

export default function StaffDashboard() {
  return (
    <RoleDashboardShell
      role="staff"
      title="Cổng CSKH"
      subtitle="Tiếp nhận đặt lịch, xác nhận thông tin và hỗ trợ bệnh nhân trước khi vào khám."
      cards={[
        { title: 'Xác nhận đặt lịch', description: 'Duyệt nhanh các yêu cầu đặt lịch từ bệnh nhân.', icon: '1' },
        { title: 'Điều phối lịch', description: 'Sắp xếp bác sĩ, chuyên khoa và thời gian phù hợp.', icon: '2' },
        { title: 'Hỗ trợ liên hệ', description: 'Gọi lại và cập nhật thông tin cần thiết cho bệnh nhân.', icon: '3' },
      ]}
    />
  );
}
