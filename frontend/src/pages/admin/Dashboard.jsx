import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, cmsAPI, billingAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Stats Period Selection
  const [statsPeriod, setStatsPeriod] = useState('month'); // 'day' | 'week' | 'month'

  // User Creation Form State
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    roleName: 'doctor',
    fullName: '',
    email: '',
    phone: '',
    departmentId: '',
    specialization: 'Chuyên khoa',
    experienceYears: 5,
    baseFee: 150000,
    bio: '',
    position: '',
  });

  // CMS Post Creation/Edit Form State
  const [editingPost, setEditingPost] = useState(null);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    thumbnailURL: '',
    status: 'Published',
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Get analytics stats
      const statsRes = await profilesAPI.getAdminStats();
      setStats(statsRes.data.data);

      // 2. Get appointments queue for timeline audit
      const apptsRes = await schedulingAPI.getAppointments();
      setAppointments(apptsRes.data.data);

      // 3. Get invoices list
      const invoicesRes = await billingAPI.getInvoices();
      setInvoices(invoicesRes.data.data);

      // 4. Get departments list
      const deptsRes = await schedulingAPI.getDepartments();
      setDepartments(deptsRes.data.data);

      // 5. Get users list
      const usersRes = await profilesAPI.getUsers();
      setUsersList(usersRes.data.data);

      // 6. Get news articles
      const postsRes = await cmsAPI.getPosts();
      setPostsList(postsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi khi tải thông tin quản trị hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await profilesAPI.createUser({
        username: userForm.username,
        password: userForm.password,
        roleName: userForm.roleName,
        fullName: userForm.fullName,
        email: userForm.email || `${userForm.username}@clinic.com`,
        phone: userForm.phone || userForm.username,
        departmentId: userForm.roleName === 'doctor' ? userForm.departmentId : undefined,
        specialization: userForm.roleName === 'doctor' ? userForm.specialization : undefined,
        experienceYears: userForm.roleName === 'doctor' ? Number(userForm.experienceYears) : undefined,
        baseFee: userForm.roleName === 'doctor' ? Number(userForm.baseFee) : undefined,
        bio: userForm.roleName === 'doctor' ? userForm.bio : undefined,
        position: (userForm.roleName === 'staff' || userForm.roleName === 'accountant') ? userForm.position : undefined,
      });

      setSuccessMessage(`Đã đăng ký tài khoản ${userForm.fullName} (${userForm.roleName}) thành công!`);
      setUserForm({
        username: '',
        password: '',
        roleName: 'doctor',
        fullName: '',
        email: '',
        phone: '',
        departmentId: '',
        specialization: 'Chuyên khoa',
        experienceYears: 5,
        baseFee: 150000,
        bio: '',
        position: '',
      });
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi đăng ký tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (editingPost) {
        await cmsAPI.updatePost(editingPost._id, postForm);
        setSuccessMessage('Đã cập nhật bài viết thành công!');
      } else {
        await cmsAPI.createPost(postForm);
        setSuccessMessage('Đã tạo bài viết mới thành công!');
      }
      setEditingPost(null);
      setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi khi lưu bài viết.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      thumbnailURL: post.thumbnailURL || '',
      status: post.status || 'Published',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await cmsAPI.deletePost(postId);
      setSuccessMessage('Đã xóa bài viết thành công.');
      fetchAdminData();
    } catch (err) {
      setErrorMessage('Không thể xóa bài viết.');
    }
  };

  // Helper for timeline steps calculation
  const getTimelineSteps = (appt) => {
    const patientInvoice = invoices.find(inv => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Consultation');
    const pharmacyInvoice = invoices.find(inv => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Pharmacy');

    return [
      { label: 'Yêu cầu đặt', done: true, desc: 'Lịch hẹn đã đăng ký' },
      { label: 'CSKH Duyệt', done: appt.status !== 'Pending' && appt.status !== 'Canceled', desc: appt.status === 'Pending' ? 'Đang chờ' : 'Đã duyệt' },
      { label: 'Phí lâm sàng', done: patientInvoice?.status === 'Paid', desc: patientInvoice?.status === 'Paid' ? 'Đã thu' : 'Chưa đóng' },
      { label: 'Bác sĩ khám', done: appt.status === 'Completed', desc: appt.status === 'Completed' ? 'Đã khám xong' : 'Chưa khám' },
      { label: 'Tiền thuốc', done: pharmacyInvoice ? pharmacyInvoice.status === 'Paid' : null, desc: pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? 'Đã thanh toán' : 'Chờ thu tiền thuốc') : 'Không thuốc' },
    ];
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải bảng điều khiển quản trị viên...</p>
      </div>
    );
  }

  // Get selected stats
  const activeRegistrations = stats?.registrations?.[statsPeriod] || 0;
  const activeExaminations = stats?.examinations?.[statsPeriod] || 0;
  const activeRevenue = stats?.revenue?.[statsPeriod] || 0;

  // Pie chart calculation helper
  const totalBreakdown = (stats?.breakdown?.consultation || 0) + (stats?.breakdown?.pharmacy || 0);
  const consultationPct = totalBreakdown > 0 ? ((stats.breakdown.consultation / totalBreakdown) * 100).toFixed(0) : 50;
  const pharmacyPct = totalBreakdown > 0 ? ((stats.breakdown.pharmacy / totalBreakdown) * 100).toFixed(0) : 50;

  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role="admin" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">👑</div>
            <h4>Quản trị viên</h4>
            <p className="p-card-number">Quản trị toàn hệ thống</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'active' : ''}
            >
              📊 Báo cáo & Thống kê
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={activeTab === 'timeline' ? 'active' : ''}
            >
              🔄 Giám sát quy trình khám
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'active' : ''}
            >
              👥 Quản lý tài khoản mới
            </button>
            <button
              onClick={() => setActiveTab('cms')}
              className={activeTab === 'cms' ? 'active' : ''}
            >
              📰 Quản trị tin tức CMS
            </button>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Analytics */}
          {activeTab === 'analytics' && (
            <div className="dashboard-card animate-fade-in">
              <div className="card-header md-row flex-column" style={{ marginBottom: 20 }}>
                <div>
                  <h2>Báo cáo tổng quan phòng khám</h2>
                  <p className="subtitle">Thống kê hoạt động đăng ký, lượt khám và doanh thu thực tế.</p>
                </div>
                <div className="stats-period-toggles">
                  <button
                    onClick={() => setStatsPeriod('day')}
                    className={statsPeriod === 'day' ? 'active' : ''}
                  >
                    Hôm nay
                  </button>
                  <button
                    onClick={() => setStatsPeriod('week')}
                    className={statsPeriod === 'week' ? 'active' : ''}
                  >
                    Tuần này
                  </button>
                  <button
                    onClick={() => setStatsPeriod('month')}
                    className={statsPeriod === 'month' ? 'active' : ''}
                  >
                    Tháng này
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="stats-cards-grid" style={{ marginBottom: 30 }}>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <h3>{activeRegistrations}</h3>
                  <p>Lượt đăng ký lịch hẹn</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🩺</div>
                  <h3>{activeExaminations}</h3>
                  <p>Ca khám lâm sàng hoàn tất</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <h3>{formatVND(activeRevenue)}</h3>
                  <p>Tổng doanh thu thực nhận</p>
                </div>
              </div>

              {/* Interactive CSS/SVG Widgets */}
              <div className="analytics-visuals-grid">
                {/* SVG Revenue Graph */}
                <div className="visual-panel">
                  <h3>Biểu đồ so sánh tăng trưởng doanh thu</h3>
                  <p className="subtitle">So sánh Doanh thu Hôm nay vs Tuần này vs Tháng này</p>
                  
                  <div className="chart-wrapper">
                    <svg viewBox="0 0 400 220" className="svg-chart">
                      {/* Grid Lines */}
                      <line x1="50" y1="30" x2="370" y2="30" stroke="#e6eef8" strokeDasharray="3,3" />
                      <line x1="50" y1="80" x2="370" y2="80" stroke="#e6eef8" strokeDasharray="3,3" />
                      <line x1="50" y1="130" x2="370" y2="130" stroke="#e6eef8" strokeDasharray="3,3" />
                      <line x1="50" y1="180" x2="370" y2="180" stroke="#e6eef8" />

                      {/* Bar 1: Day */}
                      <rect x="80" y={180 - Math.max(10, Math.min(140, ((stats?.revenue?.day || 0) / (stats?.revenue?.month || 1)) * 140))} width="40" height={Math.max(10, Math.min(140, ((stats?.revenue?.day || 0) / (stats?.revenue?.month || 1)) * 140))} fill="url(#grad-blue)" rx="4" />
                      <text x="100" y="195" textAnchor="middle" fontSize="10" fill="#666">Hôm nay</text>
                      <text x="100" y={170 - Math.max(10, Math.min(140, ((stats?.revenue?.day || 0) / (stats?.revenue?.month || 1)) * 140))} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f52ba">{formatVND(stats?.revenue?.day).replace(/,00\s₫/g, 'đ')}</text>

                      {/* Bar 2: Week */}
                      <rect x="180" y={180 - Math.max(20, Math.min(140, ((stats?.revenue?.week || 0) / (stats?.revenue?.month || 1)) * 140))} width="40" height={Math.max(20, Math.min(140, ((stats?.revenue?.week || 0) / (stats?.revenue?.month || 1)) * 140))} fill="url(#grad-emerald)" rx="4" />
                      <text x="200" y="195" textAnchor="middle" fontSize="10" fill="#666">Tuần này</text>
                      <text x="200" y={170 - Math.max(20, Math.min(140, ((stats?.revenue?.week || 0) / (stats?.revenue?.month || 1)) * 140))} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#00a89d">{formatVND(stats?.revenue?.week).replace(/,00\s₫/g, 'đ')}</text>

                      {/* Bar 3: Month */}
                      <rect x="280" y={180 - 140} width="40" height="140" fill="url(#grad-purple)" rx="4" />
                      <text x="300" y="195" textAnchor="middle" fontSize="10" fill="#666">Tháng này</text>
                      <text x="300" y={170 - 140} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7000ff">{formatVND(stats?.revenue?.month).replace(/,00\s₫/g, 'đ')}</text>

                      {/* Gradients Definitions */}
                      <defs>
                        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0f52ba" />
                          <stop offset="100%" stopColor="#85d7ff" />
                        </linearGradient>
                        <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#00a89d" />
                          <stop offset="100%" stopColor="#a6ffea" />
                        </linearGradient>
                        <linearGradient id="grad-purple" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#7000ff" />
                          <stop offset="100%" stopColor="#e2b6ff" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Pie/Gauge Revenue breakdown */}
                <div className="visual-panel">
                  <h3>Cơ cấu nguồn thu (Tháng này)</h3>
                  <p className="subtitle">Tỷ lệ doanh thu giữa Khám bệnh lâm sàng & Doanh thu nhà thuốc</p>

                  <div className="breakdown-gauge-container">
                    <div className="horizontal-gauge">
                      <div className="gauge-segment consult" style={{ width: `${consultationPct}%` }}>
                        {consultationPct}% Phí khám
                      </div>
                      <div className="gauge-segment pharmacy" style={{ width: `${pharmacyPct}%` }}>
                        {pharmacyPct}% Thuốc đơn
                      </div>
                    </div>

                    <div className="gauge-legend">
                      <div>
                        <span className="dot dot-consult"></span>
                        <strong>Khám lâm sàng: </strong>
                        <span>{formatVND(stats?.breakdown?.consultation)}</span>
                      </div>
                      <div>
                        <span className="dot dot-pharmacy"></span>
                        <strong>Nhà thuốc đơn: </strong>
                        <span>{formatVND(stats?.breakdown?.pharmacy)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Timeline Audit */}
          {activeTab === 'timeline' && (
            <div className="dashboard-card">
              <h2>Giám sát quy trình khám của bệnh nhân</h2>
              <p className="subtitle">Kiểm soát trực quan toàn bộ tiến trình từ khi gửi yêu cầu khám đến khi thanh toán phát thuốc.</p>

              {appointments.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có lượt đăng ký nào để hiển thị tiến trình.</p>
                </div>
              ) : (
                <div className="timeline-audit-list">
                  {appointments.slice(0, 15).map((appt) => {
                    const steps = getTimelineSteps(appt);
                    return (
                      <div className="timeline-audit-row" key={appt._id}>
                        <div className="audit-row-meta">
                          <strong>{appt.patientId?.fullName}</strong>
                          <span>CCCD: {appt.patientId?.identityCard}</span>
                          <span className="text-muted">Lịch hẹn: {new Date(appt.requestedDate).toLocaleDateString('vi-VN')} ({appt.requestedTime})</span>
                        </div>
                        <div className="audit-timeline-line">
                          {steps.map((s, idx) => (
                            <div className="timeline-dot-wrapper" key={idx}>
                              <div className={`timeline-dot ${s.done === true ? 'done' : s.done === false ? 'warn' : 'waiting'}`}>
                                {s.done === true ? '✓' : s.done === false ? '!' : '○'}
                              </div>
                              <span className="dot-label">{s.label}</span>
                              <span className="dot-desc">{s.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: User Creation Form */}
          {activeTab === 'users' && (
            <div className="dashboard-card">
              <h2>Đăng ký tài khoản nội bộ (Nhân viên, Bác sĩ)</h2>
              <p className="subtitle">Tạo tài khoản và phân quyền cho Bác sĩ, CSKH (Staff) hoặc Kế toán.</p>

              <form onSubmit={handleCreateUser} className="grid-form">
                <div className="form-group">
                  <label>Tên tài khoản (Số điện thoại) *</label>
                  <input
                    type="text"
                    placeholder="VD: 0912222222"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mật khẩu khởi tạo *</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu bảo mật"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Vai trò chức năng *</label>
                  <select
                    value={userForm.roleName}
                    onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                    required
                  >
                    <option value="doctor">Bác sĩ chuyên khoa</option>
                    <option value="staff">Nhân viên CSKH / Lễ tân</option>
                    <option value="accountant">Kế toán / Thu ngân</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Họ và tên nhân viên *</label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn C"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    required
                  />
                </div>

                {/* Doctor special fields */}
                {userForm.roleName === 'doctor' && (
                  <>
                    <div className="form-group">
                      <label>Chuyên khoa lâm sàng *</label>
                      <input
                        type="text"
                        value={userForm.specialization}
                        onChange={(e) => setUserForm({ ...userForm, specialization: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Khoa chỉ định *</label>
                      <select
                        value={userForm.departmentId}
                        onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn khoa --</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>{d.departmentName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Số năm kinh nghiệm</label>
                      <input
                        type="number"
                        value={userForm.experienceYears}
                        onChange={(e) => setUserForm({ ...userForm, experienceYears: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phí khám lâm sàng (baseFee) *</label>
                      <input
                        type="number"
                        value={userForm.baseFee}
                        onChange={(e) => setUserForm({ ...userForm, baseFee: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Giới thiệu tóm tắt tiểu sử bác sĩ</label>
                      <textarea
                        rows="3"
                        value={userForm.bio}
                        onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Staff / Accountant special fields */}
                {userForm.roleName !== 'doctor' && (
                  <div className="form-group full-width">
                    <label>Chức vụ / Vị trí phân công</label>
                    <input
                      type="text"
                      placeholder={userForm.roleName === 'accountant' ? 'Thu ngân nhà thuốc' : 'Lễ tân sảnh A'}
                      value={userForm.position}
                      onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Đang tạo...' : '💾 Tạo tài khoản nhân sự'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: CMS Blog Posts */}
          {activeTab === 'cms' && (
            <div className="dashboard-card">
              <h2>Quản trị tin tức y khoa (CMS)</h2>
              <p className="subtitle">Tạo, cập nhật hoặc xóa các bài viết hướng dẫn sức khỏe, hoạt động phòng khám trên website.</p>

              {/* Form create/edit */}
              <form onSubmit={handleSavePost} className="cms-form-box" style={{ marginBottom: 25, padding: 15, border: '1px solid var(--color-border)', borderRadius: 10 }}>
                <h3>{editingPost ? '📝 Chỉnh sửa bài viết' : '➕ Tạo bài viết mới'}</h3>
                
                <div className="form-group">
                  <label>Tiêu đề bài viết *</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="VD: Cách phòng tránh dịch sốt xuất huyết mùa hè"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ảnh bìa bài viết (URL)</label>
                  <input
                    type="text"
                    value={postForm.thumbnailURL}
                    onChange={(e) => setPostForm({ ...postForm, thumbnailURL: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái phát hành</label>
                  <select
                    value={postForm.status}
                    onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                  >
                    <option value="Published">Phát hành công khai (Published)</option>
                    <option value="Draft">Bản nháp (Draft)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nội dung chi tiết bài viết (Markdown hoặc Text)*</label>
                  <textarea
                    rows="6"
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Nhập nội dung bài viết sức khỏe tại đây..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  {editingPost && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingPost(null);
                        setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
                      }}
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu bài viết'}
                  </button>
                </div>
              </form>

              {/* List of posts */}
              <h3>Danh sách các bài viết hiện tại</h3>
              {postsList.length === 0 ? (
                <p className="text-muted">Chưa có bài viết nào được tạo.</p>
              ) : (
                <div className="table-responsive" style={{ marginTop: 15 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ảnh</th>
                        <th>Tiêu đề bài viết</th>
                        <th>Ngày đăng</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {postsList.map((post) => (
                        <tr key={post._id}>
                          <td>
                            <img src={post.thumbnailURL} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                          </td>
                          <td className="font-bold">{post.title}</td>
                          <td>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${post.status === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                              {post.status === 'Published' ? 'Đã công bố' : 'Bản nháp'}
                            </span>
                          </td>
                          <td className="btn-cell">
                            <button className="btn btn-ghost btn-xs" onClick={() => handleEditPost(post)}>
                              Chỉnh sửa
                            </button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDeletePost(post._id)}>
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
