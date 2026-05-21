import React from 'react';
import RoleDashboardShell from '../../components/RoleDashboardShell';

export default function DoctorSchedule() {
  return (
    <RoleDashboardShell
      role="doctor"
      title="Cổng bác sĩ"
      subtitle="Xem lịch làm việc, danh sách bệnh nhân và thao tác khám trong ngày."
      cards={[
        { title: 'Lịch trực', description: 'Nắm các ca làm việc và khung giờ khám của bạn.', icon: '1' },
        { title: 'Bệnh nhân hôm nay', description: 'Xem nhanh danh sách bệnh nhân cần tiếp nhận.', icon: '2' },
        { title: 'Kê đơn', description: 'Tạo chỉ định và đơn thuốc sau khi khám.', icon: '3' },
      ]}
    />
  );
}
