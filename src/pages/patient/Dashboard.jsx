import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, clinicalAPI, billingAPI, authAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Footer from '../../components/Footer';
import PatientSidebar from './components/PatientSidebar';
import BookingForm from './components/BookingForm';

export default function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [records, setRecords] = useState([]);
  const [expandedRecords, setExpandedRecords] = useState([]);
  const [expandedInvoices, setExpandedInvoices] = useState([]);
  const [showBilling, setShowBilling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const meRes = await authAPI.me();
        const me = meRes.data?.data;

        const patientsRes = await profilesAPI.getPatients();
        const patients = patientsRes.data?.data || [];
        const matched = patients.find(
          (p) => p.userId?._id === me.userId || p.phoneNumber === me.username || p.userId === me.userId,
        );
        if (mounted) setPatient(matched || null);

        const apptsRes = await schedulingAPI.getAppointments();
        if (mounted) setAppointments(apptsRes.data?.data || []);

        const invRes = await billingAPI.getInvoices();
        if (mounted) setInvoices(invRes.data?.data || []);

        if (matched) {
          const recRes = await clinicalAPI.getMedicalRecords({ patientId: matched._id });
          if (mounted) setRecords(recRes.data?.data || []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Lỗi khi tải dữ liệu.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onShowBilling = () => {
      setShowBilling(true);
    };
    window.addEventListener('showBilling', onShowBilling);
    return () => window.removeEventListener('showBilling', onShowBilling);
  }, []);

  const refreshAppointments = async () => {
    try {
      const apptsRes = await schedulingAPI.getAppointments();
      setAppointments(apptsRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshInvoices = async () => {
    try {
      const invRes = await billingAPI.getInvoices();
      setInvoices(invRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayAllUnpaid = async () => {
    const unpaidInvoices = invoices.filter((inv) => inv.status !== 'Paid');
    if (unpaidInvoices.length === 0) {
      setPaymentMessage('Không có hóa đơn chưa thanh toán.');
      return;
    }

    if (!window.confirm('Bạn có muốn thanh toán tất cả hóa đơn chưa thanh toán?')) {
      return;
    }

    setPaymentProcessing(true);
    setPaymentMessage('');
    try {
      await Promise.all(unpaidInvoices.map((inv) => billingAPI.payInvoice(inv._id)));
      await refreshInvoices();
      setPaymentMessage('Thanh toán thành công tất cả hóa đơn chưa thanh toán.');
    } catch (err) {
      console.error(err);
      setPaymentMessage('Không thể thanh toán. Vui lòng thử lại sau.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayInvoice = async (invoice) => {
    if (invoice.status === 'Paid') {
      setPaymentMessage('Hóa đơn này đã được thanh toán.');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn thanh toán hóa đơn ${translateInvoiceType(invoice.invoiceType)} trị giá ${formatCurrency(invoice.totalAmount || 0)}?`)) {
      return;
    }

    setPaymentProcessing(true);
    setPaymentMessage('');
    try {
      await billingAPI.payInvoice(invoice._id);
      await refreshInvoices();
      setPaymentMessage(`Thanh toán thành công hóa đơn ${formatCurrency(invoice.totalAmount || 0)}.`);
    } catch (err) {
      console.error(err);
      setPaymentMessage('Không thể thanh toán hóa đơn. Vui lòng thử lại sau.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
    } catch (e) {
      return amount || 0;
    }
  };

  const translateInvoiceType = (type) => {
    if (!type) return 'Hoá đơn';
    if (type === 'Consultation') return 'Hoá đơn Khám bệnh';
    if (type === 'Pharmacy') return 'Hoá đơn Nhà thuốc';
    return type;
  };

  const translateInvoiceStatus = (status) => {
    if (!status) return '';
    if (status === 'Unpaid') return 'Chưa thanh toán';
    if (status === 'Paid') return 'Đã thanh toán';
    if (status === 'Refunded') return 'Đã hoàn tiền';
    return status;
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch này?')) return;
    try {
      await schedulingAPI.updateAppointment(id, { status: 'Canceled' });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      setError('Không thể hủy lịch.');
    }
  };

  const handleToggleRecord = (id) => {
    setExpandedRecords((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleInvoice = (id) => {
    setExpandedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShowAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleCloseAppointmentModal = () => {
    setSelectedAppointment(null);
    setShowAppointmentModal(false);
  };

  if (loading) {
    return (
      <div>
        <RoleTopNav role="patient" />
        <main>
          <div>
            <p>Đang tải dữ liệu...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <RoleTopNav role="patient" />
      <main className="patient-dashboard">
        {error && <div className="alert alert--error">{error}</div>}

        <div className="patient-dashboard__hero card">
          <div>
            <h3>Xin chào, {patient?.fullName || 'khách hàng'}</h3>
            <p>Xem thông tin lịch hẹn, thanh toán và hồ sơ bệnh án của bạn trong nháy mắt.</p>
          </div>
        </div>

        <div className="patient-dashboard__grid">
          <div className="patient-dashboard__main">
            <div className="patient-dashboard__panels">
              <section className="card patient-card">
                <div className="card-title-bar">
                  <h4>Lịch hẹn sắp tới</h4>
                </div>
                {appointments.length === 0 ? (
                  <div className="patient-empty">Bạn chưa có lịch hẹn nào.</div>
                ) : (
                  <ul className="appointment-list">
                    {appointments.slice(0, 5).map((a) => (
                      <li key={a._id} className="appointment-item">
                        <div>
                          <strong>{new Date(a.requestedDate).toLocaleDateString('vi-VN')}</strong>
                          <div>{a.requestedTime} · {a.departmentId?.departmentName || 'Khoa chung'}</div>
                        </div>
                        <div className="appointment-item__actions">
                          <button
                            className="btn btn-secondary btn-xs"
                            type="button"
                            onClick={() => handleShowAppointmentDetails(a)}
                          >
                            Chi tiết
                          </button>
                          {a.status === 'Pending' && (
                            <button
                              className="btn btn-ghost btn-xs"
                              type="button"
                              onClick={() => handleCancel(a._id)}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card patient-card">
                <div className="card-title-bar">
                  <h4>Tổng quan thanh toán</h4>
                </div>
                <div className="patient-summary">
                  <p>Tổng hóa đơn: <strong>{invoices.length}</strong></p>
                  <p>Chưa thanh toán: <strong>{invoices.filter((i) => i.status !== 'Paid').length}</strong></p>
                  <p>Tổng thanh toán: <strong>{formatCurrency(invoices.reduce((s, it) => s + (it.totalAmount || 0), 0))}</strong></p>
                  <div className="patient-summary__amounts">
                    <p>Khám bệnh: <strong>{formatCurrency(
                      invoices.filter(i => i.invoiceType === 'Consultation').reduce((s, it) => s + (it.totalAmount || 0), 0)
                    )}</strong></p>
                    <p>Tiền thuốc: <strong>{formatCurrency(
                      invoices.filter(i => i.invoiceType === 'Pharmacy').reduce((s, it) => s + (it.totalAmount || 0), 0)
                    )}</strong></p>
                  </div>
                  {paymentMessage && (
                    <div className={`booking-banner ${paymentMessage.includes('thành công') ? 'success' : 'error'}`}>
                      {paymentMessage}
                    </div>
                  )}
                  <div className="patient-summary__actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handlePayAllUnpaid}
                      disabled={paymentProcessing}
                    >
                      {paymentProcessing ? 'Đang thanh toán...' : 'Thanh toán toàn bộ'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowBilling(true)}
                    >
                      Thanh toán từng phần
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section id="book" className="patient-booking card quick-booking">
              <BookingForm onBooked={refreshAppointments} />
            </section>

            <section id="records" className="card patient-card">
              <div className="card-title-bar">
                <h4>Hồ sơ bệnh án gần đây</h4>
              </div>
              {records.length === 0 ? (
                <div className="patient-empty">Chưa có hồ sơ bệnh án nào.</div>
              ) : (
                <div className="record-list">
                  {records.slice(0, 3).map((r) => {
                    const isExpanded = expandedRecords.includes(r._id);
                    return (
                      <article key={r._id} className="record-item record-item--vitals">
                        <div className="record-item__header">
                          <div>
                            <strong>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</strong>
                            <p>{r.appointmentId?.departmentId?.departmentName || 'Khoa khám chung'}</p>
                            <span>BS. <strong>{r.doctorId?.fullName || 'Chưa có bác sĩ'}</strong></span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleRecord(r._id)}
                          >
                            {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          </button>
                        </div>

                        <div className={`record-item__details ${isExpanded ? 'is-expanded' : ''}`}>
                          <div className="record-item__vitals">
                            <div><strong>Chiều cao:</strong> {r.height ? `${r.height} cm` : '---'}</div>
                            <div><strong>Cân nặng:</strong> {r.weight ? `${r.weight} kg` : '---'}</div>
                            <div><strong>Huyết áp:</strong> {r.bloodPressure || '---'}</div>
                            <div><strong>Nhịp tim:</strong> {r.heartRate ? `${r.heartRate} bpm` : '---'}</div>
                            <div><strong>Nhiệt độ:</strong> {r.temperature ? `${r.temperature} °C` : '---'}</div>
                          </div>
                          <div className="record-item__summary">
                            <p><strong>Chẩn đoán:</strong> {r.diagnosis || '---'}</p>
                            {r.clinicalNotes && <p><strong>Ghi chú:</strong> {r.clinicalNotes}</p>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {showAppointmentModal && selectedAppointment && (
            <div
              className="modal-overlay"
              role="dialog"
              aria-modal="true"
              onClick={(e) => { if (e.target === e.currentTarget) handleCloseAppointmentModal(); }}
            >
              <div className="modal card appointment-modal">
                <div className="card-title-bar modal-header">
                  <div>
                    <h4>Chi tiết lịch hẹn</h4>
                    <p className="muted">{selectedAppointment.departmentId?.departmentName || 'Khoa khám chung'}</p>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={handleCloseAppointmentModal}>Đóng</button>
                </div>

                <div className="modal-body">
                  <div className="appointment-detail-grid">
                    <div>
                      <p><strong>Ngày khám:</strong> {new Date(selectedAppointment.requestedDate).toLocaleDateString('vi-VN')}</p>
                      <p><strong>Giờ khám:</strong> {selectedAppointment.requestedTime || 'Chưa có giờ'}</p>
                      <p><strong>Trạng thái:</strong> {selectedAppointment.status || 'Chưa cập nhật'}</p>
                      <p><strong>Phòng:</strong> {selectedAppointment.scheduleId?.room || 'Đang cập nhật'}</p>
                    </div>
                    <div>
                      <p><strong>Bác sĩ:</strong> BS. {selectedAppointment.doctorId?.fullName || 'Chưa có thông tin'}</p>
                      <p><strong>Chuyên khoa:</strong> {selectedAppointment.departmentId?.departmentName || 'Chung'}</p>
                      <p><strong>Gói khám:</strong> {selectedAppointment.scheduleId?.serviceName || 'Khám lâm sàng'}</p>
                      <p><strong>Phòng khám:</strong> {selectedAppointment.departmentId?.departmentName || 'Chưa rõ'}</p>
                    </div>
                  </div>

                  <div className="appointment-detail-extra">
                    <p><strong>Triệu chứng / Mô tả:</strong></p>
                    <p>{selectedAppointment.symptoms || 'Không có mô tả'}</p>
                  </div>

                  {selectedAppointment.scheduleId?.startTime || selectedAppointment.scheduleId?.endTime ? (
                    <div className="appointment-detail-time">
                      <p><strong>Thời gian làm việc:</strong></p>
                      <p>{selectedAppointment.scheduleId?.startTime || '---'} - {selectedAppointment.scheduleId?.endTime || '---'}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {showBilling && (
              <div
                className="modal-overlay"
                role="dialog"
                aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) setShowBilling(false); }}
              >
                <div className="modal card">
                  <div className="card-title-bar modal-header">
                    <h4>Chi tiết hóa đơn</h4>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowBilling(false)}>Đóng</button>
                  </div>

                  <div className="modal-body">
                    {invoices.length === 0 ? (
                      <div className="patient-empty">Bạn chưa có hóa đơn nào.</div>
                    ) : (
                      <div className="invoice-list">
                        {invoices.map((inv) => {
                          const isExpanded = expandedInvoices.includes(inv._id);
                            return (
                            <article key={inv._id} className="invoice-item">
                              <div className="invoice-item__header">
                                <div>
                                  <strong>{translateInvoiceType(inv.invoiceType)}</strong>
                                  <div className="muted">{new Date(inv.issuedAt || inv.createdAt).toLocaleString('vi-VN')}</div>
                                </div>
                                <div>
                                  <div className="muted">Trạng thái: {translateInvoiceStatus(inv.status)}</div>
                                  <div style={{ textAlign: 'right' }}><strong>{formatCurrency(inv.totalAmount || 0)}</strong></div>
                                  <div className="invoice-item__actions">
                                    {inv.status !== 'Paid' && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        disabled={paymentProcessing}
                                        onClick={() => handlePayInvoice(inv)}
                                      >
                                        Thanh toán
                                      </button>
                                    )}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleToggleInvoice(inv._id)}>
                                      {isExpanded ? 'Ẩn' : 'Xem chi tiết'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className={`invoice-item__details ${isExpanded ? 'is-expanded' : ''}`}>
                                {inv.invoiceType === 'Pharmacy' && inv.details && inv.details.length > 0 ? (
                                  <div className="invoice-lines">
                                    {inv.details.map((d) => (
                                      <div key={d._id} className="invoice-line">
                                        <div>{d.medicineId?.name || 'Thuốc'}</div>
                                        <div className="muted">x{d.quantity}</div>
                                        <div>{formatCurrency((d.unitPrice || 0) * (d.quantity || 1))}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="invoice-meta muted">{inv.appointmentId ? `Khoa: ${inv.appointmentId.departmentId?.departmentName || ''}` : ''}</div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          <aside className="patient-dashboard__aside">
            <PatientSidebar patient={patient} invoices={invoices} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

