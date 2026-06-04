// Database Seed/Initialization Script
// Chạy script này để khởi tạo dữ liệu mẫu

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./env');
const {
  Role,
  User,
  Patient,
  Doctor,
  Staff,
  Department,
  Medicine,
  Doctor_Schedule,
  Appointment,
  Medical_Record,
  Prescription,
  Invoice,
  Invoice_Detail,
  Post,
} = require('../models');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    const force = process.argv.includes('--force');

    if (force) {
      // Clear existing data (only when --force is provided)
      await Role.deleteMany({});
      await User.deleteMany({});
      await Patient.deleteMany({});
      await Doctor.deleteMany({});
      await Staff.deleteMany({});
      await Department.deleteMany({});
      await Medicine.deleteMany({});
      await Doctor_Schedule.deleteMany({});
      await Appointment.deleteMany({});
      await Medical_Record.deleteMany({});
      await Prescription.deleteMany({});
      await Invoice.deleteMany({});
      await Invoice_Detail.deleteMany({});
      await Post.deleteMany({});
      console.log('✓ Cleared existing data (--force)');
    } else {
      const existingRoles = await Role.countDocuments();
      if (existingRoles > 0) {
        console.log('Roles already exist in DB. Run with --force to reset sample data.');
        await mongoose.disconnect();
        return;
      }
      console.log('No existing data found. Proceeding to create sample data.');
    }

    // 1. Create Roles
    const roles = await Role.insertMany([
      { roleName: 'admin', description: 'Quản trị viên' },
      { roleName: 'doctor', description: 'Bác sĩ' },
      { roleName: 'staff', description: 'Nhân viên CSKH' },
      { roleName: 'accountant', description: 'Kế toán' },
      { roleName: 'patient', description: 'Bệnh nhân' },
    ]);
    console.log('✓ Created roles');

    // 2. Create Admin User
    const adminUser = await User.create({
      username: '0901234567',
      passwordHash: 'admin123', // Will be hashed automatically
      roleId: roles.find(r => r.roleName === 'admin')._id,
      email: 'admin@clinic.com',
      phone: '0901234567',
      isActive: true,
    });
    console.log('✓ Created admin user');

    // 3. Create Departments (9 specialties)
    const departmentsData = [
      {
        departmentName: 'Nội tổng quát',
        description: 'Chẩn đoán, khám sàng lọc và điều trị nội khoa các bệnh lý mạn tính như tiểu đường, huyết áp, dạ dày ở người lớn.'
      },
      {
        departmentName: 'Ngoại tổng quát',
        description: 'Khám lâm sàng ngoại khoa, tư vấn phẫu thuật tiểu phẫu và điều trị các vết thương, chấn thương phần mềm.'
      },
      {
        departmentName: 'Nhi khoa',
        description: 'Khám điều trị bệnh lý sơ sinh, nhi khoa, tư vấn dinh dưỡng phát triển và theo dõi tiêm chủng định kỳ cho trẻ.'
      },
      {
        departmentName: 'Sản phụ khoa',
        description: 'Quản lý thai sản trọn gói, siêu âm thai 4D, khám phụ khoa định kỳ và tầm soát sớm ung thư cổ tử cung.'
      },
      {
        departmentName: 'Tai Mũi Họng',
        description: 'Nội soi chẩn đoán, điều trị viêm xoang, viêm tai giữa, viêm họng hạt và các bệnh hô hấp trên cấp tính.'
      },
      {
        departmentName: 'Răng Hàm Mặt',
        description: 'Chăm sóc răng miệng toàn diện, lấy cao răng, nhổ răng khôn không đau, hàn răng thẩm mỹ và niềng răng chuyên sâu.'
      },
      {
        departmentName: 'Da liễu',
        description: 'Khám và điều trị các bệnh về da, chàm, vảy nến, mụn trứng cá và tư vấn phục hồi hàng rào bảo vệ da hư tổn.'
      },
      {
        departmentName: 'Y học cổ truyền',
        description: 'Kết hợp tinh hoa Đông y và Tây y: châm cứu, bấm huyệt, xông thảo dược để phục hồi chức năng và trị liệu cơ xương khớp.'
      },
      {
        departmentName: 'Tim mạch',
        description: 'Siêu âm tim màu doppler, điện tâm đồ (ECG), tầm soát xơ vữa động mạch và phòng ngừa đột quỵ hiệu quả.'
      }
    ];

    const departments = await Department.insertMany(departmentsData);
    console.log('✓ Created 9 departments');

    // 3b. Định nghĩa Schema cho Service Package
    const servicePackageSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      icon: { type: String, required: true },
      title: { type: String, required: true },
      desc: { type: String, required: true },
      price: { type: String, required: true },
      period: { type: String, required: true },
      featured: { type: Boolean, default: false },
      badge: { type: String },
      benefits: { type: [String], required: true },
      deptKeyword: { type: String, required: true }
    }, {
      timestamps: true
    });

    // Tạo Model từ Schema
    const ServicePackage = mongoose.model('ServicePackage', servicePackageSchema);

    // Dữ liệu gói dịch vụ
    const servicePackages = [
      {
        id: 'basic',
        icon: '🩺',
        title: 'Gói Khám Sức Khỏe Cơ Bản',
        desc: 'Đánh giá tổng quát tình trạng sức khỏe hệ hô hấp, tuần hoàn, gan, thận và xét nghiệm máu cơ bản.',
        price: '750.000đ',
        period: 'mỗi lần khám',
        featured: false,
        benefits: [
          'Khám lâm sàng nội tổng quát',
          'Đo chỉ số sinh hiệu (Huyết áp, tim mạch)',
          'Công thức máu & đường huyết đói',
          'Đánh giá chức năng gan (AST, ALT)',
          'Đánh giá chức năng thận (Ure, Creatinin)',
          'Tư vấn kết quả cùng bác sĩ chuyên gia'
        ],
        deptKeyword: 'nội'
      },
      {
        id: 'screening',
        icon: '𫠀',
        title: 'Gói Tầm Soát Tim Mạch & Bệnh Lý',
        desc: 'Tầm soát chuyên sâu bệnh lý mạch vành, cao huyết áp, mỡ máu và chỉ số tầm soát dấu ấn ung thư sớm.',
        price: '2.500.000đ',
        period: 'mỗi lần khám',
        featured: true,
        badge: 'Bán chạy',
        benefits: [
          'Tất cả dịch vụ của gói cơ bản',
          'Siêu âm tim màu doppler nâng cao',
          'Đo điện tâm đồ (ECG) phát hiện rối loạn nhịp',
          'Xét nghiệm mỡ máu toàn phần (Cholesterol, LDL, HDL)',
          'Tầm soát dấu ấn ung thư gan, phổi, dạ dày',
          'Chụp X-Quang phổi thẳng kỹ thuật số'
        ],
        deptKeyword: 'tim'
      },
      {
        id: 'pediatric',
        icon: '👶',
        title: 'Gói Khám Nhi Khoa Toàn Diện',
        desc: 'Khám sức khỏe định kỳ cho trẻ, theo dõi cột mốc phát triển, kiểm tra dinh dưỡng và tư vấn tiêm chủng.',
        price: '400.000đ',
        period: 'mỗi lần khám',
        featured: false,
        benefits: [
          'Khám sức khỏe tổng quát nhi khoa',
          'Đánh giá các cột mốc phát triển thể chất',
          'Kiểm tra và tư vấn chế độ dinh dưỡng',
          'Sàng lọc các bệnh lý nhi khoa phổ biến',
          'Hỗ trợ lên phác đồ tiêm chủng chuẩn y khoa',
          'Tặng sổ tay theo dõi sức khỏe cho bé'
        ],
        deptKeyword: 'nhi'
      },
      {
        id: 'vip',
        icon: '💎',
        title: 'Gói Chăm Sóc Sức Khỏe VIP',
        desc: 'Khám ưu tiên không chờ đợi, bác sĩ Trưởng khoa tư vấn riêng biệt, phòng chờ hạng thương gia đẳng cấp.',
        price: '1.800.000đ',
        period: 'mỗi lần khám',
        featured: false,
        benefits: [
          'Ưu tiên khám nhanh không xếp hàng',
          'Khám trực tiếp cùng Trưởng/Phó khoa lâm sàng',
          'Sử dụng phòng chờ VIP Lounge tiện ích',
          'Phục vụ trà, cà phê & ăn nhẹ miễn phí',
          'Thời gian bác sĩ tư vấn chuyên sâu kéo dài',
          'Nhận kết quả nhanh chóng & trả tận nơi'
        ],
        deptKeyword: 'vip'
      }
    ];

    // Tiến hành insert thẳng, đồng bộ với mạch code của seed script
    const insertedPackages = await ServicePackage.insertMany(servicePackages);
    console.log(`✓ Created ${insertedPackages.length} service packages`);

    // ==========================================

    // 4. Create Doctor Users & Doctors (9 Doctors)
    const doctorRole = roles.find(r => r.roleName === 'doctor');
    const doctorPasswordHash = await bcrypt.hash('doctor123', 10);

    const doctorUsersData = [
      { username: '0911111111', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.hung@clinic.com', phone: '0911111111', isActive: true },
      { username: '0912222222', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.linh@clinic.com', phone: '0912222222', isActive: true },
      { username: '0910000001', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.an@clinic.com', phone: '0910000001', isActive: true },
      { username: '0910000002', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.nam@clinic.com', phone: '0910000002', isActive: true },
      { username: '0910000003', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.thuy@clinic.com', phone: '0910000003', isActive: true },
      { username: '0910000004', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.quochung@clinic.com', phone: '0910000004', isActive: true },
      { username: '0910000005', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.lien@clinic.com', phone: '0910000005', isActive: true },
      { username: '0910000006', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.minh@clinic.com', phone: '0910000006', isActive: true },
      { username: '0910000007', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.dung@clinic.com', phone: '0910000007', isActive: true }
    ];

    const doctorUsers = await User.insertMany(doctorUsersData);

    const doctorsData = [
      {
        userId: doctorUsers[0]._id,
        fullName: 'PGS.TS.BS. Trần Văn Hùng',
        specialization: 'Nội tim mạch & Can thiệp',
        departmentId: departments.find(d => d.departmentName === 'Tim mạch')._id,
        experienceYears: 18,
        baseFee: 350000,
        qualifications: 'Phó giáo sư, Tiến sĩ Y khoa - ĐH Y Dược TP.HCM',
        bio: 'PGS.TS.BS Trần Văn Hùng là chuyên gia đầu ngành trong lĩnh vực nội tim mạch với hơn 18 năm kinh nghiệm công tác tại Viện Tim mạch quốc gia. Ông chuyên sâu tầm soát huyết áp, rối loạn nhịp tim và dự phòng tai biến mạch máu não.',
        avatarURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[1]._id,
        fullName: 'ThS.BS. Phạm Thị Linh',
        specialization: 'Dinh dưỡng & Bệnh lý Nhi khoa',
        departmentId: departments.find(d => d.departmentName === 'Nhi khoa')._id,
        experienceYears: 12,
        baseFee: 250000,
        qualifications: 'Thạc sĩ Nhi khoa - Đại học Y Hà Nội',
        bio: 'Thạc sĩ, Bác sĩ Phạm Thị Linh được đông đảo bệnh nhi yêu quý nhờ phong cách khám bệnh ân cần, nhẹ nhàng. Bác sĩ chuyên điều trị các bệnh hô hấp trẻ em, còi xương biếng ăn và theo dõi sự phát triển thể chất toàn diện.',
        avatarURL: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[2]._id,
        fullName: 'BS.CKII. Nguyễn Văn An',
        specialization: 'Nội tổng quát & Đột quỵ',
        departmentId: departments.find(d => d.departmentName === 'Nội tổng quát')._id,
        experienceYears: 22,
        baseFee: 300000,
        qualifications: 'Bác sĩ chuyên khoa II - ĐH Y Dược TP.HCM',
        bio: 'Bác sĩ Nguyễn Văn An có kiến thức lâm sàng sâu rộng trong việc phát hiện và kiểm soát các bệnh lý mạn tính tuổi già như Đái tháo đường tuýp 2, tăng huyết áp vô căn, gút và các bệnh lý dạ dày tá tràng.',
        avatarURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[3]._id,
        fullName: 'ThS.BS. Lê Hoàng Nam',
        specialization: 'Ngoại tiêu hóa & Gan mật',
        departmentId: departments.find(d => d.departmentName === 'Ngoại tổng quát')._id,
        experienceYears: 15,
        baseFee: 280000,
        qualifications: 'Thạc sĩ Ngoại khoa - Bệnh viện Chợ Rẫy',
        bio: 'Bác sĩ Lê Hoàng Nam chuyên thăm khám và đưa ra các chỉ định phẫu thuật phù hợp cho bệnh nhân sỏi mật, trĩ cấp, thoát vị bẹn và thực hiện khâu vết thương phần mềm bằng chỉ tự tiêu thẩm mỹ cao.',
        avatarURL: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[4]._id,
        fullName: 'BS.CKI. Mai Thu Thủy',
        specialization: 'Sản Phụ Khoa & Siêu âm Thai 4D',
        departmentId: departments.find(d => d.departmentName === 'Sản phụ khoa')._id,
        experienceYears: 14,
        baseFee: 300000,
        qualifications: 'Bác sĩ chuyên khoa I Sản phụ khoa - ĐH Y Phạm Ngọc Thạch',
        bio: 'Bác sĩ Mai Thu Thủy chuyên sâu khám quản lý thai kỳ khỏe mạnh, thực hiện các kỹ thuật siêu âm sàng lọc dị tật thai nhi 4D và tư vấn phương pháp sinh không đau, kế hoạch hóa gia đình.',
        avatarURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[5]._id,
        fullName: 'BS. Vương Quốc Hùng',
        specialization: 'Nội soi & Điều trị Tai Mũi Họng',
        departmentId: departments.find(d => d.departmentName === 'Tai Mũi Họng')._id,
        experienceYears: 9,
        baseFee: 200000,
        qualifications: 'Bác sĩ Đa khoa - ĐH Y Dược TP.HCM',
        bio: 'Bác sĩ Vương Quốc Hùng là bác sĩ trẻ năng động, tận tụy với công tác nội soi chẩn đoán. Chuyên trị dứt điểm viêm tai giữa cấp tính, viêm xoang dị ứng thời tiết và gắp dị vật đường thở/đường ăn.',
        avatarURL: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[6]._id,
        fullName: 'ThS.BS. Đỗ Kim Liên',
        specialization: 'Răng Hàm Mặt & Nha khoa thẩm mỹ',
        departmentId: departments.find(d => d.departmentName === 'Răng Hàm Mặt')._id,
        experienceYears: 10,
        baseFee: 220000,
        qualifications: 'Thạc sĩ Răng Hàm Mặt - ĐH Y Dược TP.HCM',
        bio: 'Bác sĩ Đỗ Kim Liên có tay nghề cao trong việc nhổ răng khôn không đau bằng máy siêu âm Piezotome, hàn răng sâu thẩm mỹ composite và thực hiện các ca phục hình răng sứ cao cấp.',
        avatarURL: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[7]._id,
        fullName: 'BS. Hoàng Đức Minh',
        specialization: 'Da liễu & Thẩm mỹ Da',
        departmentId: departments.find(d => d.departmentName === 'Da liễu')._id,
        experienceYears: 11,
        baseFee: 250000,
        qualifications: 'Bác sĩ Da liễu - ĐH Y Dược Hải Phòng',
        bio: 'Bác sĩ Hoàng Đức Minh chuyên điều trị triệt để các bệnh chàm cơ địa, vảy nến toàn thân, mụn bọc sưng đỏ khó trị và tư vấn thiết kế phác đồ phục hồi làn da bị nhiễm corticoid do kem trộn.',
        avatarURL: 'https://images.unsplash.com/photo-1637059824899-a441006a6875?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[8]._id,
        fullName: 'BS.CKII. Lâm Chí Dũng',
        specialization: 'Châm cứu & Y học Cổ truyền',
        departmentId: departments.find(d => d.departmentName === 'Y học cổ truyền')._id,
        experienceYears: 25,
        baseFee: 300000,
        qualifications: 'Bác sĩ chuyên khoa II Y học cổ truyền',
        bio: 'Với 25 năm cống hiến cho y học dân tộc, bác sĩ Lâm Chí Dũng có kỹ thuật châm cứu, cứu ngải và bấm huyệt điêu luyện. Ông đã giúp hàng ngàn bệnh nhân hồi phục sau tai biến mạch máu não và thoát vị đĩa đệm.',
        avatarURL: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?q=80&w=300&auto=format&fit=crop',
        isActive: true
      }
    ];

    const doctors = await Doctor.insertMany(doctorsData);
    console.log('✓ Created 9 specialist doctors with profiles');

    // 5. Create Staff User
    const staffRole = roles.find(r => r.roleName === 'staff');
    const staffUser = await User.create({
      username: '0913333333',
      passwordHash: 'staff123',
      roleId: staffRole._id,
      email: 'staff@clinic.com',
      phone: '0913333333',
      isActive: true,
    });

    await Staff.create({
      userId: staffUser._id,
      fullName: 'Nguyễn Thị Hoa',
      position: 'CSKH',
    });
    console.log('✓ Created staff');

    // 5b. Create Accountant User
    const accountantRole = roles.find(r => r.roleName === 'accountant');
    const accountantUser = await User.create({
      username: '0915555555',
      passwordHash: 'accountant123',
      roleId: accountantRole._id,
      email: 'accountant@clinic.com',
      phone: '0915555555',
      isActive: true,
    });

    await Staff.create({
      userId: accountantUser._id,
      fullName: 'Trần Thị Kế Toán',
      position: 'Kế toán',
    });
    console.log('✓ Created accountant');

    // 6. Create Patient User
    const patientRole = roles.find(r => r.roleName === 'patient');
    const patientUser = await User.create({
      username: '0914444444',
      passwordHash: 'patient123',
      roleId: patientRole._id,
      email: 'patient@clinic.com',
      phone: '0914444444',
      isActive: true,
    });

    await Patient.create({
      userId: patientUser._id,
      fullName: 'Lê Văn Minh',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Nam',
      identityCard: '123456789012',
      phoneNumber: '0914444444',
      address: 'Quận 5, TP. Hồ Chí Minh',
    });
    console.log('✓ Created patient');

    // Extra patients
    const extraPatientsData = [
      { username: '0914000001', email: 'lan.nguyen@example.com', phone: '0914000001', fullName: 'Nguyễn Thị Lan', dateOfBirth: new Date('1985-08-20'), gender: 'Nữ', identityCard: '123456789013', address: 'Quận 1, TP. Hồ Chí Minh' },
      { username: '0914000002', email: 'hoang.tran@example.com', phone: '0914000002', fullName: 'Trần Minh Hoàng', dateOfBirth: new Date('1995-12-10'), gender: 'Nam', identityCard: '123456789014', address: 'Quận 3, TP. Hồ Chí Minh' },
      { username: '0914000003', email: 'huong.pham@example.com', phone: '0914000003', fullName: 'Phạm Thanh Hương', dateOfBirth: new Date('1992-03-25'), gender: 'Nữ', identityCard: '123456789015', address: 'Bình Thạnh, TP. Hồ Chí Minh' },
      { username: '0914000004', email: 'tuan.hoang@example.com', phone: '0914000004', fullName: 'Hoàng Anh Tuấn', dateOfBirth: new Date('1978-11-05'), gender: 'Nam', identityCard: '123456789016', address: 'Tân Bình, TP. Hồ Chí Minh' },
      { username: '0914000005', email: 'mai.vu@example.com', phone: '0914000005', fullName: 'Vũ Thị Mai', dateOfBirth: new Date('2000-07-15'), gender: 'Nữ', identityCard: '123456789017', address: 'Phú Nhuận, TP. Hồ Chí Minh' },
      { username: '0914000006', email: 'dung.do@example.com', phone: '0914000006', fullName: 'Đỗ Hùng Dũng', dateOfBirth: new Date('1988-02-28'), gender: 'Nam', identityCard: '123456789018', address: 'Gò Vấp, TP. Hồ Chí Minh' },
      { username: '0914000007', email: 'triet.bui@example.com', phone: '0914000007', fullName: 'Bùi Minh Triết', dateOfBirth: new Date('1965-05-18'), gender: 'Nam', identityCard: '123456789019', address: 'Quận 7, TP. Hồ Chí Minh' },
      { username: '0914000008', email: 'trang.ngo@example.com', phone: '0914000008', fullName: 'Ngô Thu Trang', dateOfBirth: new Date('1993-09-09'), gender: 'Nữ', identityCard: '123456789020', address: 'Thủ Đức, TP. Hồ Chí Minh' },
      { username: '0914000009', email: 'nam.le@example.com', phone: '0914000009', fullName: 'Lê Hoài Nam', dateOfBirth: new Date('1980-04-30'), gender: 'Nam', identityCard: '123456789021', address: 'Quận 10, TP. Hồ Chí Minh' },
      { username: '0914000010', email: 'yen.nguyen@example.com', phone: '0914000010', fullName: 'Nguyễn Hải Yến', dateOfBirth: new Date('1997-01-22'), gender: 'Nữ', identityCard: '123456789022', address: 'Bình Tân, TP. Hồ Chí Minh' },
    ];

    const extraPatients = [];
    for (const p of extraPatientsData) {
      const u = await User.create({
        username: p.username,
        passwordHash: 'patient123',
        roleId: patientRole._id,
        email: p.email,
        phone: p.phone,
        isActive: true,
      });
      const pat = await Patient.create({
        userId: u._id,
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        identityCard: p.identityCard,
        phoneNumber: p.phone,
        address: p.address,
      });
      extraPatients.push(pat);
    }
    console.log(`✓ Created ${extraPatients.length} extra patients`);

    // 7. Create Medicines (16 standard items)
    const medicinesData = [
      { medicineCode: 'MED001', medicineName: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', usageRoute: 'Uống', unit: 'viên', unitPrice: 2000, stockQuantity: 500, isActive: true },
      { medicineCode: 'MED002', medicineName: 'Amoxicillin 500mg', activeIngredient: 'Amoxicillin', usageRoute: 'Uống', unit: 'viên', unitPrice: 5000, stockQuantity: 200, isActive: true },
      { medicineCode: 'MED003', medicineName: 'Ibuprofen 400mg', activeIngredient: 'Ibuprofen', usageRoute: 'Uống', unit: 'viên', unitPrice: 3000, stockQuantity: 300, isActive: true },
      { medicineCode: 'MED004', medicineName: 'Cetirizine 10mg', activeIngredient: 'Cetirizine', usageRoute: 'Uống', unit: 'viên', unitPrice: 1500, stockQuantity: 400, isActive: true },
      { medicineCode: 'MED005', medicineName: 'Metformin 850mg', activeIngredient: 'Metformin', usageRoute: 'Uống', unit: 'viên', unitPrice: 4000, stockQuantity: 250, isActive: true },
      { medicineCode: 'MED006', medicineName: 'Atorvastatin 20mg', activeIngredient: 'Atorvastatin', usageRoute: 'Uống', unit: 'viên', unitPrice: 8000, stockQuantity: 150, isActive: true },
      { medicineCode: 'MED007', medicineName: 'Salbutamol 2mg', activeIngredient: 'Salbutamol', usageRoute: 'Uống', unit: 'viên', unitPrice: 2500, stockQuantity: 200, isActive: true },
      { medicineCode: 'MED008', medicineName: 'Omeprazole 20mg', activeIngredient: 'Omeprazole', usageRoute: 'Uống', unit: 'viên', unitPrice: 3500, stockQuantity: 350, isActive: true },
      { medicineCode: 'MED009', medicineName: 'Gliclazide 60mg', activeIngredient: 'Gliclazide', usageRoute: 'Uống', unit: 'viên', unitPrice: 4500, stockQuantity: 180, isActive: true },
      { medicineCode: 'MED010', medicineName: 'Amlodipine 5mg', activeIngredient: 'Amlodipine', usageRoute: 'Uống', unit: 'viên', unitPrice: 3000, stockQuantity: 300, isActive: true },
      { medicineCode: 'MED011', medicineName: 'Losartan 50mg', activeIngredient: 'Losartan', usageRoute: 'Uống', unit: 'viên', unitPrice: 6000, stockQuantity: 220, isActive: true },
      { medicineCode: 'MED012', medicineName: 'Augmentin 1g', activeIngredient: 'Amoxicillin + Clavulanate', usageRoute: 'Uống', unit: 'viên', unitPrice: 15000, stockQuantity: 100, isActive: true },
      { medicineCode: 'MED013', medicineName: 'Telfast 180mg', activeIngredient: 'Fexofenadine', usageRoute: 'Uống', unit: 'viên', unitPrice: 9000, stockQuantity: 120, isActive: true },
      { medicineCode: 'MED014', medicineName: 'Berberin 50mg', activeIngredient: 'Berberine', usageRoute: 'Uống', unit: 'viên', unitPrice: 800, stockQuantity: 1000, isActive: true },
      { medicineCode: 'MED015', medicineName: 'Panadol Extra', activeIngredient: 'Paracetamol + Caffeine', usageRoute: 'Uống', unit: 'viên', unitPrice: 3500, stockQuantity: 450, isActive: true },
      { medicineCode: 'MED016', medicineName: 'Vitamin C 500mg', activeIngredient: 'Ascorbic Acid', usageRoute: 'Uống', unit: 'viên', unitPrice: 1200, stockQuantity: 800, isActive: true }
    ];

    const medicines = await Medicine.insertMany(medicinesData);
    console.log('✓ Created 16 standard medicines');

    // 8. Create sample posts for CMS (6+ posts with rich HTML and thumbnails)
    const postsData = [
      {
        title: 'Chủ Động Phòng Ngừa Bệnh Lý Tim Mạch Mùa Nắng Nóng',
        slug: 'phong-ngua-benh-tim-mach-mua-nong',
        thumbnailURL: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Thời tiết nắng nóng gay gắt của mùa hè là yếu tố nguy cơ nguy hiểm làm gia tăng các cơn đau tim cấp, rối loạn nhịp tim và đột quỵ ở người có tiền sử bệnh nền. Theo PGS.TS.BS. Trần Văn Hùng, nhiệt độ cao làm cơ thể mất nước, máu cô đặc lại gây tăng gánh nặng cho hệ tuần hoàn.</p>
          <p>Để bảo vệ trái tim khỏe mạnh trong mùa nóng, hãy lưu ý các nguyên tắc vàng sau đây:</p>
          <ul>
            <li><strong>Uống nước đều đặn:</strong> Đừng đợi đến khi khát mới uống. Hãy uống từ 2-2.5 lít nước lọc hoặc nước điện giải nhẹ mỗi ngày.</li>
            <li><strong>Hạn chế ra ngoài giờ cao điểm:</strong> Tránh các hoạt động ngoài trời từ 10h sáng đến 4h chiều để tránh sốc nhiệt.</li>
            <li><strong>Ổn định nhiệt độ điều hòa:</strong> Không để phòng máy lạnh quá lạnh lệch với môi trường ngoài quá 7 độ C để tránh co thắt mạch đột ngột.</li>
            <li><strong>Kiểm soát huyết áp:</strong> Uống thuốc duy trì đúng giờ theo chỉ định của bác sĩ tim mạch, tuyệt đối không tự ý ngưng thuốc.</li>
          </ul>
          <p>Nếu có triệu chứng tức ngực, khó thở, chóng mặt hoặc vã mồ hôi lạnh, hãy đến ngay cơ sở y tế gần nhất để chẩn đoán cấp cứu kịp thời.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-20'),
      },
      {
        title: 'Chăm Sóc Răng Miệng Cho Trẻ Em: Những Sai Lầm Thường Gặp',
        slug: 'cham-soc-rang-mieng-tre-em',
        thumbnailURL: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Nhiều phụ huynh nghĩ rằng răng sữa của trẻ rồi sẽ rụng nên không cần chăm sóc kỹ. Đây là quan điểm cực kỳ sai lầm. ThS.BS. Đỗ Kim Liên, Trưởng bộ phận Răng Hàm Mặt, nhấn mạnh răng sữa đóng vai trò quan trọng trong việc định hướng mọc răng vĩnh viễn và phát âm của trẻ.</p>
          <p>Các lỗi phổ biến cha mẹ thường mắc phải:</p>
          <ol>
            <li><strong>Cho trẻ bú bình ngủ qua đêm:</strong> Đường trong sữa bám vào men răng suốt đêm gây sâu răng hàng loạt (sâu sún răng).</li>
            <li><strong>Dùng kem đánh răng người lớn:</strong> Hàm lượng Fluor quá cao có thể gây ngộ độc hoặc ố men răng vĩnh viễn của bé.</li>
            <li><strong>Trì hoãn đi khám nha sĩ:</strong> Trẻ cần được khám răng định kỳ mỗi 6 tháng bắt đầu từ khi mọc chiếc răng sữa đầu tiên.</li>
          </ol>
          <p>Cha mẹ nên hỗ trợ chải răng cho bé bằng bàn chải lông mềm và kem đánh răng dành riêng cho trẻ em với lượng nhỏ bằng hạt đậu đỏ mỗi ngày 2 lần.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-18'),
      },
      {
        title: 'Chế Độ Dinh Dưỡng Khoa Học Cho Trẻ Biếng Ăn Dưới 5 Tuổi',
        slug: 'dinh-duong-cho-tre-bieng-an',
        thumbnailURL: 'https://images.unsplash.com/photo-1471286174574-e966813af344?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Biếng ăn ở trẻ nhỏ dưới 5 tuổi luôn là nỗi lo âu thường trực của các bậc phụ huynh. Để giải quyết triệt để vấn đề này, ThS.BS. Phạm Thị Linh khuyên cha mẹ không nên sử dụng bạo lực hay ép buộc trẻ ăn, điều này vô tình tạo tâm lý sợ hãi bữa ăn.</p>
          <p>Hãy xây dựng thói quen ăn uống lành mạnh bằng các biện pháp:</p>
          <ul>
            <li><strong>Thiết lập giờ ăn cố định:</strong> Khoảng cách giữa các bữa ăn chính và phụ tối thiểu là 2-3 tiếng để trẻ kịp thấy đói.</li>
            <li><strong>Đa dạng hóa thực đơn:</strong> Trang trí món ăn đẹp mắt, nhiều màu sắc bắt mắt để kích thích thị giác của bé.</li>
            <li><strong>Không ăn rong, không xem tivi/điện thoại:</strong> Giúp trẻ tập trung vào việc nhai nuốt, hỗ trợ tiêu hóa tốt hơn.</li>
            <li><strong>Bổ sung vi chất đúng cách:</strong> Kẽm, Lysine và các vitamin nhóm B hỗ trợ kích thích vị giác tự nhiên. Nên tham vấn ý kiến bác sĩ nhi trước khi sử dụng.</li>
          </ul>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-16'),
      },
      {
        title: 'Tầm Quan Trọng Của Việc Khám Sức Khỏe Tổng Quát Định Kỳ',
        slug: 'tam-quan-trong-kham-suc-khoe-dinh-ky',
        thumbnailURL: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Nhiều căn bệnh nguy hiểm như ung thư, tiểu đường, suy thận hay xơ vữa động mạch diễn tiến vô cùng âm thầm, không hề có triệu chứng ở giai đoạn đầu. Việc khám sức khỏe tổng quát định kỳ là chìa khóa vàng giúp phát hiện sớm mầm bệnh để điều trị kịp thời.</p>
          <p>Lợi ích của khám tổng quát định kỳ:</p>
          <blockquote>
            Phát hiện sớm giúp tăng tỷ lệ điều trị thành công lên tới 90%, giảm thiểu tối đa chi phí nằm viện và thời gian điều trị.
          </blockquote>
          <p>Quy trình khám sức khỏe tiêu chuẩn tại Phòng Khám Hợp Sơn Tài bao gồm: Khám lâm sàng toàn diện, Xét nghiệm máu sinh hóa (đường máu, mỡ máu, chức năng gan thận), Siêu âm ổ bụng, Điện tâm đồ và chụp X-quang phổi thẳng.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-14'),
      },
      {
        title: 'Phương Pháp Đông Tây Y Kết Hợp Trong Điều Trị Đau Cơ Xương Khớp',
        slug: 'dong-tay-y-ket-hop-tri-dau-xuong-khop',
        thumbnailURL: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Các bệnh lý đau vai gáy, thoát vị đĩa đệm, thoái hóa khớp gối ngày càng trẻ hóa do thói quen lười vận động và ngồi sai tư thế của dân văn phòng. BS.CKII. Lâm Chí Dũng chỉ ra rằng việc kết hợp Đông - Tây Y mang lại hiệu quả trị liệu vượt trội, giúp cắt cơn đau nhanh mà không cần lạm dụng thuốc giảm đau gây hại dạ dày.</p>
          <p>Phương pháp điều trị kết hợp tiêu biểu:</p>
          <ul>
            <li><strong>Chẩn đoán hiện đại:</strong> Chụp X-quang, MRI để xác định chính xác vị trí tổn thương đĩa đệm hoặc thoái hóa khớp.</li>
            <li><strong>Châm cứu & Điện châm:</strong> Kích thích giải phóng endorphin tự nhiên - chất giảm đau nội sinh của cơ thể, làm giãn cơ sâu.</li>
            <li><strong>Vật lý trị liệu:</strong> Kéo giãn cột sống, siêu âm trị liệu giúp phục hồi khả năng vận động tự nhiên của khớp.</li>
          </ul>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-12'),
      },
      {
        title: 'Phòng Ngừa Và Điều Trị Viêm Da Tiếp Xúc Dưới Thời Tiết Ngày Hè',
        slug: 'viem-da-tiep-xuc-ngay-he',
        thumbnailURL: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Mùa hè thời tiết nóng ẩm kèm theo côn trùng sinh sôi mạnh dễ khiến làn da dễ bị kích ứng, nổi mẩn đỏ, ngứa ngáy dữ dội. Bác sĩ Hoàng Đức Minh hướng dẫn cách phòng tránh và xử trí đúng cách khi bị viêm da tiếp xúc kích ứng.</p>
          <p>Cách xử lý bước đầu khi da tiếp xúc với chất độc côn trùng (như kiến ba khoang):</p>
          <ol>
            <li><strong>Rửa ngay bằng nước sạch:</strong> Tuyệt đối không cào gãi làm vỡ bọc mụn nước khiến dịch lan rộng sang vùng da lành.</li>
            <li><strong>Dùng hồ nước hoặc sát khuẩn nhẹ:</strong> Chấm nhẹ lên vùng tổn thương để làm dịu da và sát khuẩn.</li>
            <li><strong>Tránh đắp lá, thuốc tự chế:</strong> Nhiều bệnh nhân tự ý đắp thuốc lá gây nhiễm trùng, loét da hoại tử sâu rất nguy hiểm.</li>
          </ol>
          <p>Nếu da có biểu hiện phồng rộp lớn, mủ trắng rỉ dịch hoặc sốt nhẹ, hãy đến phòng khám chuyên khoa da liễu để được kê đơn thuốc bôi kháng viêm thích hợp.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-10'),
      },
      {
        title: 'Chế Độ Ăn Uống Y Khoa Cho Bệnh Nhân Gút (Gout): Nên Ăn Gì Và Kiêng Gì?',
        slug: 'che-do-dinh-duong-y-khoa-benh-nhan-gout',
        thumbnailURL: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Chế độ dinh dưỡng đóng vai trò cực kỳ quan trọng trong việc kiểm soát nồng độ axit uric máu, làm giảm tần suất xuất hiện các cơn gút (gout) cấp tính và ngăn ngừa các biến chứng nguy hiểm lên thận. Theo các chuyên gia Cơ Xương Khớp, việc điều chỉnh thực đơn hàng ngày có thể hỗ trợ đắc lực cho phác đồ điều trị nội khoa.</p>
          <h3>Nguyên tắc dinh dưỡng cốt lõi:</h3>
          <ul>
            <li><strong>Hạn chế thực phẩm giàu Purin:</strong> Tránh tuyệt đối nội tạng động vật (gan, thận, lòng, tim), các loại thịt đỏ (thịt bò, dê, trâu) và một số hải sản như cá trích, tôm, sò điệp.</li>
            <li><strong>Nói không với bia rượu:</strong> Rượu bia cản trước quá trình đào thải axit uric ở thận, là tác nhân hàng đầu kích hoạt cơn đau gút dữ dội vào ban đêm.</li>
            <li><strong>Uống nhiều nước:</strong> Đảm bảo từ 2 - 2.5 lít nước mỗi ngày (nước lọc hoặc nước khoáng kiềm nhẹ) để kích thích thận lọc thải axit uric qua đường tiểu.</li>
            <li><strong>Ưu tiên đạm thực vật và sữa ít béo:</strong> Sử dụng đậu phụ, các loại hạt lành mạnh và sữa chua/phô mai ít béo để cung cấp đủ dưỡng chất mà không làm tăng axit uric.</li>
          </ul>
          <p>Bên cạnh dinh dưỡng, bệnh nhân cần tuân thủ dùng thuốc hạ axit uric theo đúng chỉ định của bác sĩ chuyên khoa và tái khám định kỳ.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-06-03'),
      },
      {
        title: 'Rối Loạn Tiền Đình: Triệu Chứng Nhận Biết Và Phương Pháp Điều Trị',
        slug: 'roi-loan-tien-dinh-trieu-chung-dieu-tri',
        thumbnailURL: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Rối loạn tiền đình là bệnh lý phổ biến gây ra do tổn thương dây thần kinh số 8 hoặc hệ thống đường dẫn truyền thăng bằng trong não bộ. Bệnh ảnh hưởng nghiêm trọng đến khả năng giữ thăng bằng của cơ thể và sinh hoạt hàng ngày của người bệnh.</p>
          <h3>Triệu chứng điển hình:</h3>
          <ul>
            <li><strong>Chóng mặt dữ dội:</strong> Cảm giác nhà cửa xoay tròn, chao đảo khi thay đổi tư thế đột ngột.</li>
            <li><strong>Mất thăng bằng:</strong> Đi đứng loạng choạng, không vững vàng, dễ ngã.</li>
            <li><strong>Ù tai và giảm thính lực:</strong> Thường đi kèm cảm giác nặng tai, nghe thấy tiếng vo ve trong tai.</li>
            <li><strong>Buồn nôn và nôn mửa:</strong> Xảy ra do hệ thần kinh thực vật bị kích thích quá mức trong các cơn chóng mặt.</li>
          </ul>
          <h3>Phương pháp điều trị y học:</h3>
          <p>Tùy theo nguyên nhân ngoại biên hay trung ương, bác sĩ sẽ chỉ định các thuốc cắt cơn chóng mặt (như dimenhydrinate), thuốc cải thiện tuần hoàn tai trong (betahistine) hoặc kết hợp châm cứu, bấm huyệt Đông y ở các huyệt đạo Ấn đường, Nội quan để thông kinh hoạt lạc. Ngoài ra, việc duy trì lối sống lành mạnh, giảm stress và tập luyện các bài tập phục hồi chức năng tiền đình đóng vai trò rất quan trọng.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-06-02'),
      },
      {
        title: 'Đái Tháo Đường: Biến Chứng Nguy Hiểm Và Cách Phòng Ngừa Chủ Động',
        slug: 'dai-thao-duong-bien-chung-phong-ngua',
        thumbnailURL: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Đái tháo đường (tiểu đường) là bệnh lý chuyển hóa mạn tính đặc trưng bởi tình trạng lượng đường trong máu luôn ở mức cao do thiếu hụt insulin hoặc đề kháng insulin. Nếu không được kiểm soát tốt, bệnh sẽ tàn phá âm thầm các cơ quan trong cơ thể.</p>
          <h3>Các biến chứng nguy hiểm:</h3>
          <ul>
            <li><strong>Biến chứng tim mạch:</strong> Tăng nguy cơ xơ vữa động mạch, nhồi máu cơ tim và tai biến mạch máu não gấp 2-4 lần.</li>
            <li><strong>Biến chứng thận:</strong> Tổn thương mạch máu nhỏ ở cầu thận dẫn đến suy thận mạn tính giai đoạn cuối phải chạy thận nhân tạo.</li>
            <li><strong>Biến chứng mắt:</strong> Gây tổn thương võng mạc, đục thủy tinh thể, thậm chí dẫn đến mù lòa.</li>
            <li><strong>Biến chứng thần kinh & Bàn chân:</strong> Gây dị cảm, tê bì tay chân, mất cảm giác đau dẫn đến các vết loét nhiễm trùng khó lành phải cắt cụt chi.</li>
          </ul>
          <h3>Phòng ngừa chủ động:</h3>
          <p>Để ngăn ngừa và kiểm soát đái tháo đường, người dân cần xây dựng thực đơn ít tinh bột đường tinh chế, giàu chất xơ từ rau củ, tập thể dục tối thiểu 150 phút/tuần và tầm soát định kỳ chỉ số đường huyết đói cùng HbA1c mỗi 6 tháng một lần.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-06-01'),
      },
      {
        title: 'Bệnh Sốt Xuất Huyết: Hướng Dẫn Chăm Sóc Và Dấu Hiệu Cảnh Báo Nguy Hiểm',
        slug: 'sot-xuat-huyet-cham-soc-canh-bao-nguy-hiem',
        thumbnailURL: 'https://images.unsplash.com/photo-1584036561566-baf241f2c44e?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Sốt xuất huyết Dengue là bệnh truyền nhiễm cấp tính do virus Dengue gây ra thông qua vật chủ trung gian truyền bệnh là muỗi vằn Aedes aegypti. Bệnh có thể diễn tiến nặng bất ngờ vào những ngày hết sốt (thường từ ngày thứ 3 đến ngày thứ 7 của bệnh).</p>
          <h3>Cách chăm sóc an toàn tại nhà:</h3>
          <ul>
            <li><strong>Hạ sốt đúng cách:</strong> Chỉ sử dụng Paracetamol đơn chất để hạ sốt. Tuyệt đối không dùng Aspirin hoặc Ibuprofen vì các thuốc này làm trầm trọng thêm tình trạng xuất huyết.</li>
            <li><strong>Bù nước liên tục:</strong> Uống nhiều dung dịch Oresol pha đúng liều lượng hướng dẫn, nước trái cây (nước dừa, nước cam) để bổ sung chất điện giải mất đi do sốt cao.</li>
            <li><strong>Nghỉ ngơi tại giường:</strong> Tránh các vận động thể chất mạnh để hạn chế nguy cơ xuất huyết nội tạng.</li>
          </ul>
          <h3>Các dấu hiệu nguy hiểm cần nhập viện khân cấp:</h3>
          <p>Người nhà cần theo dõi sát sao và đưa bệnh nhân đi cấp cứu ngay khi xuất hiện một trong các dấu hiệu cảnh báo sau: Đau bụng dữ dội vùng hạ sườn phải, nôn mửa liên tục, chảy máu cam hoặc chảy máu chân răng, đi ngoài phân đen, tay chân lạnh ẩm, lờ đờ hoặc vật vã kích thích.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-30'),
      }
    ];

    await Post.insertMany(postsData);
    console.log('✓ Created 10 rich-text clinical blog posts');

    // 9. Create Doctor Schedules for ALL 9 doctors for June 2026
    const schedules = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= 30; day++) {
      const date = new Date(2026, 5, day); // Note: Month 5 is June in JS Date (0-indexed)
      date.setHours(0, 0, 0, 0);

      for (const doc of doctors) {
        // Morning schedule (08:00 - 12:00)
        schedules.push({
          doctorId: doc._id,
          workDate: date,
          startTime: '08:00',
          endTime: '12:00',
          maxPatients: 15,
          currentBooked: 0,
          status: 'Available',
        });
        // Afternoon schedule (13:30 - 17:30)
        schedules.push({
          doctorId: doc._id,
          workDate: date,
          startTime: '13:30',
          endTime: '17:30',
          maxPatients: 15,
          currentBooked: 0,
          status: 'Available',
        });
      }
    }

    const createdSchedules = await Doctor_Schedule.insertMany(schedules);
    console.log(`✓ Created ${createdSchedules.length} work schedules for June 2026 (all 9 doctors)`);

    // 10. Create an appointment, medical record and prescription for the test patient
    const patientDoc = await Patient.findOne({ phoneNumber: '0914444444' });
    const firstDoctor = doctors[0];
    const todayDate = new Date(2026, 5, 4);
    todayDate.setHours(0, 0, 0, 0);
    const firstSchedule = createdSchedules.find(s =>
      s.doctorId.toString() === firstDoctor._id.toString() &&
      s.startTime === '08:00' &&
      s.workDate.getTime() === todayDate.getTime()
    );

    const appointment = await Appointment.create({
      patientId: patientDoc._id,
      requestedDate: todayDate,
      requestedTime: '09:00',
      symptoms: 'Đau thắt ngực nhẹ, khó thở khi vận động mạnh',
      departmentId: firstDoctor.departmentId,
      doctorId: firstDoctor._id,
      scheduleId: firstSchedule ? firstSchedule._id : undefined,
      status: 'Confirmed',
      confirmedBy: staffUser._id,
    });
    console.log('✓ Created appointment');

    if (firstSchedule) {
      firstSchedule.currentBooked = 1;
      await firstSchedule.save();
    }

    const medicalRecord = await Medical_Record.create({
      appointmentId: appointment._id,
      patientId: patientDoc._id,
      doctorId: firstDoctor._id,
      height: 172,
      weight: 68,
      bloodPressure: '135/85',
      heartRate: 82,
      temperature: 36.8,
      diagnosis: 'Tăng huyết áp nhẹ giai đoạn 1, nghi ngờ xơ vữa động mạch vành',
      clinicalNotes: 'Hạn chế ăn mặn, giảm chất béo động vật, tái khám sau 1 tháng.',
    });
    console.log('✓ Created medical record');

    const prescription = await Prescription.create({
      recordId: medicalRecord._id,
      medicineId: medicines[0]._id, // Paracetamol
      quantity: 10,
      dosage: '500mg',
      frequency: '2 lần/ngày khi đau',
      durationDays: 5,
      specialInstructions: 'Uống sau ăn no',
    });
    console.log('✓ Created prescription');

    // 11. Create invoices: consultation + pharmacy
    const accountantStaff = await Staff.findOne({ position: 'Kế toán' });

    // Drop old unique index on appointmentId if exists
    try {
      await mongoose.connection.collection('invoices').dropIndex('appointmentId_1');
      console.log('Dropped old unique index on invoices.appointmentId');
    } catch (err) {
      // ignore if index does not exist
    }

    const consultationInvoice = await Invoice.create({
      invoiceType: 'Consultation',
      appointmentId: appointment._id,
      patientId: patientDoc._id,
      totalAmount: firstDoctor.baseFee || 350000,
      status: 'Unpaid',
      processedBy: accountantStaff ? accountantStaff._id : undefined,
    });

    const pharmacyTotal = medicines[0].unitPrice * 10;
    const pharmacyInvoice = await Invoice.create({
      invoiceType: 'Pharmacy',
      appointmentId: appointment._id,
      patientId: patientDoc._id,
      totalAmount: pharmacyTotal,
      status: 'Unpaid',
      processedBy: accountantStaff ? accountantStaff._id : undefined,
    });

    await Invoice_Detail.create({
      invoiceId: pharmacyInvoice._id,
      medicineId: medicines[0]._id,
      quantity: 10,
      unitPrice: medicines[0].unitPrice,
      subTotal: pharmacyTotal,
    });
    console.log('✓ Created invoices and invoice details');

    // 12. Create 5 COMPLETED appointments, medical records, prescriptions, and paid invoices
    console.log('✓ Seeding 5 completed appointments...');

    const completedAppointmentsData = [
      {
        patient: extraPatients[0], // Nguyễn Thị Lan
        doctor: doctors.find(d => d.fullName.includes('Nguyễn Văn An')),
        date: new Date(2026, 5, 1),
        time: '09:00',
        startTime: '08:00',
        symptoms: 'Đau âm ỉ vùng thượng vị, ợ chua, buồn nôn sau khi ăn',
        height: 158,
        weight: 52,
        bloodPressure: '120/80',
        heartRate: 76,
        temperature: 36.5,
        diagnosis: 'Viêm dạ dày cấp tính, trào ngược dạ dày thực quản (GERD)',
        clinicalNotes: 'Ăn chín uống sôi, chia nhỏ bữa ăn, tránh thức ăn cay nóng và chất kích thích. Uống thuốc đúng giờ.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED008'), qty: 14, dosage: '20mg', freq: '2 lần/ngày, trước ăn 30p', duration: 7, inst: 'Uống sáng và tối' },
          { med: medicines.find(m => m.medicineCode === 'MED001'), qty: 10, dosage: '500mg', freq: '3 lần/ngày khi đau', duration: 3, inst: 'Uống sau ăn' }
        ]
      },
      {
        patient: extraPatients[1], // Trần Minh Hoàng
        doctor: doctors.find(d => d.fullName.includes('Trần Văn Hùng')),
        date: new Date(2026, 5, 1),
        time: '14:30',
        startTime: '13:30',
        symptoms: 'Đau đầu, chóng mặt nhẹ, đo huyết áp tại nhà thấy cao (150/90)',
        height: 175,
        weight: 74,
        bloodPressure: '155/95',
        heartRate: 85,
        temperature: 36.6,
        diagnosis: 'Tăng huyết áp vô căn giai đoạn 2, rối loạn lipid máu',
        clinicalNotes: 'Giảm muối trong khẩu phần ăn, tập thể dục nhẹ nhàng 30 phút mỗi ngày. Tái khám sau 1 tháng.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED010'), qty: 30, dosage: '5mg', freq: '1 lần/ngày', duration: 30, inst: 'Uống sáng sau ăn' },
          { med: medicines.find(m => m.medicineCode === 'MED006'), qty: 30, dosage: '20mg', freq: '1 lần/ngày', duration: 30, inst: 'Uống tối trước khi đi ngủ' }
        ]
      },
      {
        patient: extraPatients[2], // Phạm Thanh Hương
        doctor: doctors.find(d => d.fullName.includes('Hoàng Đức Minh')),
        date: new Date(2026, 5, 2),
        time: '10:00',
        startTime: '08:00',
        symptoms: 'Da vùng cổ nổi vệt đỏ, có mụn nước nhỏ, rát nhiều nghi do kiến ba khoang',
        height: 162,
        weight: 48,
        bloodPressure: '110/70',
        heartRate: 72,
        temperature: 36.7,
        diagnosis: 'Viêm da tiếp xúc kích ứng do côn trùng',
        clinicalNotes: 'Tránh gãi, không tự ý đắp các loại lá cây. Rửa nhẹ bằng nước muối sinh lý trước khi bôi thuốc.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED004'), qty: 10, dosage: '10mg', freq: '1 lần/ngày', duration: 10, inst: 'Uống tối sau ăn' }
        ]
      },
      {
        patient: extraPatients[3], // Hoàng Anh Tuấn
        doctor: doctors.find(d => d.fullName.includes('Lâm Chí Dũng')),
        date: new Date(2026, 5, 3),
        time: '15:30',
        startTime: '13:30',
        symptoms: 'Đau mỏi vai gáy lan xuống cánh tay phải, tê nhẹ ngón tay',
        height: 170,
        weight: 70,
        bloodPressure: '130/80',
        heartRate: 78,
        temperature: 36.4,
        diagnosis: 'Đau vai gáy cấp, thoái hóa cột sống cổ nhẹ',
        clinicalNotes: 'Tránh ngồi một tư thế quá lâu, tập các bài tập vận động cổ nhẹ nhàng. Kết hợp châm cứu trị liệu.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED016'), qty: 20, dosage: '500mg', freq: '2 lần/ngày', duration: 10, inst: 'Uống sau ăn no' }
        ]
      },
      {
        patient: extraPatients[4], // Vũ Thị Mai
        doctor: doctors.find(d => d.fullName.includes('Vương Quốc Hùng')),
        date: new Date(2026, 5, 4),
        time: '09:30',
        startTime: '08:00',
        symptoms: 'Đau họng, nuốt vướng, sốt nhẹ 37.8 độ, chảy mũi trong',
        height: 160,
        weight: 50,
        bloodPressure: '115/75',
        heartRate: 80,
        temperature: 37.8,
        diagnosis: 'Viêm họng hạt cấp tính, viêm mũi dị ứng thời tiết',
        clinicalNotes: 'Súc họng bằng nước muối sinh lý ấm nhiều lần trong ngày, uống nhiều nước ấm, giữ ấm vùng cổ.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED002'), qty: 20, dosage: '500mg', freq: '2 lần/ngày', duration: 10, inst: 'Uống sáng và tối sau ăn' },
          { med: medicines.find(m => m.medicineCode === 'MED001'), qty: 10, dosage: '500mg', freq: '2 lần/ngày khi sốt > 38.5 độ', duration: 5, inst: 'Uống cách nhau 4-6 tiếng' }
        ]
      }
    ];

    for (const data of completedAppointmentsData) {
      // Find the doctor's schedule for this date and time block
      const sched = createdSchedules.find(s =>
        s.doctorId.toString() === data.doctor._id.toString() &&
        s.workDate.getTime() === data.date.getTime() &&
        s.startTime === data.startTime
      );

      if (sched) {
        sched.currentBooked += 1;
        if (sched.currentBooked >= sched.maxPatients) {
          sched.status = 'Full';
        }
        await sched.save();
      }

      // Create Appointment
      const appt = await Appointment.create({
        patientId: data.patient._id,
        requestedDate: data.date,
        requestedTime: data.time,
        symptoms: data.symptoms,
        departmentId: data.doctor.departmentId,
        doctorId: data.doctor._id,
        scheduleId: sched ? sched._id : undefined,
        status: 'Completed',
        confirmedBy: staffUser._id,
      });

      // Create Medical Record
      const record = await Medical_Record.create({
        appointmentId: appt._id,
        patientId: data.patient._id,
        doctorId: data.doctor._id,
        height: data.height,
        weight: data.weight,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate,
        temperature: data.temperature,
        diagnosis: data.diagnosis,
        clinicalNotes: data.clinicalNotes,
        createdAt: data.date
      });

      // Create Prescriptions & Calculate total pharmacy amount
      let pharmacyTotal = 0;
      const invoiceDetailsData = [];

      for (const item of data.medicines) {
        await Prescription.create({
          recordId: record._id,
          medicineId: item.med._id,
          quantity: item.qty,
          dosage: item.dosage,
          frequency: item.freq,
          durationDays: item.duration,
          specialInstructions: item.inst,
          createdAt: data.date
        });

        const sub = item.qty * item.med.unitPrice;
        pharmacyTotal += sub;

        invoiceDetailsData.push({
          medicineId: item.med._id,
          quantity: item.qty,
          unitPrice: item.med.unitPrice,
          subTotal: sub,
        });

        // Deduct stock quantity
        item.med.stockQuantity -= item.qty;
        await item.med.save();
      }

      // Create Invoices (Consultation & Pharmacy)
      await Invoice.create({
        invoiceType: 'Consultation',
        appointmentId: appt._id,
        patientId: data.patient._id,
        totalAmount: data.doctor.baseFee || 250000,
        status: 'Paid',
        issuedAt: data.date,
        paidAt: data.date,
        processedBy: accountantUser._id,
      });

      if (pharmacyTotal > 0) {
        const pharmInv = await Invoice.create({
          invoiceType: 'Pharmacy',
          appointmentId: appt._id,
          patientId: data.patient._id,
          totalAmount: pharmacyTotal,
          status: 'Paid',
          issuedAt: data.date,
          paidAt: data.date,
          processedBy: accountantUser._id,
        });

        for (const detail of invoiceDetailsData) {
          await Invoice_Detail.create({
            invoiceId: pharmInv._id,
            medicineId: detail.medicineId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            subTotal: detail.subTotal,
            createdAt: data.date
          });
        }
      }
    }

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nTest Accounts:');
    console.log('Admin: 0901234567 / admin123');
    console.log('Doctor: 0911111111 / doctor123');
    console.log('Staff: 0913333333 / staff123');
    console.log('Accountant: 0915555555 / accountant123');
    console.log('Patient: 0914444444 / patient123');

    await mongoose.disconnect();
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
