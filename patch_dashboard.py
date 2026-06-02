from pathlib import Path
path = Path('src/pages/patient/Dashboard.jsx')
text = path.read_text(encoding='utf-8')
old = '''						<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="rounded-[28px] bg-slate-50 p-5">
						<h4 className="text-lg font-semibold mb-2 text-slate-900">Lịch hẹn sắp tới</h4>
								{appointments.length === 0 ? (
									<div className="text-sm text-slate-500">Bạn chưa có lịch hẹn nào.</div>
								) : (
									<ul className="divide-y divide-gray-100">
									{appointments.slice(0,5).map(a => (
										<li key={a._id} className="py-3">
											<div className="flex items-center justify-between">
												<div>
													<div className="font-semibold">{new Date(a.requestedDate).toLocaleDateString('vi-VN')}</div>
													<div className="text-sm text-slate-500">{a.requestedTime} · {a.departmentId?.departmentName || 'Khoa chung'}</div>
												</div>
												<div>
													{a.status === 'Pending' && <button className="rounded-md border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50" onClick={() => handleCancel(a._id)}>Hủy</button>}
												</div>
											</div>
										</li>
									))}
									</ul>
									)
								}
							</div>

							<div className="rounded-[28px] bg-slate-50 p-5">
								<h4 className="text-lg font-semibold mb-2 text-slate-900">Tổng quan thanh toán</h4>
								<div className="text-sm text-slate-700 space-y-2">
									<p>Tổng hóa đơn: <strong>{invoices.length}</strong></p>
									<p>Chưa thanh toán: <strong>{invoices.filter(i => i.status !== 'Paid').length}</strong></p>
									<a href="#billing" className="inline-flex mt-2 items-center rounded-3xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Quản lý hóa đơn</a>
								</div>
							</div>
						</div>
'''
new = '''						<div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
							<AppointmentList appointments={appointments} onCancel={handleCancel} />

							<div className="rounded-[28px] bg-slate-50 p-5">
								<h4 className="text-lg font-semibold mb-2 text-slate-900">Tổng quan thanh toán</h4>
								<div className="text-sm text-slate-700 space-y-2">
									<p>Tổng hóa đơn: <strong>{invoices.length}</strong></p>
									<p>Chưa thanh toán: <strong>{invoices.filter(i => i.status !== 'Paid').length}</strong></p>
									<a href="#billing" className="inline-flex mt-2 items-center rounded-3xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Quản lý hóa đơn</a>
								</div>
							</div>
						</div>
'''
if old not in text:
    print('pattern not found')
else:
    text = text.replace(old, new)
    path.write_text(text, encoding='utf-8')
    print('replaced 1')
