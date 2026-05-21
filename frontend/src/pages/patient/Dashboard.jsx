import React from 'react';
import RoleDashboardShell from '../../components/RoleDashboardShell';

export default function PatientDashboard() {
  return (
    <RoleDashboardShell
      role="patient"
      title="Cổng bệnh nhân"
      subtitle="Theo dõi lịch hẹn, hồ sơ khám và hóa đơn trong một giao diện đơn giản."
      cards={[
        { title: 'Lịch hẹn gần đây', description: 'Xem các cuộc hẹn đang chờ hoặc đã xác nhận.', icon: '1' },
        { title: 'Hồ sơ khám', description: 'Truy cập nhanh các ghi chú và chẩn đoán trước đây.', icon: '2' },
        { title: 'Thanh toán', description: 'Theo dõi các hóa đơn và trạng thái thanh toán.', icon: '3' },
      ]}
    />
  );
}
