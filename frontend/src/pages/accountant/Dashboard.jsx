import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import '../../styles/work-dashboard.css';

export default function AccountantDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('invoices');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await billingAPI.getInvoices();
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (invoiceId) => {
    if (!window.confirm('Bạn có xác nhận đã thu tiền mặt/chuyển khoản thực tế cho hóa đơn này không?')) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await billingAPI.processPayment(invoiceId);
      setSuccessMessage('Hóa đơn đã được đánh dấu là ĐÃ THANH TOÁN thành công!');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === invoiceId) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi khi thanh toán hóa đơn.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Filtered invoices logic
  const filteredInvoices = invoices.filter((inv) => {
    const nameMatch = inv.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const phoneMatch = inv.patientId?.phoneNumber?.includes(searchTerm) || false;
    const idMatch = inv._id?.substring(18).toUpperCase().includes(searchTerm.toUpperCase()) || false;
    const searchMatch = !searchTerm || nameMatch || phoneMatch || idMatch;

    const typeMatch = filterType === 'All' || inv.invoiceType === filterType;
    const statusMatch = filterStatus === 'All' || inv.status === filterStatus;

    return searchMatch && typeMatch && statusMatch;
  });

  // Calculate statistics for daily reports
  const todayStr = new Date().toDateString();
  const todayInvoices = invoices.filter(inv => inv.status === 'Paid' && inv.paidAt && new Date(inv.paidAt).toDateString() === todayStr);
  const totalRevenue = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const consultationRev = todayInvoices.filter(i => i.invoiceType === 'Consultation').reduce((sum, i) => sum + i.totalAmount, 0);
  const pharmacyRev = todayInvoices.filter(i => i.invoiceType === 'Pharmacy').reduce((sum, i) => sum + i.totalAmount, 0);

  if (loading) {
    return (
      <div className="role-dashboard-shell work-dashboard">
        <RoleTopNav role="accountant" />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu hóa đơn & đối soát tài chính...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell work-dashboard">
      <RoleTopNav role="accountant" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">💵</div>
            <h4>Bộ phận Kế toán</h4>
            <p className="p-card-number">Thu ngân & Thuốc thanh toán</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('invoices')}
              className={activeTab === 'invoices' ? 'active' : ''}
            >
              🧾 Hoá đơn viện phí
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={activeTab === 'reports' ? 'active' : ''}
            >
              📊 Báo cáo doanh thu ngày
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Invoices */}
          {activeTab === 'invoices' && (
            <div className="dashboard-card">
              <div className="card-header flex-column md-row">
                <h2>Quản lý hóa đơn thu phí bệnh nhân</h2>

                <div className="work-page-toolbar search-filter-bar">
                  <input
                    type="text"
                    placeholder="Tìm: tên BN, SĐT hoặc mã hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    aria-label="Tìm kiếm hóa đơn"
                  />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">Tất cả loại HĐ</option>
                    <option value="Consultation">Phí khám lâm sàng</option>
                    <option value="Pharmacy">Hóa đơn nhà thuốc</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">Tất cả trạng thái</option>
                    <option value="Unpaid">Chưa thanh toán</option>
                    <option value="Paid">Đã thanh toán</option>
                  </select>
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>Không tìm thấy hóa đơn nào khớp với bộ lọc.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã HĐ</th>
                        <th>Bệnh nhân</th>
                        <th>Loại phí</th>
                        <th>Tổng tiền</th>
                        <th>Ngày xuất</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold">{inv._id.substring(18).toUpperCase()}</td>
                          <td>
                            <strong>{inv.patientId?.fullName}</strong><br />
                            <small className="text-muted">SDT: {inv.patientId?.phoneNumber}</small>
                          </td>
                          <td>
                            <span className={`badge ${inv.invoiceType === 'Consultation' ? 'badge-info' : 'badge-purple'}`}>
                              {inv.invoiceType === 'Consultation' ? 'Khám lâm sàng' : 'Tiền thuốc đơn'}
                            </span>
                          </td>
                          <td className="font-bold text-primary">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.issuedAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                              {inv.status === 'Paid' ? 'Đã thu tiền' : 'Chưa thu tiền'}
                            </span>
                          </td>
                          <td className="btn-cell">
                            <button className="btn btn-ghost btn-xs" onClick={() => setSelectedInvoice(inv)}>
                              Xem biên lai
                            </button>
                            {inv.status === 'Unpaid' && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handleProcessPayment(inv._id)}
                                disabled={submitting}
                              >
                                💵 Thu tiền
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Daily Reports */}
          {activeTab === 'reports' && (
            <div className="dashboard-card">
              <h2>Báo cáo tài chính thu ngân hàng ngày</h2>
              <p className="subtitle">Doanh số thực thu trong ngày hôm nay: {new Date().toLocaleDateString('vi-VN')}</p>

              <div className="stats-cards-grid" style={{ marginBottom: 25 }}>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <h3>{formatVND(totalRevenue)}</h3>
                  <p>Doanh thu thực nhận hôm nay</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🩺</div>
                  <h3>{formatVND(consultationRev)}</h3>
                  <p>Tổng phí khám lâm sàng</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💊</div>
                  <h3>{formatVND(pharmacyRev)}</h3>
                  <p>Tổng tiền bán thuốc đơn</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <h3>{todayInvoices.length}</h3>
                  <p>Số lượng hóa đơn đã đối soát</p>
                </div>
              </div>

              <h3>Danh sách giao dịch hoàn thành hôm nay</h3>
              {todayInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa ghi nhận giao dịch thành công nào trong ngày hôm nay.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ marginTop: 15 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Hóa đơn</th>
                        <th>Bệnh nhân</th>
                        <th>Loại hóa đơn</th>
                        <th>Số tiền</th>
                        <th>Giờ thanh toán</th>
                        <th>Nhân viên thực hiện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold">{inv._id.substring(18).toUpperCase()}</td>
                          <td>{inv.patientId?.fullName}</td>
                          <td>{inv.invoiceType === 'Consultation' ? 'Phí khám lâm sàng' : 'Tiền thuốc theo đơn'}</td>
                          <td className="font-bold text-success">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.paidAt).toLocaleTimeString('vi-VN')}</td>
                          <td>{inv.processedBy?.fullName || 'Hệ thống'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Xuất báo cáo in ấn
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Detail / Receipt Modal (Shared component representation) */}
      {selectedInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content invoice-modal">
            <div className="modal-header">
              <h3>Biên lai thu phí y tế</h3>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="modal-body print-section" id="print-area">
              <div className="receipt-brand">
                <h2>PHÒNG KHÁM ĐA KHOA HỢP SƠN TÀI</h2>
                <p>123 Đường Hợp Sơn, Quận Hai Bà Trưng, Hà Nội | Hotline: 1900 6868</p>
              </div>
              <hr />
              <div className="receipt-meta">
                <div>
                  <p><strong>Bệnh nhân:</strong> {selectedInvoice.patientId?.fullName}</p>
                  <p><strong>SĐT:</strong> {selectedInvoice.patientId?.phoneNumber}</p>
                  <p><strong>CCCD:</strong> {selectedInvoice.patientId?.identityCard}</p>
                </div>
                <div className="text-right">
                  <p><strong>Hóa đơn số:</strong> <span className="monospace uppercase">{selectedInvoice._id.substring(14)}</span></p>
                  <p><strong>Ngày lập:</strong> {new Date(selectedInvoice.issuedAt).toLocaleDateString('vi-VN')}</p>
                  {selectedInvoice.paidAt && <p><strong>Ngày thanh toán:</strong> {new Date(selectedInvoice.paidAt).toLocaleDateString('vi-VN')}</p>}
                </div>
              </div>

              <div className="receipt-items-container" style={{ marginTop: 20 }}>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Nội dung thanh toán</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Số lượng</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.invoiceType === 'Consultation' ? (
                      <tr>
                        <td>
                          Khám lâm sàng - Chuyên khoa {selectedInvoice.appointmentId?.departmentId?.departmentName || 'Chung'}<br />
                          <small className="text-muted">Bác sĩ khám: {selectedInvoice.appointmentId?.doctorId?.fullName || 'Bất kỳ'}</small>
                        </td>
                        <td className="text-right">{formatVND(selectedInvoice.totalAmount)}</td>
                        <td className="text-right">1</td>
                        <td className="text-right">{formatVND(selectedInvoice.totalAmount)}</td>
                      </tr>
                    ) : (
                      selectedInvoice.details?.map((det, idx) => (
                        <tr key={idx}>
                          <td>
                            {det.medicineId?.name}<br />
                            <small className="text-muted">{det.medicineId?.dosageForm} | HD: {det.medicineId?.instruction}</small>
                          </td>
                          <td className="text-right">{formatVND(det.unitPrice)}</td>
                          <td className="text-right">{det.quantity}</td>
                          <td className="text-right">{formatVND(det.subTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="receipt-summary">
                <div className="summary-row">
                  <span>Tổng tiền thanh toán:</span>
                  <strong className="text-primary" style={{ fontSize: 18 }}>{formatVND(selectedInvoice.totalAmount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Trạng thái:</span>
                  <span className={`badge ${selectedInvoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedInvoice.status === 'Paid' ? 'Đan thu tiền' : 'Chưa thanh toán'}
                  </span>
                </div>
                {selectedInvoice.processedBy && (
                  <div className="summary-row">
                    <span>Nhân viên thu ngân:</span>
                    <span>{selectedInvoice.processedBy?.fullName || 'Hệ thống'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ In hóa đơn</button>
              {selectedInvoice.status === 'Unpaid' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleProcessPayment(selectedInvoice._id)}
                  disabled={submitting}
                >
                  Duyệt thanh toán
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
