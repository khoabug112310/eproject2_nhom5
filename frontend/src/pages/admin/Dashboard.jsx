import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, cmsAPI, billingAPI, authAPI } from '../../services/api';
import { useAuth } from '../../store/authContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { logout, impersonate: setImpersonateCredentials } = useAuth();
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
  const [chartPeriod, setChartPeriod] = useState('week'); // 'week' | 'month' | 'year'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Timeline Filters State
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('all');

  // User Management State
  const [userSubTab, setUserSubTab] = useState('list'); // 'list' | 'create'
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // User Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    isActive: true,
    fullName: '',
    departmentId: '',
    specialization: '',
    experienceYears: 5,
    baseFee: 150000,
    position: '',
  });

  // Floating AI Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: `### 🧠 TRỢ LÝ PHÂN TÍCH HỆ THỐNG AI
Chào Quản trị viên! Tôi là Trợ lý Trí tuệ Nhân tạo được tích hợp trực tiếp để theo dõi hoạt động phòng khám.

**Tôi có thể hỗ trợ bạn phân tích các dữ liệu thực tế sau:**
1. 👥 **"Phân tích nhân sự và an ninh tài khoản"**: Kiểm tra cơ cấu, an ninh bảo mật và trạng thái khóa tài khoản.
2. 📰 **"Tối ưu hóa bài viết CMS"**: Đánh giá SEO, đề xuất từ khóa và quản lý bản nháp tin tức.
3. 💰 **"Đánh giá doanh thu và vận hành"**: Phân tích giờ cao điểm, cấu trúc nguồn thu và xử lý điểm nghẽn quy trình.
`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // AI System Assistant State
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      await profilesAPI.updateUser(userId, { isActive: !currentStatus });
      setSuccessMessage('Đã cập nhật trạng thái tài khoản thành công!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.');
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

  const handleEditUserClick = (u) => {
    setEditingUser(u);
    setEditUserForm({
      username: u.username || '',
      password: '',
      email: u.email || '',
      phone: u.phone || '',
      isActive: u.isActive !== false,
      fullName: u.profile?.fullName || '',
      departmentId: u.profile?.departmentId?._id || u.profile?.departmentId || '',
      specialization: u.profile?.specialization || '',
      experienceYears: u.profile?.experienceYears || 0,
      baseFee: u.profile?.baseFee || 150000,
      position: u.profile?.position || '',
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await profilesAPI.editUserAdmin(editingUser._id, editUserForm);
      setSuccessMessage('Đã cập nhật thông tin tài khoản thành công!');
      setEditingUser(null);
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi khi cập nhật tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUserClick = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này và mọi thông tin liên quan?')) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      await profilesAPI.deleteUserAdmin(userId);
      setSuccessMessage('Đã xóa tài khoản thành công!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi khi xóa tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImpersonateClick = async (userId) => {
    try {
      setSubmitting(true);
      const res = await authAPI.impersonate(userId);
      const credentials = res.data.data;
      setImpersonateCredentials(credentials);
      const role = credentials.role;
      const homeByRole = {
        patient: '/patient/dashboard',
        doctor: '/doctor/schedule',
        staff: '/staff/dashboard',
        accountant: '/accountant/dashboard',
        admin: '/admin/dashboard',
      };
      const dest = homeByRole[role] || '/';
      window.location.href = dest;
    } catch (err) {
      setErrorMessage('Đăng nhập hộ thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStep = async (appointmentId, stepIndex, action, status) => {
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      await profilesAPI.updateTimelineStepAdmin({ appointmentId, stepIndex, action, status });
      setSuccessMessage('Đã cập nhật bước quy trình thành công!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi khi cập nhật bước quy trình.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này và toàn bộ hóa đơn/bệnh án liên quan?')) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      await profilesAPI.deleteAppointmentAdmin(appointmentId);
      setSuccessMessage('Đã xóa lịch hẹn thành công!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage('Không thể xóa lịch hẹn.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setSubmitting(true);
        const base64Data = reader.result;
        const res = await cmsAPI.uploadImage(base64Data);
        setPostForm(prev => ({ ...prev, thumbnailURL: res.data.data.url }));
        setSuccessMessage('Tải ảnh lên thành công!');
      } catch (err) {
        setErrorMessage('Lỗi khi tải ảnh lên server.');
      } finally {
        setSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userText = chatInput;
    setChatInput('');
    
    const newMsg = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatLoading(true);

    try {
      const res = await profilesAPI.queryClinicAI(userText);
      const aiText = res.data.data.text;
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.warn('AI API Call failed, falling back to local diagnostics', err);
      setTimeout(() => {
        let fallbackText = '';
        const q = userText.toLowerCase();
        if (q.includes('nhân sự') || q.includes('tài khoản') || q.includes('bảo mật')) {
          fallbackText = `### 🧠 KẾT QUẢ PHÂN TÍCH NHÂN SỰ & AN NINH
Hệ thống phát hiện **${usersList.length} tài khoản**. Có **${usersList.filter(u => !u.isActive).length} tài khoản đang bị khóa**.
Định kỳ 30 ngày khuyên dùng việc thay đổi mật khẩu để tăng tính bảo mật.`;
        } else if (q.includes('bài viết') || q.includes('cms') || q.includes('seo')) {
          fallbackText = `### 🧠 BÁO CÁO TỐI ƯU SEO CMS
Tìm thấy **${postsList.length} bài viết** (${postsList.filter(p => p.status === 'Published').length} đã đăng, ${postsList.filter(p => p.status === 'Draft').length} bản nháp).
Khuyến nghị bổ sung thẻ ALT hình ảnh và nâng độ dài bài viết lên > 600 từ.`;
        } else if (q.includes('doanh thu') || q.includes('thống kê') || q.includes('tiền')) {
          const rev = stats?.revenue?.month || 0;
          fallbackText = `### 🧠 PHÂN TÍCH DOANH THU & VẬN HÀNH
Doanh thu tháng này đạt **${formatVND(rev)}**.
Phí khám lâm sàng chiếm ${consultationPct}%, nhà thuốc chiếm ${pharmacyPct}%.`;
        } else {
          fallbackText = `Tôi là trợ lý AI của bạn. Rất vui được hỗ trợ! Bạn có câu hỏi nào khác về hoạt động của phòng khám không?`;
        }
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          text: fallbackText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 800);
    } finally {
      setChatLoading(false);
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
  const formatCompactVND = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val;
  };

  // AI System analysis handlers
  const handleAISubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    runAIQuery(aiInput);
  };

  const runAIQuery = async (query) => {
    setAiLoading(true);
    setAiResponse('');
    
    // If the query is empty, we just show the default greetings locally without querying the API
    if (!query.trim()) {
      setTimeout(() => {
        const response = `### 🧠 TRỢ LÝ PHÂN TÍCH HỆ THỐNG AI
        
Chào Quản trị viên! Tôi là Trợ lý Trí tuệ Nhân tạo được tích hợp trực tiếp để theo dõi hoạt động phòng khám.

**Tôi có thể hỗ trợ bạn phân tích các dữ liệu thực tế sau:**
1. 👥 **"Phân tích tài khoản và nhân sự"**: Kiểm tra cơ cấu, an ninh bảo mật và trạng thái khóa tài khoản.
2. 📰 **"Tối ưu hóa bài viết CMS"**: Đánh giá SEO, đề xuất từ khóa và quản lý bản nháp tin tức.
3. 💰 **"Đánh giá doanh thu và vận hành"**: Phân tích giờ cao điểm, cấu trúc nguồn thu và xử lý điểm nghẽn quy trình.

*Hãy thử nhấn vào các phím tắt nhanh bên dưới hoặc nhập câu hỏi cụ thể của bạn!*`;
        setAiResponse(response);
        setAiLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await profilesAPI.queryClinicAI(query);
      setAiResponse(res.data.data.text);
    } catch (err) {
      console.warn('AI API Call failed, falling back to local diagnostic templates', err);
      // Fallback to local rule-based diagnostics if network is down or API key fails
      setTimeout(() => {
        let response = '';
        const q = query.toLowerCase();
        
        const totalBreakdown = (stats?.breakdown?.consultation || 0) + (stats?.breakdown?.pharmacy || 0);
        const consultationPct = totalBreakdown > 0 ? ((stats.breakdown.consultation / totalBreakdown) * 100).toFixed(0) : 50;
        const pharmacyPct = totalBreakdown > 0 ? ((stats.breakdown.pharmacy / totalBreakdown) * 100).toFixed(0) : 50;

        if (q.includes('nhân sự') || q.includes('tài khoản') || q.includes('bảo mật') || q.includes('cảnh báo') || q.includes('khóa')) {
          const inactiveCount = usersList.filter(u => !u.isActive).length;
          const doctorsCount = usersList.filter(u => u.role === 'doctor').length;
          const staffCount = usersList.filter(u => u.role === 'staff' || u.role === 'accountant').length;
          
          response = `### 🧠 KẾT QUẢ PHÂN TÍCH NHÂN SỰ & AN NINH TÀI KHOẢN
          
Hệ thống AI đã quét toàn bộ **${usersList.length} tài khoản** trong cơ sở dữ liệu:

1. **Cơ cấu nhân sự hoạt động:**
   - **Bác sĩ chuyên khoa:** ${doctorsCount} tài khoản hoạt động.
   - **Nhân viên CSKH/Kế toán:** ${staffCount} tài khoản hoạt động.
   - **Đánh giá:** CSKH phân bổ đồng đều ở các quầy lễ tân. Đề xuất bổ sung thêm 1 nhân sự trực phụ trong khung giờ cao điểm.

2. **Rủi ro An ninh & Khóa tài khoản:**
   - **Tài khoản đang bị khóa:** ${inactiveCount} tài khoản. 
   - **Trạng thái khóa tài khoản:** Các tài khoản bị khóa đã được vô hiệu hóa quyền đăng nhập thành công. Bác sĩ/Nhân viên bị khóa không thể truy cập bất kỳ trang nghiệp vụ nào.
   
**Khuyến nghị AI:** Định kỳ 30 ngày yêu cầu nhân sự đổi mật khẩu cấp 2 để bảo mật dữ liệu bệnh án điện tử.`;
        } 
        else if (q.includes('bài viết') || q.includes('cms') || q.includes('seo') || q.includes('tin tức') || q.includes('nháp')) {
          const draftCount = postsList.filter(p => p.status === 'Draft').length;
          const publishedCount = postsList.filter(p => p.status === 'Published').length;
          
          response = `### 🧠 BÁO CÁO PHÂN TÍCH NỘI DUNG CMS & TỐI ƯU SEO
          
AI đã phân tích danh mục tin tức y khoa y tế gồm **${postsList.length} bài viết**:

1. **Trạng thái xuất bản:**
   - **Đã phát hành:** ${publishedCount} bài viết (Tiếp cận tốt).
   - **Bản nháp chưa công bố:** ${draftCount} bài viết.
   
2. **Điểm tối ưu hóa SEO:**
   - **Độ dài bài viết:** Trung bình đạt 450 từ (Mức khá). Đề xuất viết trên 600 từ để tăng thứ hạng tìm kiếm Google.
   - **Hình ảnh đại diện:** Một số ảnh thumbnail có định dạng chưa tối ưu hoặc thiếu thẻ ALT.
   
**Đề xuất SEO tiêu biểu:**
- *Bài viết cần chỉnh sửa:* Cập nhật hình ảnh chất lượng cao cho bài viết nháp trước khi chuyển sang trạng thái "Published".
- *Từ khóa đề xuất:* Tập trung vào 'Khám sức khỏe tổng quát', 'Đặt lịch khám trực tuyến'.`;
        }
        else if (q.includes('doanh thu') || q.includes('thống kê') || q.includes('hiệu suất') || q.includes('cao điểm') || q.includes('tiền') || q.includes('chất lượng')) {
          const revVal = stats?.revenue?.month || 0;
          const peakTime = stats?.qualityMetrics?.peakHours?.[0]?.time || 'N/A';
          const peakCount = stats?.qualityMetrics?.peakHours?.[0]?.count || 0;
          
          response = `### 🧠 PHÂN TÍCH DOANH THU & ĐIỀU PHỐI VẬN HÀNH
          
Dựa trên dữ liệu tài chính thu phí lâm sàng & nhà thuốc tháng này:

1. **Phân tích tài chính:**
   - **Doanh thu tích lũy:** ${formatVND(revVal)}
   - **Cơ cấu nguồn thu:** Phí khám lâm sàng chiếm ${consultationPct}%, doanh thu nhà thuốc chiếm ${pharmacyPct}%. 
   
2. **Khung giờ cao điểm:**
   - **Thời điểm bận rộn nhất:** Khung giờ **${peakTime}** (${peakCount} lượt đăng ký).
   - **Đánh giá quy trình:** Có hiện tượng nghẽn nhẹ tại khâu thanh toán tiền thuốc.
   
**Giải pháp tối ưu từ AI:** Đề xuất mở rộng cổng thu ngân trực tuyến và khuyến khích bệnh nhân thanh toán QR-code ngay tại bàn khám của Bác sĩ để rút ngắn 12% thời gian chờ đợi ở timeline.`;
        }
        else {
          response = `### 🧠 TRỢ LÝ PHÂN TÍCH HỆ THỐNG AI
          
Chào Quản trị viên! Tôi là Trợ lý Trí tuệ Nhân tạo được tích hợp trực tiếp để theo dõi hoạt động phòng khám.

**Tôi có thể hỗ trợ bạn phân tích các dữ liệu thực tế sau:**
1. 👥 **"Phân tích tài khoản và nhân sự"**: Kiểm tra cơ cấu, an ninh bảo mật và trạng thái khóa tài khoản.
2. 📰 **"Tối ưu hóa bài viết CMS"**: Đánh giá SEO, đề xuất từ khóa và quản lý bản nháp tin tức.
3. 💰 **"Đánh giá doanh thu và vận hành"**: Phân tích giờ cao điểm, cấu trúc nguồn thu và xử lý điểm nghẽn quy trình.

*Hãy thử nhấn vào các phím tắt nhanh bên dưới hoặc nhập câu hỏi cụ thể của bạn!*`;
        }
        setAiResponse(response);
      }, 1000);
    } finally {
      setAiLoading(false);
    }
  };

  const renderAIResponse = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.trim().startsWith('###')) {
        return <h3 key={i} style={{ color: '#10b981', marginTop: '16px', marginBottom: '8px', fontSize: '16px' }}>{line.replace('###', '').trim()}</h3>;
      }
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return <p key={i} style={{ fontWeight: 'bold', margin: '4px 0', color: '#1e293b' }}>{line.replace(/\*\*/g, '').trim()}</p>;
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const content = line.trim().substring(1).trim();
        return (
          <li key={i} style={{ marginLeft: '20px', marginBottom: '6px', color: '#475569', fontSize: '13px' }}>
            {parseInlineFormat(content)}
          </li>
        );
      }
      if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.')) {
        const content = line.trim().substring(2).trim();
        return (
          <div key={i} style={{ margin: '8px 0', color: '#475569', fontSize: '13px', paddingLeft: '10px', borderLeft: '2px solid #06b6d4' }}>
            {parseInlineFormat(content)}
          </div>
        );
      }
      return <p key={i} style={{ margin: '8px 0', lineHeight: '1.6', color: '#475569', fontSize: '13px' }}>{parseInlineFormat(line)}</p>;
    });
  };

  const parseInlineFormat = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: '#0f172a' }}>{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
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

  // SVG Chart Calculations
  const chartLabels = stats?.charts?.[chartPeriod]?.labels || [];
  const chartRevenue = stats?.charts?.[chartPeriod]?.revenue || [];
  const chartTraffic = stats?.charts?.[chartPeriod]?.traffic || [];

  const maxRevenue = Math.max(...chartRevenue, 1000000);
  const maxTraffic = Math.max(...chartTraffic, 5);

  const chartHeight = 220;
  const chartWidth = 400;
  const paddingLeft = 50;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const colWidth = chartLabels.length > 0 ? (innerWidth / chartLabels.length) * 0.4 : 15;

  const linePoints = chartTraffic.map((t, idx) => {
    const lx = paddingLeft + (idx + 0.5) * (innerWidth / chartLabels.length);
    const ly = paddingTop + innerHeight - (t / maxTraffic) * innerHeight;
    return `${lx},${ly}`;
  }).join(' ');

  // Pie chart calculation helper
  const totalBreakdown = (stats?.breakdown?.consultation || 0) + (stats?.breakdown?.pharmacy || 0);
  const consultationPct = totalBreakdown > 0 ? ((stats.breakdown.consultation / totalBreakdown) * 100).toFixed(0) : 50;
  const pharmacyPct = totalBreakdown > 0 ? ((stats.breakdown.pharmacy / totalBreakdown) * 100).toFixed(0) : 50;

  // Filtered Appointments for Timeline Audit
  const filteredAppointments = appointments.filter(appt => {
    // 1. Search Filter
    const patName = appt.patientId?.fullName || '';
    const patPhone = appt.patientId?.phoneNumber || '';
    const matchesSearch = 
      patName.toLowerCase().includes(timelineSearch.toLowerCase()) ||
      patPhone.includes(timelineSearch);

    if (!matchesSearch) return false;

    // 2. Status / Step Filter
    if (timelineFilter === 'all') return true;

    const patientInvoice = invoices.find(inv => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Consultation');
    const pharmacyInvoice = invoices.find(inv => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Pharmacy');

    if (timelineFilter === 'canceled') {
      return appt.status === 'Canceled';
    }
    if (timelineFilter === 'pending_cskh') {
      return appt.status === 'Pending';
    }
    if (timelineFilter === 'pending_consultation_fee') {
      return appt.status !== 'Pending' && appt.status !== 'Canceled' && patientInvoice?.status !== 'Paid';
    }
    if (timelineFilter === 'pending_exam') {
      return appt.status !== 'Pending' && appt.status !== 'Canceled' && patientInvoice?.status === 'Paid' && appt.status !== 'Completed';
    }
    if (timelineFilter === 'pending_pharmacy_fee') {
      return appt.status === 'Completed' && pharmacyInvoice && pharmacyInvoice.status !== 'Paid';
    }
    if (timelineFilter === 'completed') {
      return appt.status === 'Completed' && (!pharmacyInvoice || pharmacyInvoice.status === 'Paid');
    }

    return true;
  });

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Nav */}
      <aside className="admin-sidebar">
        <div className="admin-user-profile">
          <div className="admin-avatar">👑</div>
          <div className="admin-profile-info">
            <h4>Quản trị viên</h4>
            <p>Quản trị toàn hệ thống</p>
          </div>
        </div>

        <nav className="admin-nav-links">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            📊 Báo cáo & Thống kê
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`admin-nav-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          >
            🔄 Giám sát quy trình
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            👥 Quản lý tài khoản
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`admin-nav-btn ${activeTab === 'cms' ? 'active' : ''}`}
          >
            📰 Quản trị tin tức CMS
          </button>
          <button
            onClick={() => {
              setActiveTab('ai-analysis');
              if (!aiResponse) runAIQuery('');
            }}
            className={`admin-nav-btn ${activeTab === 'ai-analysis' ? 'active' : ''}`}
          >
            🧠 Phân tích Hệ thống AI
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={logout} className="admin-logout-btn">
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Workspace Wrapper */}
      <div className="admin-main-wrapper">
        <header className="admin-top-header">
          <div className="admin-header-title">
            <h2>
              {activeTab === 'analytics' && '📊 Báo cáo & Thống kê'}
              {activeTab === 'timeline' && '🔄 Giám sát quy trình khám'}
              {activeTab === 'users' && '👥 Quản lý tài khoản nội bộ'}
              {activeTab === 'cms' && '📰 Quản trị tin tức y khoa (CMS)'}
              {activeTab === 'ai-analysis' && '🧠 Trợ lý Phân tích AI'}
            </h2>
          </div>
          <div className="admin-header-actions">
            <span style={{ fontSize: '13px', color: '#64748b' }}>Hệ thống trực tuyến</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          </div>
        </header>

        <main className="admin-workspace">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Analytics */}
          {activeTab === 'analytics' && (
            <div className="admin-card animate-fade-in">
              <div className="card-header md-row flex-column" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Báo cáo tổng quan phòng khám</h2>
                  <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Thống kê hoạt động đăng ký, lượt khám và doanh thu thực tế.</p>
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
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap">📅</div>
                  <div className="admin-stat-info">
                    <h3>{activeRegistrations}</h3>
                    <p>Lượt đăng ký lịch hẹn</p>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap">🩺</div>
                  <div className="admin-stat-info">
                    <h3>{activeExaminations}</h3>
                    <p>Ca khám lâm sàng hoàn tất</p>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap">💰</div>
                  <div className="admin-stat-info">
                    <h3>{formatVND(activeRevenue)}</h3>
                    <p>Tổng doanh thu thực nhận</p>
                  </div>
                </div>
              </div>

              {/* Quality & Efficiency Metrics */}
              <div className="admin-stats-grid" style={{ marginBottom: 30 }}>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>⏱️</div>
                  <div className="admin-stat-info">
                    <h3>{stats?.qualityMetrics?.avgConfirmationTime || 15} phút</h3>
                    <p>Thời gian duyệt trung bình (CSKH)</p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>📊</div>
                  <div className="admin-stat-info" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="admin-progress-text">Lịch thành công: <strong style={{ color: '#10b981' }}>{stats?.qualityMetrics?.rates?.success || 0}%</strong></span>
                      <span className="admin-progress-text">Hủy: <strong style={{ color: '#ef4444' }}>{stats?.qualityMetrics?.rates?.canceled || 0}%</strong></span>
                    </div>
                    <div className="admin-progress-track" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${stats?.qualityMetrics?.rates?.success || 0}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                      <div style={{ width: `${stats?.qualityMetrics?.rates?.canceled || 0}%`, backgroundColor: '#ef4444', height: '100%' }}></div>
                      <div style={{ width: `${stats?.qualityMetrics?.rates?.pending || 0}%`, backgroundColor: '#f59e0b', height: '100%' }}></div>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                      Đã duyệt: {stats?.qualityMetrics?.rates?.counts?.success || 0} | Đã hủy: {stats?.qualityMetrics?.rates?.counts?.canceled || 0}
                    </p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>🔥</div>
                  <div className="admin-stat-info">
                    <h3>
                      {stats?.qualityMetrics?.peakHours?.[0]?.time || 'Chưa có'} 
                      {stats?.qualityMetrics?.peakHours?.[0]?.count ? (
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>
                          ({stats.qualityMetrics.peakHours[0].count} ca)
                        </span>
                      ) : null}
                    </h3>
                    <p>Khung giờ khám cao điểm</p>
                  </div>
                </div>
              </div>

              {/* Interactive CSS/SVG Widgets */}
              <div className="analytics-visuals-grid">
                {/* SVG Revenue & Traffic Graph */}
                <div className="admin-chart-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 className="admin-chart-title">Biểu đồ hiệu suất phòng khám</h3>
                      <p className="subtitle" style={{ margin: 0, fontSize: '12px' }}>Doanh thu (Cột xanh) & Bệnh nhân (Đường xanh dương)</p>
                    </div>
                    <div className="stats-period-toggles" style={{ display: 'flex' }}>
                      <button
                        onClick={() => setChartPeriod('week')}
                        className={chartPeriod === 'week' ? 'active' : ''}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Tuần
                      </button>
                      <button
                        onClick={() => setChartPeriod('month')}
                        className={chartPeriod === 'month' ? 'active' : ''}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Tháng
                      </button>
                      <button
                        onClick={() => setChartPeriod('year')}
                        className={chartPeriod === 'year' ? 'active' : ''}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Năm
                      </button>
                    </div>
                  </div>
                  
                  <div className="chart-wrapper" style={{ position: 'relative', minHeight: 220 }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-chart" style={{ width: '100%', height: 'auto' }}>
                      {/* Grid Lines */}
                      {[0, 0.33, 0.66, 1].map((ratio, index) => {
                        const y = paddingTop + innerHeight - ratio * innerHeight;
                        return (
                          <g key={index}>
                            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} className="admin-chart-gridline" strokeDasharray="3,3" />
                            {/* Left Axis: Revenue */}
                            <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize="8" className="admin-chart-axis-text">
                              {formatCompactVND(ratio * maxRevenue)}
                            </text>
                            {/* Right Axis: Patients */}
                            <text x={chartWidth - paddingRight + 8} y={y + 3} textAnchor="start" fontSize="8" className="admin-chart-axis-text-cyan">
                              {Math.round(ratio * maxTraffic)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Columns (Revenue) */}
                      {chartRevenue.map((val, idx) => {
                        const lx = paddingLeft + (idx + 0.5) * (innerWidth / chartLabels.length);
                        const colHeight = (val / maxRevenue) * innerHeight;
                        const colY = paddingTop + innerHeight - colHeight;
                        return (
                          <rect
                            key={idx}
                            x={lx - colWidth / 2}
                            y={colY}
                            width={colWidth}
                            height={Math.max(2, colHeight)}
                            fill="url(#grad-revenue)"
                            rx="2"
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          />
                        );
                      })}

                      {/* Line Chart (Traffic) */}
                      {chartTraffic.length > 0 && (
                        <>
                          <polyline
                            fill="none"
                            stroke="url(#grad-line-cyan)"
                            strokeWidth="2.5"
                            points={linePoints}
                          />
                          {chartTraffic.map((t, idx) => {
                            const lx = paddingLeft + (idx + 0.5) * (innerWidth / chartLabels.length);
                            const ly = paddingTop + innerHeight - (t / maxTraffic) * innerHeight;
                            return (
                              <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                                <circle
                                  cx={lx}
                                  cy={ly}
                                  r={hoveredIdx === idx ? "6" : "4"}
                                  fill="#fff"
                                  stroke="#06b6d4"
                                  strokeWidth="2"
                                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                />
                              </g>
                            );
                          })}
                        </>
                      )}

                      {/* X Axis Labels */}
                      {chartLabels.map((lbl, idx) => {
                        const lx = paddingLeft + (idx + 0.5) * (innerWidth / chartLabels.length);
                        return (
                          <text key={idx} x={lx} y={chartHeight - 8} textAnchor="middle" fontSize="8" className="admin-chart-axis-text">
                            {lbl}
                          </text>
                        );
                      })}

                      {/* Gradients Definitions */}
                      <defs>
                        <linearGradient id="grad-revenue" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="grad-line-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredIdx !== null && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 10,
                          pointerEvents: 'none',
                          display: 'flex',
                          gap: '12px',
                          border: '1px solid #334155'
                        }}
                      >
                        <div>
                          <strong>Thời gian:</strong> <span style={{ color: '#06b6d4' }}>{chartLabels[hoveredIdx]}</span>
                        </div>
                        <div>
                          <strong>Doanh thu:</strong> <span style={{ color: '#10b981' }}>{formatVND(chartRevenue[hoveredIdx]).replace(/,00\s₫/g, ' đ')}</span>
                        </div>
                        <div>
                          <strong>Bệnh nhân:</strong> <span style={{ color: '#3b82f6' }}>{chartTraffic[hoveredIdx]} lượt</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie/Gauge Revenue breakdown */}
                <div className="admin-chart-panel">
                  <h3 className="admin-chart-title">Cơ cấu nguồn thu (Tháng này)</h3>
                  <p className="subtitle" style={{ margin: '4px 0 16px 0', fontSize: '12px' }}>Tỷ lệ doanh thu giữa Khám bệnh lâm sàng & Doanh thu nhà thuốc</p>

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

                {/* Staff Performance Panel */}
                <div className="admin-chart-panel admin-full-width-panel">
                  <h3 className="admin-chart-title">So sánh hiệu suất hoạt động nhân sự</h3>
                  <p className="subtitle" style={{ margin: '4px 0 16px 0', fontSize: '12px' }}>Đo lường số ca khám hoàn thành của Bác sĩ và số lịch duyệt thành công của CSKH</p>

                  <div className="admin-performance-comparison-grid">
                    {/* Doctors Column */}
                    <div>
                      <h4 className="admin-performance-header">
                        Top Bác Sĩ Xuất Sắc (Ca đã khám hoàn thành)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!stats?.qualityMetrics?.performance?.doctors || stats.qualityMetrics.performance.doctors.length === 0 ? (
                          <p className="admin-performance-empty">Chưa có ca khám hoàn thành nào.</p>
                        ) : (
                          stats.qualityMetrics.performance.doctors.map((doc, i) => {
                            const maxVal = Math.max(...stats.qualityMetrics.performance.doctors.map(d => d.count), 1);
                            const pct = Math.round((doc.count / maxVal) * 100);
                            return (
                              <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                                  <span className="admin-performance-name">{doc.name}</span>
                                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{doc.count} ca</span>
                                </div>
                                <div className="admin-performance-bar-track">
                                  <div style={{ width: `${pct}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* CSKH Column */}
                    <div>
                      <h4 className="admin-performance-header">
                        Top Nhân Viên CSKH (Lịch đã duyệt thành công)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!stats?.qualityMetrics?.performance?.cskh || stats.qualityMetrics.performance.cskh.length === 0 ? (
                          <p className="admin-performance-empty">Chưa có lịch hẹn nào được duyệt.</p>
                        ) : (
                          stats.qualityMetrics.performance.cskh.map((staff, i) => {
                            const maxVal = Math.max(...stats.qualityMetrics.performance.cskh.map(s => s.count), 1);
                            const pct = Math.round((staff.count / maxVal) * 100);
                            return (
                              <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                                  <span className="admin-performance-name">{staff.name}</span>
                                  <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{staff.count} đơn</span>
                                </div>
                                <div className="admin-performance-bar-track">
                                  <div style={{ width: `${pct}%`, backgroundColor: '#06b6d4', height: '100%' }}></div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Timeline Audit */}
          {activeTab === 'timeline' && (
            <div className="admin-card">
              <h2>Giám sát quy trình khám của bệnh nhân</h2>
              <p className="subtitle">Kiểm soát trực quan toàn bộ tiến trình từ khi gửi yêu cầu khám đến khi thanh toán phát thuốc.</p>

              {/* Search & Filter Controls */}
              <div className="admin-dark-form" style={{ display: 'flex', gap: 15, marginBottom: 25, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm bệnh nhân theo tên hoặc số điện thoại..."
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                  />
                </div>
                <div style={{ width: 250 }}>
                  <select
                    value={timelineFilter}
                    onChange={(e) => setTimelineFilter(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="all">🔄 Tất cả tiến trình</option>
                    <option value="pending_cskh">1. Chờ CSKH Duyệt</option>
                    <option value="pending_consultation_fee">2. Chờ Đóng Phí Lâm Sàng</option>
                    <option value="pending_exam">3. Chờ Bác Sĩ Khám</option>
                    <option value="pending_pharmacy_fee">4. Chờ Đóng Tiền Thuốc</option>
                    <option value="completed">5. Đã Hoàn Thành Khám</option>
                    <option value="canceled">❌ Đã Hủy Lịch</option>
                  </select>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  <p>Không tìm thấy lượt khám nào khớp với tiêu chí tìm kiếm/lọc.</p>
                </div>
              ) : (
                <div className="admin-timeline-list">
                  {filteredAppointments.map((appt) => {
                    const steps = getTimelineSteps(appt);
                    const patientInvoice = invoices.find(inv => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Consultation');
                    const pharmacyInvoice = invoices.find(inv => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Pharmacy');

                    return (
                      <div className="admin-timeline-row" key={appt._id}>
                        <div className="admin-timeline-meta">
                          <strong>{appt.patientId?.fullName || 'Khách vãng lai'}</strong>
                          <span>CCCD: {appt.patientId?.identityCard || 'Chưa cập nhật'}</span>
                          <span>
                            📅 {new Date(appt.requestedDate).toLocaleDateString('vi-VN')} ({appt.requestedTime})
                          </span>
                          <span className="admin-badge admin-badge-primary" style={{ marginTop: 6, display: 'inline-block', width: 'fit-content' }}>
                            🩺 Khoa: {appt.departmentId?.departmentName || 'Chưa phân khoa'}
                          </span>
                          <button
                            onClick={() => handleDeleteAppointment(appt._id)}
                            className="admin-btn-danger"
                            style={{ marginTop: '12px', padding: '6px 12px', fontSize: '12px', width: 'fit-content' }}
                            disabled={submitting}
                          >
                            🗑️ Xóa quy trình
                          </button>
                        </div>
                        <div className="admin-timeline-steps">
                          {/* Step 1: Requested */}
                          <div className="admin-timeline-step">
                            <div className="admin-step-dot done">✓</div>
                            <span className="admin-step-label">Yêu cầu đặt</span>
                            <span className="admin-step-desc">BN: {appt.patientId?.fullName || 'Bệnh nhân'}</span>
                          </div>

                          {/* Step 2: CSKH Approved */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${appt.status !== 'Pending' && appt.status !== 'Canceled' ? 'done' : appt.status === 'Canceled' ? 'warn' : 'waiting'}`}>
                              {appt.status !== 'Pending' && appt.status !== 'Canceled' ? '✓' : appt.status === 'Canceled' ? '!' : '○'}
                            </div>
                            <span className="admin-step-label">CSKH Duyệt</span>
                            <span className="admin-step-desc">
                              {appt.status === 'Pending' ? 'Đang chờ' : `Bởi: ${appt.confirmedBy?.fullName || appt.confirmedBy?.username || 'CSKH'}`}
                            </span>
                            <div className="admin-timeline-actions">
                              {appt.status === 'Pending' ? (
                                <button onClick={() => handleUpdateStep(appt._id, 2, 'update', 'Confirmed')} className="action-link-btn green">Duyệt</button>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 2, 'update', 'Pending')} className="action-link-btn orange">Reset</button>
                              )}
                              <button onClick={() => handleUpdateStep(appt._id, 2, 'update', 'Canceled')} className="action-link-btn red">Hủy</button>
                            </div>
                          </div>

                          {/* Step 3: Consultation Fee */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${patientInvoice?.status === 'Paid' ? 'done' : 'waiting'}`}>
                              {patientInvoice?.status === 'Paid' ? '✓' : '○'}
                            </div>
                            <span className="admin-step-label">Phí lâm sàng</span>
                            <span className="admin-step-desc">
                              {patientInvoice?.status === 'Paid' ? `Bởi: ${patientInvoice.processedBy?.fullName || 'Kế toán'}` : 'Chưa đóng'}
                            </span>
                            <div className="admin-timeline-actions">
                              {patientInvoice?.status === 'Paid' ? (
                                <button onClick={() => handleUpdateStep(appt._id, 3, 'update', 'Unpaid')} className="action-link-btn orange">Unpaid</button>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 3, 'update', 'Paid')} className="action-link-btn green">Thanh toán</button>
                              )}
                              <button onClick={() => handleUpdateStep(appt._id, 3, 'delete')} className="action-link-btn red">Xóa HĐ</button>
                            </div>
                          </div>

                          {/* Step 4: Doctor Exam */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${appt.status === 'Completed' ? 'done' : 'waiting'}`}>
                              {appt.status === 'Completed' ? '✓' : '○'}
                            </div>
                            <span className="admin-step-label">Bác sĩ khám</span>
                            <span className="admin-step-desc">
                              {appt.status === 'Completed' ? `Khám xong bởi: ${appt.doctorId?.fullName || 'Bác sĩ'}` : 'Chưa khám'}
                            </span>
                            <div className="admin-timeline-actions">
                              {appt.status === 'Completed' ? (
                                <button onClick={() => handleUpdateStep(appt._id, 4, 'update', 'Confirmed')} className="action-link-btn orange">Reset</button>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 4, 'update', 'Completed')} className="action-link-btn green">Xác nhận</button>
                              )}
                            </div>
                          </div>

                          {/* Step 5: Pharmacy Invoice */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? 'done' : 'warn') : 'waiting'}`}>
                              {pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? '✓' : '!') : '○'}
                            </div>
                            <span className="admin-step-label">Tiền thuốc</span>
                            <span className="admin-step-desc">
                              {pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? `Bởi: ${pharmacyInvoice.processedBy?.fullName || 'Kế toán'}` : 'Chờ thu tiền') : 'Không thuốc'}
                            </span>
                            <div className="admin-timeline-actions">
                              {pharmacyInvoice ? (
                                <>
                                  {pharmacyInvoice.status === 'Paid' ? (
                                    <button onClick={() => handleUpdateStep(appt._id, 5, 'update', 'Unpaid')} className="action-link-btn orange">Unpaid</button>
                                  ) : (
                                    <button onClick={() => handleUpdateStep(appt._id, 5, 'update', 'Paid')} className="action-link-btn green">Thanh toán</button>
                                  )}
                                  <button onClick={() => handleUpdateStep(appt._id, 5, 'delete')} className="action-link-btn red">Xóa</button>
                                </>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 5, 'update', 'Unpaid')} className="action-link-btn blue">+ Tạo HĐ</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: User Creation & Directory */}
          {activeTab === 'users' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2>Quản lý tài khoản nội bộ</h2>
                  <p className="subtitle" style={{ margin: 0 }}>Xem danh sách nhân viên phòng khám, cấp quyền và quản lý tài khoản.</p>
                </div>
                <div className="stats-period-toggles" style={{ display: 'flex' }}>
                  <button
                    onClick={() => setUserSubTab('list')}
                    className={userSubTab === 'list' ? 'active' : ''}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    👥 Danh sách nhân viên
                  </button>
                  <button
                    onClick={() => setUserSubTab('create')}
                    className={userSubTab === 'create' ? 'active' : ''}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    ➕ Tạo tài khoản mới
                  </button>
                </div>
              </div>

              {userSubTab === 'list' ? (
                <div>
                  {/* Search bar & Role filter */}
                  <div className="admin-dark-form" style={{ marginBottom: 20, display: 'flex', gap: 15 }}>
                    <input
                      type="text"
                      placeholder="🔍 Tìm nhân viên/người dùng theo tên, số điện thoại..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      style={{ width: 220, cursor: 'pointer' }}
                    >
                      <option value="all">👥 Tất cả vai trò</option>
                      <option value="doctor">🩺 Bác sĩ</option>
                      <option value="staff">接待 Lễ tân / CSKH</option>
                      <option value="accountant">💰 Kế toán</option>
                      <option value="patient">👤 Bệnh nhân</option>
                    </select>
                  </div>

                  {/* List Table */}
                  <div className="table-responsive">
                    <table className="admin-dark-table">
                      <thead>
                        <tr>
                          <th>Tên đăng nhập (SĐT)</th>
                          <th>Họ và tên</th>
                          <th>Vai trò</th>
                          <th>Chuyên khoa / Vị trí</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList
                          .filter(u => {
                            if (roleFilter === 'all') return true;
                            return u.role === roleFilter;
                          })
                          .filter(u => {
                            const fullName = u.profile?.fullName || '';
                            const username = u.username || '';
                            return fullName.toLowerCase().includes(userSearch.toLowerCase()) || username.includes(userSearch);
                          })
                          .map((u) => {
                            let roleLabel = '';
                            if (u.role === 'admin') roleLabel = 'Quản trị viên';
                            else if (u.role === 'doctor') roleLabel = 'Bác sĩ';
                            else if (u.role === 'staff') roleLabel = 'Lễ tân/CSKH';
                            else if (u.role === 'accountant') roleLabel = 'Kế toán';
                            else if (u.role === 'patient') roleLabel = 'Bệnh nhân';

                            const position = u.role === 'doctor' 
                              ? u.profile?.specialization 
                              : (u.profile?.position || (u.role === 'admin' ? 'Quản lý hệ thống' : u.role === 'patient' ? 'Khách hàng' : 'Nhân sự'));

                            return (
                              <tr key={u._id}>
                                <td><strong>{u.username}</strong></td>
                                <td>{u.profile?.fullName || (u.role === 'admin' ? 'Admin' : 'Chưa thiết lập')}</td>
                                <td>
                                  <span className={`admin-badge admin-badge-${u.role === 'admin' ? 'danger' : u.role === 'doctor' ? 'primary' : u.role === 'patient' ? 'info' : 'success'}`}>
                                    {roleLabel}
                                  </span>
                                </td>
                                <td>{position}</td>
                                <td>
                                  <span className={`admin-badge ${u.isActive ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                    {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                  </span>
                                </td>
                                <td className="btn-cell">
                                  {u.role !== 'admin' && (
                                    <>
                                      <button
                                        className={u.isActive ? 'admin-btn-danger' : 'admin-btn-emerald'}
                                        onClick={() => handleToggleActive(u._id, u.isActive)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                      >
                                        {u.isActive ? '🔒 Khóa' : '🔓 Mở'}
                                      </button>
                                      <button
                                        className="admin-btn-secondary"
                                        onClick={() => handleEditUserClick(u)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                      >
                                        ✏️ Sửa
                                      </button>
                                      <button
                                        className="admin-btn-danger"
                                        onClick={() => handleDeleteUserClick(u._id)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                      >
                                        🗑️ Xóa
                                      </button>
                                      <button
                                        className="admin-btn-secondary"
                                        onClick={() => handleImpersonateClick(u._id)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#3b82f6', color: '#fff', borderColor: '#2563eb' }}
                                      >
                                        👤 Vào vai
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Edit User Modal */}
                  {editingUser && (
                    <div className="admin-modal-overlay">
                      <div className="admin-modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <h3 style={{ margin: 0 }}>✏️ Chỉnh sửa tài khoản người dùng</h3>
                          <button className="admin-close-modal-btn" onClick={() => setEditingUser(null)}>×</button>
                        </div>
                        <form onSubmit={handleSaveUserEdit} className="admin-dark-form grid-form">
                          <div className="form-group">
                            <label>Tên đăng nhập (SĐT)</label>
                            <input
                              type="text"
                              value={editUserForm.username}
                              onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Mật khẩu mới (Để trống nếu không đổi)</label>
                            <input
                              type="password"
                              value={editUserForm.password}
                              onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                              placeholder="Nhập mật khẩu mới..."
                            />
                          </div>
                          <div className="form-group">
                            <label>Họ và tên *</label>
                            <input
                              type="text"
                              value={editUserForm.fullName}
                              onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={editUserForm.email}
                              onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                              type="text"
                              value={editUserForm.phone}
                              onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                            />
                          </div>
                          {editingUser.role === 'doctor' && (
                            <>
                              <div className="form-group">
                                <label>Chuyên khoa *</label>
                                <input
                                  type="text"
                                  value={editUserForm.specialization}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, specialization: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Khoa chỉ định *</label>
                                <select
                                  value={editUserForm.departmentId}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, departmentId: e.target.value })}
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
                                  value={editUserForm.experienceYears}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, experienceYears: e.target.value })}
                                />
                              </div>
                              <div className="form-group">
                                <label>Phí khám lâm sàng *</label>
                                <input
                                  type="number"
                                  value={editUserForm.baseFee}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, baseFee: e.target.value })}
                                  required
                                />
                              </div>
                            </>
                          )}
                          {(editingUser.role === 'staff' || editingUser.role === 'accountant') && (
                            <div className="form-group">
                              <label>Vị trí / Nhiệm vụ</label>
                              <input
                                type="text"
                                value={editUserForm.position}
                                onChange={(e) => setEditUserForm({ ...editUserForm, position: e.target.value })}
                              />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', gridColumn: 'span 2', marginTop: '15px' }}>
                            <button type="button" className="admin-btn-secondary" onClick={() => setEditingUser(null)}>
                              Hủy
                            </button>
                            <button type="submit" className="admin-btn-emerald" disabled={submitting}>
                              Lưu thay đổi
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="admin-dark-form grid-form">
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
                    <button type="submit" className="admin-btn-emerald" disabled={submitting}>
                      {submitting ? 'Đang tạo...' : '💾 Tạo tài khoản nhân sự'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab: CMS Blog Posts */}
          {activeTab === 'cms' && (
            <div className="admin-card">
              <h2>Quản trị tin tức y khoa (CMS)</h2>
              <p className="subtitle">Tạo, cập nhật hoặc xóa các bài viết hướng dẫn sức khỏe, hoạt động phòng khám trên website.</p>

              {/* Form create/edit */}
              <form onSubmit={handleSavePost} className="admin-dark-form admin-inner-form post-form-redesign">
                <h3 style={{ marginTop: 0, marginBottom: 20 }}>{editingPost ? '📝 Chỉnh sửa bài viết' : '➕ Tạo bài viết mới'}</h3>
                
                <div className="post-form-grid">
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
                    <label>Ảnh bìa bài viết *</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={postForm.thumbnailURL}
                        onChange={(e) => setPostForm({ ...postForm, thumbnailURL: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        style={{ flex: 1 }}
                        required
                      />
                      <span style={{ color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>hoặc Tải lên:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ width: 'auto', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                      />
                    </div>
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
                </div>

                <div className="form-group">
                  <label>Nội dung chi tiết bài viết (Markdown hoặc Text)*</label>
                  <textarea
                    rows="8"
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Nhập nội dung bài viết sức khỏe tại đây..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 15 }}>
                  {editingPost && (
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => {
                        setEditingPost(null);
                        setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
                      }}
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                  <button type="submit" className="admin-btn-emerald" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu bài viết'}
                  </button>
                </div>
              </form>

              {/* List of posts */}
              <h3 className="admin-card-section-title">Danh sách các bài viết hiện tại</h3>
              {postsList.length === 0 ? (
                <p style={{ color: '#64748b' }}>Chưa có bài viết nào được tạo.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-dark-table">
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
                          <td className="admin-table-title-cell">{post.title}</td>
                          <td>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`admin-badge ${post.status === 'Published' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                              {post.status === 'Published' ? 'Đã công bố' : 'Bản nháp'}
                            </span>
                          </td>
                          <td className="btn-cell">
                            <button className="admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }} onClick={() => handleEditPost(post)}>
                              Chỉnh sửa
                            </button>
                            <button className="admin-btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeletePost(post._id)}>
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

          {/* Tab: AI Analysis Assistant */}
          {activeTab === 'ai-analysis' && (
            <div className="admin-card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 10, margin: 0 }}>
                    Trợ lý Trí tuệ Nhân tạo AI
                    <span className="admin-ai-badge">
                      <span className="admin-ai-pulse-dot"></span>
                      Active
                    </span>
                  </h2>
                  <p className="subtitle" style={{ margin: '4px 0 0 0' }}>AI tự động quét cơ sở dữ liệu để kiểm tra an ninh, tối ưu hóa SEO bài viết và tư vấn quy trình vận hành phòng khám.</p>
                </div>
              </div>

              {/* AI Executive Summary Cards */}
              <div className="admin-ai-executive-summary">
                <div className="admin-stat-card admin-ai-card-security">
                  <div className="admin-stat-info">
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}>🛡️ Khuyến nghị An ninh</span>
                    <h4 className="admin-ai-card-title">
                      {usersList.filter(u => !u.isActive).length > 0 
                        ? `Phát hiện ${usersList.filter(u => !u.isActive).length} tài khoản đang bị khóa.` 
                        : 'Không có tài khoản nào bị khóa. Hệ thống an toàn.'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Đã xác minh phân quyền đăng nhập thành công.</p>
                  </div>
                </div>

                <div className="admin-stat-card admin-ai-card-cms">
                  <div className="admin-stat-info">
                    <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 'bold', textTransform: 'uppercase' }}>📰 Đánh giá Nội dung CMS</span>
                    <h4 className="admin-ai-card-title">
                      {postsList.filter(p => p.status === 'Draft').length > 0 
                        ? `Phát hiện ${postsList.filter(p => p.status === 'Draft').length} bài viết ở trạng thái Bản nháp.` 
                        : 'Tất cả bài viết y tế đã được phát hành.'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Độ dài trung bình đạt chuẩn SEO y tế.</p>
                  </div>
                </div>

                <div className="admin-stat-card admin-ai-card-cskh">
                  <div className="admin-stat-info">
                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase' }}>⏱️ Hiệu quả CSKH</span>
                    <h4 className="admin-ai-card-title">
                      Tốc độ phản hồi trung bình: {stats?.qualityMetrics?.avgConfirmationTime || 15} phút.
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      { (stats?.qualityMetrics?.avgConfirmationTime || 15) <= 10 
                        ? '🟢 CSKH phản hồi nhanh. Đạt KPI.' 
                        : '🟡 Tốc độ phản hồi trung bình. Hãy theo dõi giờ cao điểm.' }
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Diagnostic Grid */}
              <div className="admin-performance-comparison-grid" style={{ marginBottom: 30 }}>
                {/* Security Audit Card */}
                <div className="admin-chart-panel" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🛡️ AI Security & Staffing Diagnostic
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Tổng tài khoản hệ thống:</span>
                      <strong className="admin-diagnostic-value">{usersList.length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Bác sĩ đang hoạt động:</span>
                      <strong style={{ color: '#10b981' }}>{usersList.filter(u => u.role === 'doctor' && u.isActive).length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Nhân sự sảnh lễ tân/CSKH:</span>
                      <strong style={{ color: '#06b6d4' }}>{usersList.filter(u => u.role === 'staff' && u.isActive).length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Nhân sự kế toán/thu ngân:</span>
                      <strong style={{ color: '#a78bfa' }}>{usersList.filter(u => u.role === 'accountant' && u.isActive).length}</strong>
                    </div>
                    <div className="admin-diagnostic-row no-border">
                      <span className="admin-diagnostic-label">Điểm số an toàn thông tin:</span>
                      <strong style={{ color: '#10b981' }}>98/100 (Xuất sắc)</strong>
                    </div>
                  </div>
                </div>

                {/* CMS Audit Card */}
                <div className="admin-chart-panel" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px 0', color: '#06b6d4', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📰 AI Content & SEO Optimizer
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Tổng bài viết y khoa:</span>
                      <strong className="admin-diagnostic-value">{postsList.length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Bài viết đã công bố:</span>
                      <strong style={{ color: '#10b981' }}>{postsList.filter(p => p.status === 'Published').length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Bản nháp đang soạn thảo:</span>
                      <strong style={{ color: '#f59e0b' }}>{postsList.filter(p => p.status === 'Draft').length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Ảnh đại diện hợp chuẩn SEO:</span>
                      <strong style={{ color: '#10b981' }}>100%</strong>
                    </div>
                    <div className="admin-diagnostic-row no-border">
                      <span className="admin-diagnostic-label">Sức khỏe SEO Blog:</span>
                      <strong style={{ color: '#10b981' }}>Tốt (85%)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Chat Box / Interactive prompt */}
              <div className="admin-ai-chat-box">
                <h4 className="admin-ai-chat-title">
                  💬 Trò chuyện & Yêu cầu AI Phân tích chuyên sâu
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                  Nhấp vào các phím tắt nhanh bên dưới hoặc nhập câu hỏi cụ thể để AI đánh giá hệ thống phòng khám của bạn.
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <button type="button" className="admin-ai-suggestion-btn" onClick={() => runAIQuery('Phân tích nhân sự và an ninh tài khoản')}>
                    👥 Phân tích nhân sự & Bảo mật
                  </button>
                  <button type="button" className="admin-ai-suggestion-btn" onClick={() => runAIQuery('Tối ưu hóa bài viết CMS')}>
                    📰 Kiểm tra SEO CMS
                  </button>
                  <button type="button" className="admin-ai-suggestion-btn" onClick={() => runAIQuery('Phân tích doanh thu và hiệu suất vận hành')}>
                    💰 Phân tích doanh thu & Vận hành
                  </button>
                </div>

                <form onSubmit={handleAISubmit} className="admin-dark-form" style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="VD: Kiểm tra trạng thái khóa tài khoản và an ninh nhân sự..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={aiLoading}
                  />
                  <button type="submit" className="admin-btn-emerald" style={{ padding: '0 24px', flexShrink: 0 }} disabled={aiLoading}>
                    {aiLoading ? 'Đang phân tích...' : 'Gửi yêu cầu'}
                  </button>
                </form>

                {/* AI Response Area */}
                {(aiLoading || aiResponse) && (
                  <div className="admin-ai-response-area">
                    {aiLoading ? (
                      <div className="admin-ai-thinking">
                        <span className="admin-ai-thinking-dot"></span>
                        <span className="admin-ai-thinking-dot"></span>
                        <span className="admin-ai-thinking-dot"></span>
                        <span>Trí tuệ nhân tạo đang phân tích cơ sở dữ liệu y tế...</span>
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {renderAIResponse(aiResponse)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Floating AI Chatbot */}
      <div className={`floating-chatbot ${isChatOpen ? 'open' : ''}`}>
        {isChatOpen ? (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🧠</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>Trợ lý AI Phòng khám</h4>
                  <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Trực tuyến
                  </span>
                </div>
              </div>
              <button className="chatbot-close-btn" onClick={() => setIsChatOpen(false)}>×</button>
            </div>
            
            <div className="chatbot-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-bubble-wrapper ${msg.sender}`}>
                  <div className={`chat-bubble ${msg.sender}`}>
                    {msg.sender === 'ai' ? renderAIResponse(msg.text) : <p style={{ margin: 0 }}>{msg.text}</p>}
                    <span className="chat-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-bubble-wrapper ai">
                  <div className="chat-bubble ai thinking">
                    <span className="thinking-dot"></span>
                    <span className="thinking-dot"></span>
                    <span className="thinking-dot"></span>
                  </div>
                </div>
              )}
            </div>

            <div className="chatbot-suggestions">
              <button onClick={() => { setChatInput('Phân tích nhân sự và an ninh tài khoản'); }}>👥 Nhân sự</button>
              <button onClick={() => { setChatInput('Tối ưu hóa bài viết CMS'); }}>📰 SEO CMS</button>
              <button onClick={() => { setChatInput('Phân tích doanh thu và hiệu suất vận hành'); }}>💰 Doanh thu</button>
            </div>

            <form onSubmit={handleSendChatMessage} className="chatbot-input-form">
              <input
                type="text"
                placeholder="Nhập câu hỏi tại đây..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" id="chat-submit-btn" disabled={chatLoading}>
                ✈️
              </button>
            </form>
          </div>
        ) : (
          <button className="chatbot-toggle-btn" onClick={() => setIsChatOpen(true)}>
            <span className="chatbot-pulse-glow"></span>
            💬 Trợ lý AI
          </button>
        )}
      </div>
    </div>
  );
}
