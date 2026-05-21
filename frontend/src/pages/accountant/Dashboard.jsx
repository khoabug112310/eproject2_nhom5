import React from 'react';
import RoleDashboardShell from '../../components/RoleDashboardShell';

export default function AccountantDashboard() {
  return (
    <RoleDashboardShell
      role="accountant"
      title="Cổng kế toán"
      subtitle="Theo dõi hóa đơn, đối soát thanh toán và hỗ trợ quy trình thu phí."
      cards={[
        { title: 'Hóa đơn', description: 'Xem danh sách hóa đơn cần xử lý.', icon: '1' },
        { title: 'Thanh toán', description: 'Đánh dấu hóa đơn đã thu hoặc chờ thanh toán.', icon: '2' },
        { title: 'Báo cáo', description: 'Tổng hợp doanh thu và tình trạng công nợ.', icon: '3' },
      ]}
    />
  );
}
