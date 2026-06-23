import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, cmsAPI, billingAPI, authAPI, clinicalAPI } from '../../services/api';
import { useAuth } from '../../store/authContext';
import Swal from 'sweetalert2';
import {
  BarChart3, Activity, Users, Newspaper, CalendarDays, Pill,
  Building2, Cpu, LogOut, TrendingUp, Clock, Zap, BarChart2,
  CalendarCheck, Shield, FileText, RefreshCw, Plus, X, Search,
  ChevronRight, Send, HeartPulse
} from 'lucide-react';
import './AdminDashboard.css';
import DoctorScheduleModal from '../../components/DoctorScheduleModal';

export default function AdminDashboard() {
  const { logout, impersonate: setImpersonateCredentials } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
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

  // Doctor Schedule Modal State
  const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
  const [appointmentToAssignDoctor, setAppointmentToAssignDoctor] = useState(null);

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
      text: `### 🧠 AI SYSTEM ANALYSIS ASSISTANT
Hello Administrator! I am the AI assistant integrated directly to monitor clinic operations.

**I can help you analyze the following real-time data:**
1. 👥 **"Staff and account security analysis"**: Review structure, security, and account lock status.
2. 📰 **"Optimize CMS articles"**: Evaluate SEO, suggest keywords, and manage news drafts.
3. 💰 **"Assess revenue and operations"**: Analyze peak hours, revenue structure, and resolve workflow bottlenecks.
`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
    specialization: 'Specialist',
    experienceYears: 5,
    baseFee: 150000,
    bio: '',
    position: '',
    qualifications: '',
  });

  // Medicine CRUD State
  const [medicineForm, setMedicineForm] = useState({ medicineName: '', medicineCode: '', activeIngredient: '', usageRoute: 'Uống', unit: 'tablet', unitPrice: 0, stockQuantity: 0 });
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');

  // Doctor Schedule CRUD State
  const [scheduleForm, setScheduleForm] = useState({ doctorId: '', workDate: '', startTime: '07:30', endTime: '11:30', maxPatients: 20 });
  const [scheduleSearch, setScheduleSearch] = useState('');

  // Department CRUD State
  const [deptForm, setDeptForm] = useState({ departmentName: '', description: '', contactPhone: '' });
  const [editingDept, setEditingDept] = useState(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // CMS Post Creation/Edit Form State
  const [editingPost, setEditingPost] = useState(null);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    thumbnailURL: '',
    status: 'Published',
  });
  const [postStatusFilter, setPostStatusFilter] = useState('All');
  const [postSearch, setPostSearch] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    setSuccessMessage('');
    setErrorMessage('');
    setPostStatusFilter('All');
    setPostSearch('');
  }, [activeTab]);

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

      // 7. Get medicines list
      const medsRes = await clinicalAPI.getMedicines();
      setMedicinesList(medsRes.data.data);

      // 8. Get all doctor schedules
      const schedsRes = await schedulingAPI.getAllDoctorSchedules();
      setDoctorSchedules(schedsRes.data.data);

      // 9. Get doctors for schedule form
      const docsRes = await clinicalAPI.getDoctors();
      setDoctorsList(docsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error loading admin dashboard data.');
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
        qualifications: userForm.roleName === 'doctor' ? userForm.qualifications : undefined,
        position: (userForm.roleName === 'staff' || userForm.roleName === 'accountant') ? userForm.position : undefined,
      });

      setSuccessMessage(`Account ${userForm.fullName} (${userForm.roleName}) registered successfully!`);
      setUserForm({
        username: '',
        password: '',
        roleName: 'doctor',
        fullName: '',
        email: '',
        phone: '',
        departmentId: '',
        specialization: 'Specialist',
        experienceYears: 5,
        baseFee: 150000,
        bio: '',
        position: '',
        qualifications: '',
      });
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error registering the account.');
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
      setSuccessMessage('Account status updated successfully!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Could not update account status.');
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
        setSuccessMessage('Article updated successfully!');
      } else {
        await cmsAPI.createPost(postForm);
        setSuccessMessage('New article created successfully!');
      }
      setEditingPost(null);
      setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
      setIsPostModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error saving the article.');
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
    setIsPostModalOpen(true);
  };

  const handleDeletePost = async (postId) => {
    const result = await Swal.fire({
      title: 'Confirm deletion',
      text: 'Are you sure you want to delete this article?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await cmsAPI.deletePost(postId);
      setSuccessMessage('Article deleted successfully.');
      fetchAdminData();
    } catch (err) {
      setErrorMessage('Could not delete the article.');
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
      setSuccessMessage('Account information updated successfully!');
      setEditingUser(null);
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error updating the account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUserClick = async (userId) => {
    const result = await Swal.fire({
      title: 'Confirm deletion',
      text: 'Are you sure you want to delete this account and all related information?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      await profilesAPI.deleteUserAdmin(userId);
      setSuccessMessage('Account deleted successfully!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error deleting the account.');
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
      setErrorMessage('Impersonation failed. Please try again.');
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
      setSuccessMessage('Workflow step updated successfully!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error updating the workflow step.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    const result = await Swal.fire({
      title: 'Confirm deletion',
      text: 'Are you sure you want to delete this appointment and all related invoices/records?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');
      await profilesAPI.deleteAppointmentAdmin(appointmentId);
      setSuccessMessage('Appointment deleted successfully!');
      fetchAdminData();
    } catch (err) {
      setErrorMessage('Could not delete the appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorAssigned = async (docId) => {
    try {
      setSubmitting(true);
      await schedulingAPI.updateAppointment(appointmentToAssignDoctor._id, { doctorId: docId });
      setShowDoctorScheduleModal(false);
      
      if (appointmentToAssignDoctor.status === 'Pending') {
        await handleUpdateStep(appointmentToAssignDoctor._id, 2, 'update', 'Confirmed');
      } else {
        fetchAdminData();
      }
    } catch (err) {
      setErrorMessage('Could not assign doctor.');
      setSubmitting(false);
    }
  };

  // --- Medicine handlers ---
  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    setSubmitting(true); setErrorMessage(''); setSuccessMessage('');
    try {
      if (editingMedicine) {
        await clinicalAPI.updateMedicine(editingMedicine._id, medicineForm);
        setSuccessMessage('Medicine updated successfully!');
      } else {
        await clinicalAPI.createMedicine(medicineForm);
        setSuccessMessage('Medicine added to stock successfully!');
      }
      setEditingMedicine(null);
      setMedicineForm({ medicineName: '', medicineCode: '', activeIngredient: '', usageRoute: 'Uống', unit: 'tablet', unitPrice: 0, stockQuantity: 0 });
      setIsMedicineModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error saving the medicine.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteMedicine = async (id) => {
    const result = await Swal.fire({ title: 'Deactivate medicine?', text: 'This medicine will no longer appear in the prescription list.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Confirm', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    try {
      await clinicalAPI.deleteMedicine(id);
      setSuccessMessage('Medicine deactivated.');
      fetchAdminData();
    } catch (err) { setErrorMessage('Could not delete the medicine.'); }
  };

  // --- Department handlers ---
  const handleSaveDept = async (e) => {
    e.preventDefault();
    setSubmitting(true); setErrorMessage(''); setSuccessMessage('');
    try {
      if (editingDept) {
        await schedulingAPI.updateDepartment(editingDept._id, deptForm);
        setSuccessMessage('Department updated successfully!');
      } else {
        await schedulingAPI.createDepartment(deptForm);
        setSuccessMessage('New department added successfully!');
      }
      setEditingDept(null);
      setDeptForm({ departmentName: '', description: '', contactPhone: '' });
      setIsDeptModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error saving the department.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteDept = async (id) => {
    const result = await Swal.fire({ title: 'Delete this department?', text: 'Related data may be affected.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    try {
      await schedulingAPI.deleteDepartment(id);
      setSuccessMessage('Department deleted.');
      fetchAdminData();
    } catch (err) { setErrorMessage('Could not delete the department.'); }
  };

  // --- Doctor Schedule handlers ---
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true); setErrorMessage(''); setSuccessMessage('');
    try {
      await schedulingAPI.createDoctorSchedule(scheduleForm);
      setSuccessMessage('Shift created successfully!');
      setScheduleForm({ doctorId: '', workDate: '', startTime: '07:30', endTime: '11:30', maxPatients: 20 });
      fetchAdminData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error creating the shift.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteSchedule = async (id) => {
    const result = await Swal.fire({ title: 'Delete shift?', text: 'This shift will be removed from the schedule.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' });
    if (!result.isConfirmed) return;
    try {
      await schedulingAPI.deleteDoctorSchedule(id);
      setSuccessMessage('Shift deleted.');
      fetchAdminData();
    } catch (err) { setErrorMessage('Could not delete the shift.'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Image too large',
        text: 'Image size must not exceed 5MB',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setSubmitting(true);
        const base64Data = reader.result;
        const res = await cmsAPI.uploadImage(base64Data);
        setPostForm(prev => ({ ...prev, thumbnailURL: res.data.data.url }));
        setSuccessMessage('Image uploaded successfully!');
      } catch (err) {
        setErrorMessage('Error uploading image to the server.');
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
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatLoading(true);

    try {
      const res = await profilesAPI.queryClinicAI(userText);
      const aiText = res.data.data.text;
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.warn('AI API Call failed, falling back to local diagnostics', err);
      setTimeout(() => {
        let fallbackText = '';
        const q = userText.toLowerCase();
        if (q.includes('staff') || q.includes('account') || q.includes('security')) {
          fallbackText = `### 🧠 STAFF & SECURITY ANALYSIS
The system detected **${usersList.length} accounts**, with **${usersList.filter(u => !u.isActive).length} accounts currently locked**.
We recommend changing passwords every 30 days to improve security.`;
        } else if (q.includes('article') || q.includes('cms') || q.includes('seo')) {
          fallbackText = `### 🧠 CMS SEO OPTIMIZATION REPORT
Found **${postsList.length} articles** (${postsList.filter(p => p.status === 'Published').length} published, ${postsList.filter(p => p.status === 'Draft').length} drafts).
We recommend adding image ALT tags and increasing article length to over 600 words.`;
        } else if (q.includes('revenue') || q.includes('statistic') || q.includes('finance')) {
          const rev = stats?.revenue?.month || 0;
          fallbackText = `### 🧠 REVENUE & OPERATIONS ANALYSIS
This month's revenue reached **${formatVND(rev)}**.
Consultation fees account for ${consultationPct}%, pharmacy for ${pharmacyPct}%.`;
        } else {
          fallbackText = `I am your AI assistant. Happy to help! Do you have any other questions about the clinic's operations?`;
        }
        setChatMessages(prev => [...prev, {
          sender: 'ai',
          text: fallbackText,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
      { label: 'Booking request', done: true, desc: 'Appointment requested' },
      { label: 'Care Approval', done: appt.status !== 'Pending' && appt.status !== 'Canceled', desc: appt.status === 'Pending' ? 'Pending' : 'Approved' },
      { label: 'Consultation fee', done: patientInvoice?.status === 'Paid', desc: patientInvoice?.status === 'Paid' ? 'Collected' : 'Unpaid' },
      { label: 'Examination', done: appt.status === 'Completed', desc: appt.status === 'Completed' ? 'Examined' : 'Not examined' },
      { label: 'Pharmacy fee', done: pharmacyInvoice ? pharmacyInvoice.status === 'Paid' : null, desc: pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? 'Paid' : 'Awaiting payment') : 'No medicine' },
    ];
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
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
        const response = `### 🧠 AI SYSTEM ANALYSIS ASSISTANT
        
Hello Administrator! I am the AI assistant integrated directly to monitor clinic operations.

**I can help you analyze the following real-time data:**
1. 👥 **"Account and staff analysis"**: Review structure, security, and account lock status.
2. 📰 **"Optimize CMS articles"**: Evaluate SEO, suggest keywords, and manage news drafts.
3. 💰 **"Assess revenue and operations"**: Analyze peak hours, revenue structure, and resolve workflow bottlenecks.

*Try clicking a quick shortcut below or type your specific question!*`;
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

        if (q.includes('staff') || q.includes('account') || q.includes('security') || q.includes('alert') || q.includes('lock')) {
          const inactiveCount = usersList.filter(u => !u.isActive).length;
          const doctorsCount = usersList.filter(u => u.role === 'doctor').length;
          const staffCount = usersList.filter(u => u.role === 'staff' || u.role === 'accountant').length;
          
          response = `## Staff & Security Analysis

Scanned **${usersList.length} accounts** in the system.

**Staffing structure:**
- Specialist doctors: **${doctorsCount}** active
- Care/Accounting staff: **${staffCount}** active
- Locked accounts: **${inactiveCount}**

**Security status:** ${inactiveCount > 0 ? `${inactiveCount} accounts are locked — login access disabled.` : 'All accounts are active. No anomalies detected.'}

**Recommendation:** Enforce periodic password rotation every 30 days to protect electronic medical records.`;
        } 
        else if (q.includes('article') || q.includes('cms') || q.includes('seo') || q.includes('news') || q.includes('draft')) {
          const draftCount = postsList.filter(p => p.status === 'Draft').length;
          const publishedCount = postsList.filter(p => p.status === 'Published').length;
          
          response = `## Content & CMS Status

Total articles in catalog: **${postsList.length}**

**Publication status:**
- Published: **${publishedCount}**
- Drafts pending: **${draftCount}**

${draftCount > 0 ? `**Action needed:** ${draftCount} draft article(s) have not been published. Review and publish to improve site coverage.` : '**Content status:** All articles are published — good coverage.'}

**Recommendation:** Ensure article thumbnails have descriptive alt tags and target 600+ words for optimal search visibility.`;
        }
        else if (q.includes('revenue') || q.includes('statistic') || q.includes('performance') || q.includes('peak') || q.includes('finance') || q.includes('quality')) {
          const revVal = stats?.revenue?.month || 0;
          const peakTime = stats?.qualityMetrics?.peakHours?.[0]?.time || 'N/A';
          const peakCount = stats?.qualityMetrics?.peakHours?.[0]?.count || 0;
          
          response = `## Revenue & Operations Analysis

**This month's revenue:** ${formatVND(revVal)}

**Revenue breakdown:**
- Consultation fees: **${consultationPct}%**
- Pharmacy: **${pharmacyPct}%**

**Peak hours:** ${peakTime} (${peakCount} registrations)

**Operational note:** Review pharmacy payment workflow during peak windows — consider enabling QR-code payment at the examination desk to reduce patient wait time.`;
        }
        else {
          response = `## AI System Assistant

Ready to analyze your clinic data. Select a category or type a specific question.

**Available queries:**
- Staff & Security — account status, locked accounts, staffing breakdown
- Content review — CMS articles, draft status, publication coverage
- Revenue analysis — monthly revenue, breakdown, peak hours`;
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
        <p>Loading the admin dashboard...</p>
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

  const chartHeight = 300;
  const chartWidth = 600;
  const paddingLeft = 55;
  const paddingRight = 50;
  const paddingTop = 28;
  const paddingBottom = 36;

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
        {/* Logo */}
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="admin-sidebar-logo-text">MediCare</div>
            <div className="admin-sidebar-logo-sub">Admin Console</div>
          </div>
        </div>

        {/* User profile */}
        <div className="admin-user-profile">
          <div className="admin-avatar">AD</div>
          <div className="admin-profile-info">
            <h4>Administrator</h4>
            <p>System-wide access</p>
          </div>
        </div>

        <nav className="admin-nav-links">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={16} /> Reports & Statistics
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`admin-nav-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          >
            <Activity size={16} /> Workflow Monitor
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={16} /> Account Management
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`admin-nav-btn ${activeTab === 'cms' ? 'active' : ''}`}
          >
            <Newspaper size={16} /> News Management
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`admin-nav-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          >
            <CalendarDays size={16} /> Doctor Shifts
          </button>
          <button
            onClick={() => setActiveTab('medicines')}
            className={`admin-nav-btn ${activeTab === 'medicines' ? 'active' : ''}`}
          >
            <Pill size={16} /> Medicine Inventory
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`admin-nav-btn ${activeTab === 'departments' ? 'active' : ''}`}
          >
            <Building2 size={16} /> Departments
          </button>
          <button
            onClick={() => {
              setActiveTab('ai-analysis');
              if (!aiResponse) runAIQuery('');
            }}
            className={`admin-nav-btn ${activeTab === 'ai-analysis' ? 'active' : ''}`}
          >
            <Cpu size={16} /> System Health
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={logout} className="admin-logout-btn">
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>

      {/* Main Workspace Wrapper */}
      <div className="admin-main-wrapper">
        <header className="admin-top-header">
          <div className="admin-header-title">
            <h2>
              {activeTab === 'analytics' && 'Reports & Statistics'}
              {activeTab === 'timeline' && 'Examination Workflow'}
              {activeTab === 'users' && 'Account Management'}
              {activeTab === 'cms' && 'Medical News (CMS)'}
              {activeTab === 'schedules' && 'Doctor Shift Management'}
              {activeTab === 'medicines' && 'Medicine Inventory'}
              {activeTab === 'departments' && 'Department Management'}
              {activeTab === 'ai-analysis' && 'System Health'}
            </h2>
          </div>
          <div className="admin-header-actions">
            <div className="admin-status-dot"></div>
            <span>System online</span>
            <button
              onClick={fetchAdminData}
              style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
              title="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
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
                  <h2 style={{ margin: 0 }}>Clinic overview report</h2>
                  <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Statistics on registrations, examinations, and actual revenue.</p>
                </div>
                <div className="stats-period-toggles">
                  <button
                    onClick={() => setStatsPeriod('day')}
                    className={statsPeriod === 'day' ? 'active' : ''}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setStatsPeriod('week')}
                    className={statsPeriod === 'week' ? 'active' : ''}
                  >
                    This week
                  </button>
                  <button
                    onClick={() => setStatsPeriod('month')}
                    className={statsPeriod === 'month' ? 'active' : ''}
                  >
                    This month
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap"><CalendarCheck size={20} /></div>
                  <div className="admin-stat-info">
                    <h3>{activeRegistrations}</h3>
                    <p>Appointment registrations</p>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(22,163,74,0.08)', color: '#16a34a' }}><HeartPulse size={20} /></div>
                  <div className="admin-stat-info">
                    <h3>{activeExaminations}</h3>
                    <p>Completed examinations</p>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(8,145,178,0.08)', color: '#0891b2' }}><TrendingUp size={20} /></div>
                  <div className="admin-stat-info">
                    <h3>{formatVND(activeRevenue)}</h3>
                    <p>Total revenue collected</p>
                  </div>
                </div>
              </div>

              {/* Quality & Efficiency Metrics */}
              <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap"><Clock size={20} /></div>
                  <div className="admin-stat-info">
                    <h3>{stats?.qualityMetrics?.avgConfirmationTime || 15} min</h3>
                    <p>Avg. approval time</p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(22,163,74,0.08)', color: '#16a34a' }}><BarChart2 size={20} /></div>
                  <div className="admin-stat-info" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="admin-progress-text">Completed: <strong style={{ color: '#16a34a' }}>{stats?.qualityMetrics?.rates?.success || 0}%</strong></span>
                      <span className="admin-progress-text">Cancelled: <strong style={{ color: '#dc2626' }}>{stats?.qualityMetrics?.rates?.canceled || 0}%</strong></span>
                    </div>
                    <div className="admin-progress-track" style={{ height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${stats?.qualityMetrics?.rates?.success || 0}%`, backgroundColor: '#16a34a', height: '100%' }}></div>
                      <div style={{ width: `${stats?.qualityMetrics?.rates?.canceled || 0}%`, backgroundColor: '#dc2626', height: '100%' }}></div>
                      <div style={{ width: `${stats?.qualityMetrics?.rates?.pending || 0}%`, backgroundColor: '#d97706', height: '100%' }}></div>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                      {stats?.qualityMetrics?.rates?.counts?.success || 0} completed · {stats?.qualityMetrics?.rates?.counts?.canceled || 0} cancelled
                    </p>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(217,119,6,0.08)', color: '#d97706' }}><Zap size={20} /></div>
                  <div className="admin-stat-info">
                    <h3>
                      {stats?.qualityMetrics?.peakHours?.[0]?.time || 'N/A'}
                      {stats?.qualityMetrics?.peakHours?.[0]?.count ? (
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginLeft: '6px' }}>
                          {stats.qualityMetrics.peakHours[0].count} cases
                        </span>
                      ) : null}
                    </h3>
                    <p>Peak examination hours</p>
                  </div>
                </div>
              </div>

              {/* Interactive CSS/SVG Widgets */}
              <div className="analytics-visuals-grid">
                {/* SVG Revenue & Traffic Graph */}
                <div className="admin-chart-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 className="admin-chart-title">Clinic performance chart</h3>
                      <p className="subtitle" style={{ margin: 0, fontSize: '12px' }}>Revenue (bars) · Patients (line)</p>
                    </div>
                    <div className="stats-period-toggles" style={{ display: 'flex' }}>
                      <button
                        onClick={() => setChartPeriod('week')}
                        className={chartPeriod === 'week' ? 'active' : ''}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setChartPeriod('month')}
                        className={chartPeriod === 'month' ? 'active' : ''}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => setChartPeriod('year')}
                        className={chartPeriod === 'year' ? 'active' : ''}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        Year
                      </button>
                    </div>
                  </div>
                  
                  <div className="chart-wrapper" style={{ position: 'relative', minHeight: 300 }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-chart" style={{ width: '100%', height: 'auto' }}>
                      {/* Grid Lines */}
                      {[0, 0.33, 0.66, 1].map((ratio, index) => {
                        const y = paddingTop + innerHeight - ratio * innerHeight;
                        return (
                          <g key={index}>
                            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} className="admin-chart-gridline" strokeDasharray="3,3" />
                            {/* Left Axis: Revenue */}
                            <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize="10" className="admin-chart-axis-text">
                              {formatCompactVND(ratio * maxRevenue)}
                            </text>
                            {/* Right Axis: Patients */}
                            <text x={chartWidth - paddingRight + 8} y={y + 3} textAnchor="start" fontSize="10" className="admin-chart-axis-text-cyan">
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
                            strokeWidth="2"
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
                                  r={hoveredIdx === idx ? "5" : "3.5"}
                                  fill="#fff"
                                  stroke="#0891b2"
                                  strokeWidth="1.5"
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
                          <text key={idx} x={lx} y={chartHeight - 8} textAnchor="middle" fontSize="10" className="admin-chart-axis-text">
                            {lbl}
                          </text>
                        );
                      })}

                      {/* Gradients Definitions */}
                      <defs>
                        <linearGradient id="grad-revenue" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <linearGradient id="grad-line-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0891b2" />
                          <stop offset="100%" stopColor="#0369a1" />
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
                          <strong>Time:</strong> <span style={{ color: '#06b6d4' }}>{chartLabels[hoveredIdx]}</span>
                        </div>
                        <div>
                          <strong>Revenue:</strong> <span style={{ color: '#10b981' }}>{formatVND(chartRevenue[hoveredIdx]).replace(/,00\s₫/g, ' VND')}</span>
                        </div>
                        <div>
                          <strong>Patients:</strong> <span style={{ color: '#3b82f6' }}>{chartTraffic[hoveredIdx]} visits</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie/Gauge Revenue breakdown */}
                <div className="admin-chart-panel">
                  <h3 className="admin-chart-title">Revenue breakdown (This month)</h3>
                  <p className="subtitle" style={{ margin: '4px 0 16px 0', fontSize: '12px' }}>Revenue split between consultations & pharmacy</p>

                  <div className="breakdown-gauge-container">
                    <div className="horizontal-gauge">
                      <div className="gauge-segment consult" style={{ width: `${consultationPct}%` }}>
                        {consultationPct}% Consultation
                      </div>
                      <div className="gauge-segment pharmacy" style={{ width: `${pharmacyPct}%` }}>
                        {pharmacyPct}% Pharmacy
                      </div>
                    </div>

                    <div className="gauge-legend">
                      <div>
                        <span className="dot dot-consult"></span>
                        <strong>Consultation: </strong>
                        <span>{formatVND(stats?.breakdown?.consultation)}</span>
                      </div>
                      <div>
                        <span className="dot dot-pharmacy"></span>
                        <strong>Pharmacy: </strong>
                        <span>{formatVND(stats?.breakdown?.pharmacy)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Performance Panel */}
                <div className="admin-chart-panel admin-full-width-panel">
                  <h3 className="admin-chart-title">Staff performance comparison</h3>
                  <p className="subtitle" style={{ margin: '4px 0 16px 0', fontSize: '12px' }}>Measures completed examinations by doctors and approved appointments by care staff</p>

                  <div className="admin-performance-comparison-grid">
                    {/* Doctors Column */}
                    <div>
                      <h4 className="admin-performance-header">
                        Top Doctors — Completed Examinations
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!stats?.qualityMetrics?.performance?.doctors || stats.qualityMetrics.performance.doctors.length === 0 ? (
                          <p className="admin-performance-empty">No completed examinations yet.</p>
                        ) : (
                          stats.qualityMetrics.performance.doctors.map((doc, i) => {
                            const maxVal = Math.max(...stats.qualityMetrics.performance.doctors.map(d => d.count), 1);
                            const pct = Math.round((doc.count / maxVal) * 100);
                            return (
                              <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                  <span className="admin-performance-name">{doc.name}</span>
                                  <span style={{ color: '#2563eb', fontWeight: '600' }}>{doc.count} {doc.count === 1 ? 'case' : 'cases'}</span>
                                </div>
                                <div className="admin-performance-bar-track">
                                  <div style={{ width: `${pct}%`, backgroundColor: '#2563eb', height: '100%', borderRadius: '3px' }}></div>
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
                        Top Care Staff — Approved Appointments
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!stats?.qualityMetrics?.performance?.cskh || stats.qualityMetrics.performance.cskh.length === 0 ? (
                          <p className="admin-performance-empty">No appointments approved yet.</p>
                        ) : (
                          stats.qualityMetrics.performance.cskh.map((staff, i) => {
                            const maxVal = Math.max(...stats.qualityMetrics.performance.cskh.map(s => s.count), 1);
                            const pct = Math.round((staff.count / maxVal) * 100);
                            return (
                              <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                  <span className="admin-performance-name">{staff.name}</span>
                                  <span style={{ color: '#0891b2', fontWeight: '600' }}>{staff.count} appts</span>
                                </div>
                                <div className="admin-performance-bar-track">
                                  <div style={{ width: `${pct}%`, backgroundColor: '#0891b2', height: '100%', borderRadius: '3px' }}></div>
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
              <h2>Patient examination workflow monitor</h2>
              <p className="subtitle">Visually track the entire process from booking request to medication payment.</p>

              {/* Search & Filter Controls */}
              <div className="admin-dark-form" style={{ display: 'flex', gap: 15, marginBottom: 25, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 250 }}>
                  <input
                    type="text"
                    placeholder="Search by patient name or phone..."
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
                    <option value="all">All stages</option>
                    <option value="pending_cskh">1. Awaiting Care Approval</option>
                    <option value="pending_consultation_fee">2. Awaiting Consultation Fee</option>
                    <option value="pending_exam">3. Awaiting Examination</option>
                    <option value="pending_pharmacy_fee">4. Awaiting Pharmacy Payment</option>
                    <option value="completed">5. Examination Completed</option>
                    <option value="canceled">Cancelled</option>
                  </select>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  <p>No examinations match your search/filter criteria.</p>
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
                          <strong>{appt.patientId?.fullName || 'Walk-in guest'}</strong>
                          <span>ID: {appt.patientId?.identityCard || 'Not updated'}</span>
                          <span>{new Date(appt.requestedDate).toLocaleDateString('en-US')} · {appt.requestedTime}</span>
                          <span className="admin-badge admin-badge-primary" style={{ marginTop: 6, display: 'inline-block', width: 'fit-content' }}>
                            {appt.departmentId?.departmentName || 'Unassigned'}
                          </span>
                          <button
                            onClick={() => handleDeleteAppointment(appt._id)}
                            className="btn-danger btn-xs"
                            style={{ marginTop: '10px', width: 'fit-content' }}
                            disabled={submitting}
                          >
                            Delete record
                          </button>
                        </div>
                        <div className="admin-timeline-steps">
                          {/* Step 1: Requested */}
                          <div className="admin-timeline-step">
                            <div className="admin-step-dot done">✓</div>
                            <span className="admin-step-label">Booking request</span>
                            <span className="admin-step-desc">Patient: {appt.patientId?.fullName || 'Patient'}</span>
                          </div>

                          {/* Step 2: CSKH Approved */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${appt.status !== 'Pending' && appt.status !== 'Canceled' ? 'done' : appt.status === 'Canceled' ? 'warn' : 'waiting'}`}>
                              {appt.status !== 'Pending' && appt.status !== 'Canceled' ? '✓' : appt.status === 'Canceled' ? '!' : '○'}
                            </div>
                            <span className="admin-step-label">Care Approval</span>
                            <span className="admin-step-desc">
                              {appt.status === 'Pending' ? 'Pending' : `By: ${appt.confirmedBy?.fullName || appt.confirmedBy?.username || 'Care'}`}
                            </span>
                            <div className="admin-timeline-actions">
                              {appt.status === 'Pending' ? (
                                <button onClick={() => {
                                  if (!appt.doctorId) {
                                    setAppointmentToAssignDoctor(appt);
                                    setShowDoctorScheduleModal(true);
                                  } else {
                                    handleUpdateStep(appt._id, 2, 'update', 'Confirmed');
                                  }
                                }} className="action-link-btn green">Approve</button>
                              ) : (
                                <>
                                  <button onClick={() => handleUpdateStep(appt._id, 2, 'update', 'Pending')} className="action-link-btn orange">Reset</button>
                                  {!appt.doctorId && appt.status === 'Confirmed' && (
                                    <button onClick={() => {
                                      setAppointmentToAssignDoctor(appt);
                                      setShowDoctorScheduleModal(true);
                                    }} className="action-link-btn blue" style={{ marginLeft: '8px' }}>Assign Doctor</button>
                                  )}
                                </>
                              )}
                              <button onClick={() => handleUpdateStep(appt._id, 2, 'update', 'Canceled')} className="action-link-btn red" style={{ marginLeft: '8px' }}>Cancel</button>
                            </div>
                          </div>

                          {/* Step 3: Consultation Fee */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${patientInvoice?.status === 'Paid' ? 'done' : 'waiting'}`}>
                              {patientInvoice?.status === 'Paid' ? '✓' : '○'}
                            </div>
                            <span className="admin-step-label">Consultation fee</span>
                            <span className="admin-step-desc">
                              {patientInvoice?.status === 'Paid' ? `By: ${patientInvoice.processedBy?.fullName || 'Accountant'}` : 'Unpaid'}
                            </span>
                            <div className="admin-timeline-actions">
                              {patientInvoice?.status === 'Paid' ? (
                                <button onClick={() => handleUpdateStep(appt._id, 3, 'update', 'Unpaid')} className="action-link-btn orange">Unpaid</button>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 3, 'update', 'Paid')} className="action-link-btn green">Pay</button>
                              )}
                              <button onClick={() => handleUpdateStep(appt._id, 3, 'delete')} className="action-link-btn red">Delete invoice</button>
                            </div>
                          </div>

                          {/* Step 4: Doctor Exam */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${appt.status === 'Completed' ? 'done' : 'waiting'}`}>
                              {appt.status === 'Completed' ? '✓' : '○'}
                            </div>
                            <span className="admin-step-label">Examination</span>
                            <span className="admin-step-desc">
                              {appt.status === 'Completed' ? `Examined by: ${appt.doctorId?.fullName || 'Doctor'}` : 'Not examined'}
                            </span>
                            <div className="admin-timeline-actions">
                              {appt.status === 'Completed' ? (
                                <button onClick={() => handleUpdateStep(appt._id, 4, 'update', 'Confirmed')} className="action-link-btn orange">Reset</button>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 4, 'update', 'Completed')} className="action-link-btn green">Confirm</button>
                              )}
                            </div>
                          </div>

                          {/* Step 5: Pharmacy Invoice */}
                          <div className="admin-timeline-step">
                            <div className={`admin-step-dot ${pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? 'done' : 'warn') : 'waiting'}`}>
                              {pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? '✓' : '!') : '○'}
                            </div>
                            <span className="admin-step-label">Pharmacy fee</span>
                            <span className="admin-step-desc">
                              {pharmacyInvoice ? (pharmacyInvoice.status === 'Paid' ? `By: ${pharmacyInvoice.processedBy?.fullName || 'Accountant'}` : 'Awaiting payment') : 'No medicine'}
                            </span>
                            <div className="admin-timeline-actions">
                              {pharmacyInvoice ? (
                                <>
                                  {pharmacyInvoice.status === 'Paid' ? (
                                    <button onClick={() => handleUpdateStep(appt._id, 5, 'update', 'Unpaid')} className="action-link-btn orange">Unpaid</button>
                                  ) : (
                                    <button onClick={() => handleUpdateStep(appt._id, 5, 'update', 'Paid')} className="action-link-btn green">Pay</button>
                                  )}
                                  <button onClick={() => handleUpdateStep(appt._id, 5, 'delete')} className="action-link-btn red">Delete</button>
                                </>
                              ) : (
                                <button onClick={() => handleUpdateStep(appt._id, 5, 'update', 'Unpaid')} className="action-link-btn blue">+ Create invoice</button>
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
                  <h2>Internal account management</h2>
                  <p className="subtitle" style={{ margin: 0 }}>View clinic staff, assign permissions, and manage accounts.</p>
                </div>
                <div className="stats-period-toggles" style={{ display: 'flex' }}>
                  <button
                    onClick={() => setUserSubTab('list')}
                    className={userSubTab === 'list' ? 'active' : ''}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    Staff list
                  </button>
                  <button
                    onClick={() => setUserSubTab('create')}
                    className={userSubTab === 'create' ? 'active' : ''}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    + New account
                  </button>
                </div>
              </div>

              {userSubTab === 'list' ? (
                <div>
                  {/* Search bar & Role filter */}
                  <div className="admin-dark-form" style={{ marginBottom: 20, display: 'flex', gap: 15 }}>
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      style={{ width: 220, cursor: 'pointer' }}
                    >
                      <option value="all">All roles</option>
                      <option value="doctor">Doctor</option>
                      <option value="staff">Reception / Care</option>
                      <option value="accountant">Accountant</option>
                      <option value="patient">Patient</option>
                    </select>
                  </div>

                  {/* List Table */}
                  <div className="table-responsive">
                    <table className="admin-dark-table">
                      <thead>
                        <tr>
                          <th>Username (Phone)</th>
                          <th>Full name</th>
                          <th>Role</th>
                          <th>Specialty / Position</th>
                          <th>Status</th>
                          <th>Actions</th>
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
                            if (u.role === 'admin') roleLabel = 'Administrator';
                            else if (u.role === 'doctor') roleLabel = 'Doctor';
                            else if (u.role === 'staff') roleLabel = 'Reception/Care';
                            else if (u.role === 'accountant') roleLabel = 'Accountant';
                            else if (u.role === 'patient') roleLabel = 'Patient';

                            const position = u.role === 'doctor' 
                              ? u.profile?.specialization 
                              : (u.profile?.position || (u.role === 'admin' ? 'System manager' : u.role === 'patient' ? 'Customer' : 'Staff'));

                            return (
                              <tr key={u._id}>
                                <td><strong>{u.username}</strong></td>
                                <td>{u.profile?.fullName || (u.role === 'admin' ? 'Admin' : 'Not set')}</td>
                                <td>
                                  <span className={`admin-badge admin-badge-${u.role === 'admin' ? 'danger' : u.role === 'doctor' ? 'primary' : u.role === 'patient' ? 'info' : 'success'}`}>
                                    {roleLabel}
                                  </span>
                                </td>
                                <td>{position}</td>
                                <td>
                                  <span className={`admin-badge ${u.isActive ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                    {u.isActive ? 'Active' : 'Locked'}
                                  </span>
                                </td>
                                <td>
                                  {u.role !== 'admin' && (
                                    <div className="btn-cell">
                                      <button
                                        className={u.isActive ? 'btn-danger btn-xs' : 'btn-primary btn-xs'}
                                        onClick={() => handleToggleActive(u._id, u.isActive)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                      >
                                        {u.isActive ? 'Lock' : 'Unlock'}
                                      </button>
                                      <button
                                        className="admin-btn-secondary"
                                        onClick={() => handleEditUserClick(u)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="admin-btn-danger"
                                        onClick={() => handleDeleteUserClick(u._id)}
                                        disabled={submitting}
                                        style={{ padding: '4px 8px', fontSize: '12px' }}
                                      >
                                        Delete
                                      </button>
                                      <button
                                        className="btn-impersonate"
                                        onClick={() => handleImpersonateClick(u._id)}
                                        disabled={submitting}
                                      >
                                        View as user
                                      </button>
                                    </div>
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
                          <h3 style={{ margin: 0 }}>Edit account</h3>
                          <button className="admin-close-modal-btn" onClick={() => setEditingUser(null)}>×</button>
                        </div>
                        <form onSubmit={handleSaveUserEdit} className="admin-dark-form grid-form">
                          <div className="form-group">
                            <label>Username (Phone)</label>
                            <input
                              type="text"
                              value={editUserForm.username}
                              onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>New password (leave blank to keep current)</label>
                            <input
                              type="password"
                              value={editUserForm.password}
                              onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                              placeholder="Enter a new password..."
                            />
                          </div>
                          <div className="form-group">
                            <label>Full name *</label>
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
                            <label>Phone number</label>
                            <input
                              type="text"
                              value={editUserForm.phone}
                              onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                            />
                          </div>
                          {editingUser.role === 'doctor' && (
                            <>
                              <div className="form-group">
                                <label>Specialty *</label>
                                <input
                                  type="text"
                                  value={editUserForm.specialization}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, specialization: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>Assigned department *</label>
                                <select
                                  value={editUserForm.departmentId}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, departmentId: e.target.value })}
                                  required
                                >
                                  <option value="">-- Select department --</option>
                                  {departments.map((d) => (
                                    <option key={d._id} value={d._id}>{d.departmentName}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Years of experience</label>
                                <input
                                  type="number"
                                  value={editUserForm.experienceYears}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, experienceYears: e.target.value })}
                                />
                              </div>
                              <div className="form-group">
                                <label>Consultation fee *</label>
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
                              <label>Position / Duties</label>
                              <input
                                type="text"
                                value={editUserForm.position}
                                onChange={(e) => setEditUserForm({ ...editUserForm, position: e.target.value })}
                              />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', gridColumn: 'span 2', marginTop: '15px' }}>
                            <button type="button" className="admin-btn-secondary" onClick={() => setEditingUser(null)}>
                              Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={submitting}>
                              Save changes
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
                    <label>Account name (Phone number) *</label>
                    <input
                      type="text"
                      placeholder="VD: 0912222222"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial password *</label>
                    <input
                      type="password"
                      placeholder="Secure password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Functional role *</label>
                    <select
                      value={userForm.roleName}
                      onChange={(e) => setUserForm({ ...userForm, roleName: e.target.value })}
                      required
                    >
                      <option value="doctor">Specialist doctor</option>
                      <option value="staff">Care staff / Receptionist</option>
                      <option value="accountant">Accountant / Cashier</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Staff full name *</label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={userForm.fullName}
                      onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  {/* Doctor special fields */}
                  {userForm.roleName === 'doctor' && (
                    <>
                      <div className="form-group">
                        <label>Clinical specialty *</label>
                        <input
                          type="text"
                          value={userForm.specialization}
                          onChange={(e) => setUserForm({ ...userForm, specialization: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Assigned department *</label>
                        <select
                          value={userForm.departmentId}
                          onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                          required
                        >
                          <option value="">-- Select department --</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d._id}>{d.departmentName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Years of experience</label>
                        <input
                          type="number"
                          value={userForm.experienceYears}
                          onChange={(e) => setUserForm({ ...userForm, experienceYears: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Consultation fee (baseFee) *</label>
                        <input
                          type="number"
                          value={userForm.baseFee}
                          onChange={(e) => setUserForm({ ...userForm, baseFee: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Qualifications / Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. MSc, PhD, Specialist Level I..."
                          value={userForm.qualifications}
                          onChange={(e) => setUserForm({ ...userForm, qualifications: e.target.value })}
                          required={userForm.roleName === 'doctor'}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Short doctor bio</label>
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
                      <label>Position / Assignment</label>
                      <input
                        type="text"
                        placeholder={userForm.roleName === 'accountant' ? 'Pharmacy cashier' : 'Lobby A receptionist'}
                        value={userForm.position}
                        onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab: CMS Blog Posts */}
          {activeTab === 'cms' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <h3 className="admin-card-section-title" style={{ margin: 0 }}>Current articles</h3>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
                    setIsPostModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  + New article
                </button>
              </div>

              {/* Form create/edit Popup Modal */}
              {isPostModalOpen && (
                <div className="admin-modal-overlay">
                  <div className="admin-modal-content" style={{ maxWidth: '800px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0 }}>{editingPost ? 'Edit article' : 'New article'}</h3>
                      <button className="admin-close-modal-btn" onClick={() => {
                        setIsPostModalOpen(false);
                        setEditingPost(null);
                        setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
                      }}>×</button>
                    </div>

                    <form onSubmit={handleSavePost} className="admin-dark-form">
                      <div className="post-form-grid">
                        <div className="form-group">
                          <label>Article title *</label>
                          <input
                            type="text"
                            value={postForm.title}
                            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                            placeholder="e.g. How to prevent dengue fever in summer"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Article cover image *</label>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input
                              type="text"
                              value={postForm.thumbnailURL}
                              onChange={(e) => setPostForm({ ...postForm, thumbnailURL: e.target.value })}
                              placeholder="https://images.unsplash.com/photo-..."
                              style={{ flex: 1 }}
                              required
                            />
                            <span style={{ color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap' }}>or Upload:</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ width: 'auto', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Publication status</label>
                          <select
                            value={postForm.status}
                            onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                          >
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Article content (Markdown or text) *</label>
                        <textarea
                          rows="8"
                          value={postForm.content}
                          onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                          placeholder="Enter the health article content here..."
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 15 }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => {
                            setIsPostModalOpen(false);
                            setEditingPost(null);
                            setPostForm({ title: '', content: '', thumbnailURL: '', status: 'Published' });
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                          {submitting ? 'Saving...' : 'Save article'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}


              
              {/* Search bar & Status filter for posts */}
              <div className="admin-dark-form" style={{ marginBottom: 20, display: 'flex', gap: 15 }}>
                <input
                  type="text"
                  placeholder="Search by article title..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  value={postStatusFilter}
                  onChange={(e) => setPostStatusFilter(e.target.value)}
                  style={{ width: 220, cursor: 'pointer' }}
                >
                  <option value="All">All articles</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {postsList.filter((post) => {
                const matchesSearch = !postSearch || post.title.toLowerCase().includes(postSearch.toLowerCase());
                const matchesFilter = postStatusFilter === 'All' || post.status === postStatusFilter;
                return matchesSearch && matchesFilter;
              }).length === 0 ? (
                <p style={{ color: '#64748b' }}>No articles match your search/filter criteria.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-dark-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Article title</th>
                        <th>Published date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {postsList
                        .filter((post) => {
                          const matchesSearch = !postSearch || post.title.toLowerCase().includes(postSearch.toLowerCase());
                          const matchesFilter = postStatusFilter === 'All' || post.status === postStatusFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((post) => (
                          <tr key={post._id}>
                            <td>
                              <img src={post.thumbnailURL} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                            </td>
                            <td className="admin-table-title-cell">{post.title}</td>
                            <td>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US')}</td>
                            <td>
                              <span className={`admin-badge ${post.status === 'Published' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                                {post.status === 'Published' ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div className="btn-cell">
                                <button className="admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEditPost(post)}>
                                  Edit
                                </button>
                                <button className="admin-btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeletePost(post._id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Doctor Schedules */}
          {activeTab === 'schedules' && (
            <div className="admin-card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Doctor shifts</h2>
                  <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Assign work shifts to each doctor by day.</p>
                </div>
              </div>

              {/* Create schedule form */}
              <form onSubmit={handleCreateSchedule} className="admin-inner-form" style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 600 }}>Add a new shift</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div className="form-group">
                    <label>Doctor *</label>
                    <select value={scheduleForm.doctorId} onChange={e => setScheduleForm({ ...scheduleForm, doctorId: e.target.value })} required>
                      <option value="">-- Select doctor --</option>
                      {doctorsList.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.fullName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Work date *</label>
                    <input type="date" value={scheduleForm.workDate} onChange={e => setScheduleForm({ ...scheduleForm, workDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label>Start time *</label>
                    <input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>End time *</label>
                    <input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Max patients *</label>
                    <input type="number" min={1} max={100} value={scheduleForm.maxPatients} onChange={e => setScheduleForm({ ...scheduleForm, maxPatients: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Add shift'}
                </button>
              </form>

              {/* Search */}
              <div style={{ marginBottom: 12 }}>
                <input type="text" placeholder="Search by doctor name..." value={scheduleSearch} onChange={e => setScheduleSearch(e.target.value)} className="search-input" style={{ width: '100%', maxWidth: 360 }} />
              </div>

              {/* Schedules table */}
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Work date</th>
                      <th>Start time</th>
                      <th>End time</th>
                      <th>Max patients</th>
                      <th>Booked</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorSchedules
                      .filter(s => !scheduleSearch || s.doctorId?.fullName?.toLowerCase().includes(scheduleSearch.toLowerCase()))
                      .map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.doctorId?.fullName || '--'}</strong><br /><small className="text-muted">{s.doctorId?.specialization}</small></td>
                          <td>{new Date(s.workDate).toLocaleDateString('en-US')}</td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td style={{ textAlign: 'center' }}>{s.maxPatients}</td>
                          <td style={{ textAlign: 'center' }}><strong>{s.currentBooked || 0}</strong> / {s.maxPatients}</td>
                          <td><span className={`badge ${s.status === 'Available' ? 'badge-success' : 'badge-danger'}`}>{s.status === 'Available' ? 'Available' : 'Full / Paused'}</span></td>
                          <td><button className="btn btn-danger btn-xs" onClick={() => handleDeleteSchedule(s._id)}>Delete</button></td>
                        </tr>
                      ))
                    }
                    {doctorSchedules.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No shifts have been created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Medicines */}
          {activeTab === 'medicines' && (
            <div className="admin-card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Medicine inventory</h2>
                  <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Add, edit, and update medicine stock.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingMedicine(null); setMedicineForm({ medicineName: '', medicineCode: '', activeIngredient: '', usageRoute: 'Uống', unit: 'tablet', unitPrice: 0, stockQuantity: 0 }); setIsMedicineModalOpen(true); }}>
                  + Add new medicine
                </button>
              </div>

              <div style={{ marginBottom: 12 }}>
                <input type="text" placeholder="Search medicine name or code..." value={medicineSearch} onChange={e => setMedicineSearch(e.target.value)} className="search-input" style={{ width: '100%', maxWidth: 360 }} />
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Medicine name</th>
                      <th>Active ingredient</th>
                      <th>Route</th>
                      <th>Unit</th>
                      <th>Unit price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicinesList
                      .filter(m => !medicineSearch || m.medicineName?.toLowerCase().includes(medicineSearch.toLowerCase()) || m.medicineCode?.toLowerCase().includes(medicineSearch.toLowerCase()))
                      .map(m => (
                        <tr key={m._id}>
                          <td className="monospace">{m.medicineCode}</td>
                          <td><strong>{m.medicineName}</strong></td>
                          <td><small>{m.activeIngredient || '--'}</small></td>
                          <td>{m.usageRoute === 'Uống' ? 'Oral' : m.usageRoute === 'Bôi' ? 'Topical' : m.usageRoute === 'Tiêm' ? 'Injection' : m.usageRoute}</td>
                          <td>{m.unit}</td>
                          <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(m.unitPrice)}</td>
                          <td><span style={{ fontWeight: 700, color: m.stockQuantity <= 10 ? '#ef4444' : '#10b981' }}>{m.stockQuantity}</span></td>
                          <td><span className={`badge ${m.isActive !== false ? 'badge-success' : 'badge-danger'}`}>{m.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                          <td className="btn-cell">
                            <button className="btn btn-ghost btn-xs" onClick={() => { setEditingMedicine(m); setMedicineForm({ medicineName: m.medicineName, medicineCode: m.medicineCode, activeIngredient: m.activeIngredient || '', usageRoute: m.usageRoute || 'Uống', unit: m.unit, unitPrice: m.unitPrice, stockQuantity: m.stockQuantity }); setIsMedicineModalOpen(true); }}>Edit</button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDeleteMedicine(m._id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    }
                    {medicinesList.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No medicines in stock yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Departments */}
          {activeTab === 'departments' && (
            <div className="admin-card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Department management</h2>
                  <p className="subtitle" style={{ margin: '4px 0 0 0' }}>Add, edit, and delete departments in the clinic system.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingDept(null); setDeptForm({ departmentName: '', description: '', contactPhone: '' }); setIsDeptModalOpen(true); }}>
                  + Add new department
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Department name</th>
                      <th>Description</th>
                      <th>Phone</th>
                      <th>Doctors</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map(d => (
                      <tr key={d._id}>
                        <td><strong>{d.departmentName}</strong></td>
                        <td><small>{d.description || '--'}</small></td>
                        <td>{d.contactPhone || '--'}</td>
                        <td style={{ textAlign: 'center' }}>{d.doctorCount || 0}</td>
                        <td className="btn-cell">
                          <button className="btn btn-ghost btn-xs" onClick={() => { setEditingDept(d); setDeptForm({ departmentName: d.departmentName, description: d.description || '', contactPhone: d.contactPhone || '' }); setIsDeptModalOpen(true); }}>Edit</button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleDeleteDept(d._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No departments in the system yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: System Health */}
          {activeTab === 'ai-analysis' && (
            <div className="admin-card animate-fade-in">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>System Health</h2>
                <p className="subtitle">Live diagnostics — account status, content, and clinic performance.</p>
              </div>

              {/* Summary Cards */}
              <div className="admin-ai-executive-summary">
                <div className="admin-stat-card admin-ai-card-security">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                    <Shield size={20} />
                  </div>
                  <div className="admin-stat-info">
                    <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#16a34a' }}>Account Security</p>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>
                      {usersList.filter(u => !u.isActive).length > 0
                        ? `${usersList.filter(u => !u.isActive).length} locked`
                        : 'All accounts active'}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{usersList.length} total accounts</p>
                  </div>
                </div>

                <div className="admin-stat-card admin-ai-card-cms">
                  <div className="admin-stat-icon-wrap">
                    <FileText size={20} />
                  </div>
                  <div className="admin-stat-info">
                    <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb' }}>Content (CMS)</p>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>
                      {postsList.filter(p => p.status === 'Published').length} published
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      {postsList.filter(p => p.status === 'Draft').length} drafts pending
                    </p>
                  </div>
                </div>

                <div className="admin-stat-card admin-ai-card-cskh">
                  <div className="admin-stat-icon-wrap" style={{ backgroundColor: 'rgba(217,119,6,0.08)', color: '#d97706' }}>
                    <Clock size={20} />
                  </div>
                  <div className="admin-stat-info">
                    <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#d97706' }}>Care Response</p>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>
                      {stats?.qualityMetrics?.avgConfirmationTime || 15} min avg.
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      {(stats?.qualityMetrics?.avgConfirmationTime || 15) <= 10 ? 'Within KPI target' : 'Above target — review peaks'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnostic Grid */}
              <div className="admin-performance-comparison-grid" style={{ marginBottom: 24 }}>
                {/* Staffing Breakdown */}
                <div className="admin-chart-panel">
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} color="#2563eb" /> Staffing Breakdown
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Doctors (active)</span>
                      <strong className="admin-diagnostic-value">{usersList.filter(u => u.role === 'doctor' && u.isActive).length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Care / Reception staff</span>
                      <strong className="admin-diagnostic-value">{usersList.filter(u => u.role === 'staff' && u.isActive).length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Accountants</span>
                      <strong className="admin-diagnostic-value">{usersList.filter(u => u.role === 'accountant' && u.isActive).length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Locked accounts</span>
                      <strong style={{ color: usersList.filter(u => !u.isActive).length > 0 ? '#dc2626' : '#16a34a' }}>
                        {usersList.filter(u => !u.isActive).length}
                      </strong>
                    </div>
                    <div className="admin-diagnostic-row no-border">
                      <span className="admin-diagnostic-label">Total accounts</span>
                      <strong className="admin-diagnostic-value">{usersList.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Content Status */}
                <div className="admin-chart-panel">
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Newspaper size={15} color="#2563eb" /> Content Status
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Total articles</span>
                      <strong className="admin-diagnostic-value">{postsList.length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Published</span>
                      <strong style={{ color: '#16a34a' }}>{postsList.filter(p => p.status === 'Published').length}</strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Drafts</span>
                      <strong style={{ color: postsList.filter(p => p.status === 'Draft').length > 0 ? '#d97706' : '#16a34a' }}>
                        {postsList.filter(p => p.status === 'Draft').length}
                      </strong>
                    </div>
                    <div className="admin-diagnostic-row">
                      <span className="admin-diagnostic-label">Departments</span>
                      <strong className="admin-diagnostic-value">{departments.length}</strong>
                    </div>
                    <div className="admin-diagnostic-row no-border">
                      <span className="admin-diagnostic-label">Medicines in stock</span>
                      <strong className="admin-diagnostic-value">{medicinesList.filter(m => m.isActive !== false).length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Query Box */}
              <div className="admin-ai-chat-box">
                <h4 className="admin-ai-chat-title">Ask the AI assistant</h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
                  Query the clinic data for deeper analysis.
                </p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <button type="button" className="admin-ai-suggestion-btn" onClick={() => runAIQuery('Analyze staff and account security')}>
                    Staff & Security
                  </button>
                  <button type="button" className="admin-ai-suggestion-btn" onClick={() => runAIQuery('Optimize CMS articles and SEO')}>
                    Content review
                  </button>
                  <button type="button" className="admin-ai-suggestion-btn" onClick={() => runAIQuery('Analyze revenue and operating performance')}>
                    Revenue analysis
                  </button>
                </div>

                <form onSubmit={handleAISubmit} className="admin-dark-form" style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Ask about accounts, content, revenue..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={aiLoading}
                  />
                  <button type="submit" className="btn-primary" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }} disabled={aiLoading}>
                    <Send size={14} />
                    {aiLoading ? 'Analyzing...' : 'Send'}
                  </button>
                </form>

                {(aiLoading || aiResponse) && (
                  <div className="admin-ai-response-area">
                    {aiLoading ? (
                      <div className="admin-ai-thinking">
                        <span className="admin-ai-thinking-dot"></span>
                        <span className="admin-ai-thinking-dot"></span>
                        <span className="admin-ai-thinking-dot"></span>
                        <span>Analyzing data...</span>
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
      
      {/* Medicine Modal */}
      {isMedicineModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editingMedicine ? 'Edit medicine' : 'Add new medicine'}</h3>
              <button className="close-btn" onClick={() => setIsMedicineModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveMedicine}>
              <div className="modal-body">
                <div className="grid-form">
                  <div className="form-group">
                    <label>Medicine name *</label>
                    <input type="text" value={medicineForm.medicineName} onChange={e => setMedicineForm({ ...medicineForm, medicineName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Medicine code *</label>
                    <input type="text" value={medicineForm.medicineCode} onChange={e => setMedicineForm({ ...medicineForm, medicineCode: e.target.value })} required disabled={!!editingMedicine} />
                  </div>
                  <div className="form-group">
                    <label>Active ingredient</label>
                    <input type="text" value={medicineForm.activeIngredient} onChange={e => setMedicineForm({ ...medicineForm, activeIngredient: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Route of use *</label>
                    <select value={medicineForm.usageRoute} onChange={e => setMedicineForm({ ...medicineForm, usageRoute: e.target.value })}>
                      <option value="Uống">Oral</option>
                      <option value="Bôi">Topical</option>
                      <option value="Tiêm">Injection</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unit *</label>
                    <input type="text" value={medicineForm.unit} onChange={e => setMedicineForm({ ...medicineForm, unit: e.target.value })} required placeholder="tablet, vial, sachet..." />
                  </div>
                  <div className="form-group">
                    <label>Unit price (VND) *</label>
                    <input type="number" min={0} value={medicineForm.unitPrice} onChange={e => setMedicineForm({ ...medicineForm, unitPrice: Number(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" min={0} value={medicineForm.stockQuantity} onChange={e => setMedicineForm({ ...medicineForm, stockQuantity: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsMedicineModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editingDept ? 'Edit department' : 'Add new department'}</h3>
              <button className="close-btn" onClick={() => setIsDeptModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveDept}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Department name *</label>
                  <input type="text" value={deptForm.departmentName} onChange={e => setDeptForm({ ...deptForm, departmentName: e.target.value })} required placeholder="e.g. General Internal Medicine" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows={3} value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Describe the department's expertise..." />
                </div>
                <div className="form-group">
                  <label>Department phone</label>
                  <input type="tel" value={deptForm.contactPhone} onChange={e => setDeptForm({ ...deptForm, contactPhone: e.target.value })} placeholder="VD: 028 xxxx xxxx" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* Modals for Create/Edit */}
      <DoctorScheduleModal
        isOpen={showDoctorScheduleModal}
        onClose={() => setShowDoctorScheduleModal(false)}
        appointmentData={appointmentToAssignDoctor}
        onConfirm={handleDoctorAssigned}
      />
    </div>
  );
}
