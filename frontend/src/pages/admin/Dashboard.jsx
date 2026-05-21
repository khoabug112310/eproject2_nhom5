import React from 'react';
import RoleDashboardShell from '../../components/RoleDashboardShell';

export default function AdminDashboard() {
  return (
    <RoleDashboardShell
      role="admin"
      title="Bảng điều khiển quản trị"
      subtitle="Quản lý người dùng, phân quyền, danh mục và các thiết lập của phòng khám."
      cards={[
        { title: 'Người dùng', description: 'Quản lý tài khoản bác sĩ, nhân viên và bệnh nhân.', icon: '1' },
        { title: 'Phân quyền', description: 'Kiểm soát vai trò truy cập theo chức năng.', icon: '2' },
        { title: 'Danh mục', description: 'Cập nhật khoa, dịch vụ, thuốc và cấu hình hệ thống.', icon: '3' },
      ]}
    />
  );
}
