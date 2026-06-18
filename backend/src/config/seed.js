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
      try {
        await mongoose.connection.collection('servicepackages').deleteMany({});
      } catch (err) {
        // ignore if collection does not exist
      }
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
      { roleName: 'admin', description: 'Administrator' },
      { roleName: 'doctor', description: 'Doctor' },
      { roleName: 'staff', description: 'Customer Care Staff' },
      { roleName: 'accountant', description: 'Accountant' },
      { roleName: 'patient', description: 'Patient' },
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
      isRegistered: true,
    });
    console.log('✓ Created admin user');

    // 3. Create Departments (9 specialties)
    const departmentsData = [
      {
        departmentName: 'General Medicine',
        description: 'Diagnosis, screening and medical treatment of chronic diseases such as diabetes, blood pressure, and stomach issues in adults.'
      },
      {
        departmentName: 'General Surgery',
        description: 'Clinical surgical examination, consulting on minor surgeries, and treatment of wounds and soft tissue injuries.'
      },
      {
        departmentName: 'Pediatrics',
        description: 'Examination and treatment of neonatal and pediatric conditions, consulting on developmental nutrition, and periodic childhood vaccination tracking.'
      },
      {
        departmentName: 'Obstetrics & Gynecology',
        description: 'Comprehensive maternity management, 4D fetal screening ultrasounds, periodic gynecological examinations, and early cervical cancer screening.'
      },
      {
        departmentName: 'Otorhinolaryngology (ENT)',
        description: 'Diagnostic endoscopy, treatment of sinusitis, otitis media, sore throat, and acute upper respiratory tract infections.'
      },
      {
        departmentName: 'Odonto-Stomatology (Dental)',
        description: 'Comprehensive dental care, tartar removal, painless wisdom tooth extraction, cosmetic fillings, and advanced braces.'
      },
      {
        departmentName: 'Dermatology',
        description: 'Examination and treatment of skin diseases, eczema, psoriasis, acne, and consulting on restoring damaged skin barriers.'
      },
      {
        departmentName: 'Traditional Medicine',
        description: 'Combining the essence of Eastern and Western medicine: acupuncture, acupressure, and herbal steam for rehabilitation and musculoskeletal therapy.'
      },
      {
        departmentName: 'Cardiology',
        description: 'Color Doppler echocardiography, electrocardiograms (ECG), screening for atherosclerosis, and effective stroke prevention.'
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
        title: 'Basic Health Examination Package',
        desc: 'General health assessment of respiratory, circulatory, liver, kidney systems and basic blood tests.',
        price: '750,000 VND',
        period: 'per exam',
        featured: false,
        benefits: [
          'General clinical examination',
          'Vital signs measurement (blood pressure, heart rate)',
          'Complete blood count & fasting glucose',
          'Liver function evaluation (AST, ALT)',
          'Kidney function evaluation (Urea, Creatinin)',
          'Results consultation with specialist doctors'
        ],
        deptKeyword: 'medicine'
      },
      {
        id: 'screening',
        icon: '𫠀',
        title: 'Cardiovascular & Pathology Screening Package',
        desc: 'Specialized screening for coronary heart disease, hypertension, blood lipids and early cancer screening indicators.',
        price: '2,500,000 VND',
        period: 'per exam',
        featured: true,
        badge: 'Best Seller',
        benefits: [
          'All basic package services',
          'Advanced color Doppler echocardiography',
          'Electrocardiogram (ECG) to detect arrhythmia',
          'Complete blood lipid panel (Cholesterol, LDL, HDL)',
          'Cancer screening markers for liver, lung, stomach',
          'Digital chest X-ray'
        ],
        deptKeyword: 'cardiology'
      },
      {
        id: 'pediatric',
        icon: '👶',
        title: 'Comprehensive Pediatric Examination Package',
        desc: 'Periodic health examination for children, monitoring developmental milestones, nutritional checks and vaccination consult.',
        price: '400,000 VND',
        period: 'per exam',
        featured: false,
        benefits: [
          'Pediatric general health check',
          'Physical development milestone assessment',
          'Nutrition check and consultation',
          'Screening for common pediatric diseases',
          'Support with medical vaccination schedule',
          'Complimentary baby health tracker handbook'
        ],
        deptKeyword: 'pediatrics'
      },
      {
        id: 'vip',
        icon: '💎',
        title: 'VIP Healthcare Care Package',
        desc: 'Priority examination without waiting, private consultation with the Head of Department, premium business lounge.',
        price: '1,800,000 VND',
        period: 'per exam',
        featured: false,
        benefits: [
          'Fast-track priority visit without queuing',
          'Direct examination with Head/Deputy of clinical departments',
          'VIP Lounge amenities access',
          'Complimentary tea, coffee & light snacks',
          'Extended specialized doctor consultation time',
          'Fast results delivery to home'
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
      { username: '0911111111', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.hung@clinic.com', phone: '0911111111', isActive: true, isRegistered: true },
      { username: '0912222222', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.linh@clinic.com', phone: '0912222222', isActive: true, isRegistered: true },
      { username: '0910000001', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.an@clinic.com', phone: '0910000001', isActive: true, isRegistered: true },
      { username: '0910000002', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.nam@clinic.com', phone: '0910000002', isActive: true, isRegistered: true },
      { username: '0910000003', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.thuy@clinic.com', phone: '0910000003', isActive: true, isRegistered: true },
      { username: '0910000004', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.quochung@clinic.com', phone: '0910000004', isActive: true, isRegistered: true },
      { username: '0910000005', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.lien@clinic.com', phone: '0910000005', isActive: true, isRegistered: true },
      { username: '0910000006', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.minh@clinic.com', phone: '0910000006', isActive: true, isRegistered: true },
      { username: '0910000007', passwordHash: doctorPasswordHash, roleId: doctorRole._id, email: 'dr.dung@clinic.com', phone: '0910000007', isActive: true, isRegistered: true }
    ];

    const doctorUsers = await User.insertMany(doctorUsersData);

    const doctorsData = [
      {
        userId: doctorUsers[0]._id,
        fullName: 'Assoc. Prof. Dr. Tran Van Hung',
        specialization: 'Cardiology & Intervention',
        departmentId: departments.find(d => d.departmentName === 'Cardiology')._id,
        experienceYears: 18,
        baseFee: 350000,
        qualifications: 'Associate Professor, Doctor of Medicine - University of Medicine and Pharmacy, HCMC',
        bio: 'Assoc. Prof. Dr. Tran Van Hung is a leading expert in Cardiology with over 18 years of experience at the National Heart Institute. He specializes in screening hypertension, cardiac arrhythmia, and preventing cerebrovascular accidents.',
        avatarURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[1]._id,
        fullName: 'Dr. Pham Thi Linh (M.Sc.)',
        specialization: 'Pediatric Nutrition & Pathology',
        departmentId: departments.find(d => d.departmentName === 'Pediatrics')._id,
        experienceYears: 12,
        baseFee: 250000,
        qualifications: 'Master of Pediatrics - Hanoi Medical University',
        bio: 'Dr. Pham Thi Linh is highly loved by young patients for her warm and gentle clinic style. She specializes in treating pediatric respiratory illnesses, rickets, anorexia, and tracking comprehensive physical development.',
        avatarURL: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[2]._id,
        fullName: 'Dr. Nguyen Van An (Specialist II)',
        specialization: 'General Medicine & Stroke Prevention',
        departmentId: departments.find(d => d.departmentName === 'General Medicine')._id,
        experienceYears: 22,
        baseFee: 300000,
        qualifications: 'Specialist Level II Doctor - University of Medicine and Pharmacy, HCMC',
        bio: 'Dr. Nguyen Van An has extensive clinical knowledge in detecting and managing chronic geriatric conditions such as Type 2 Diabetes, essential hypertension, gout, and gastroduodenal diseases.',
        avatarURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[3]._id,
        fullName: 'Dr. Le Hoang Nam (M.Sc.)',
        specialization: 'Gastrointestinal & Hepatobiliary Surgery',
        departmentId: departments.find(d => d.departmentName === 'General Surgery')._id,
        experienceYears: 15,
        baseFee: 280000,
        qualifications: 'Master of Surgery - Cho Ray Hospital',
        bio: 'Dr. Le Hoang Nam specializes in diagnosing and providing appropriate surgical indications for patients with gallstones, acute hemorrhoids, inguinal hernia, and performing soft tissue wound closure with high-aesthetic absorbable sutures.',
        avatarURL: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[4]._id,
        fullName: 'Dr. Mai Thu Thuy (Specialist I)',
        specialization: 'Obstetrics & Gynecology & 4D Ultrasound',
        departmentId: departments.find(d => d.departmentName === 'Obstetrics & Gynecology')._id,
        experienceYears: 14,
        baseFee: 300000,
        qualifications: 'Specialist Level I Doctor in Obstetrics & Gynecology - Pham Ngoc Thach University of Medicine',
        bio: 'Dr. Mai Thu Thuy specializes in healthy pregnancy management, performing 4D fetal screening ultrasounds, and advising on painless delivery methods and family planning.',
        avatarURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[5]._id,
        fullName: 'Dr. Vuong Quoc Hung',
        specialization: 'Endoscopy & Otorhinolaryngology Treatment',
        departmentId: departments.find(d => d.departmentName === 'Otorhinolaryngology (ENT)')._id,
        experienceYears: 9,
        baseFee: 200000,
        qualifications: 'General Practitioner - University of Medicine and Pharmacy, HCMC',
        bio: 'Dr. Vuong Quoc Hung is a dynamic and dedicated doctor specialized in diagnostic endoscopy. He specializes in treating acute otitis media, weather-induced allergic sinusitis, and removing airway/digestive tract foreign bodies.',
        avatarURL: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[6]._id,
        fullName: 'Dr. Do Kim Lien (M.Sc.)',
        specialization: 'Odonto-Stomatology & Cosmetic Dentistry',
        departmentId: departments.find(d => d.departmentName === 'Odonto-Stomatology (Dental)')._id,
        experienceYears: 10,
        baseFee: 220000,
        qualifications: 'Master of Odonto-Stomatology - University of Medicine and Pharmacy, HCMC',
        bio: 'Dr. Do Kim Lien is highly skilled in painless wisdom tooth extraction using Piezotome ultrasound, composite cosmetic fillings, and high-end porcelain tooth restoration.',
        avatarURL: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[7]._id,
        fullName: 'Dr. Hoang Duc Minh',
        specialization: 'Dermatology & Skin Aesthetics',
        departmentId: departments.find(d => d.departmentName === 'Dermatology')._id,
        experienceYears: 11,
        baseFee: 250000,
        qualifications: 'Dermatologist - Hai Phong University of Medicine and Pharmacy',
        bio: 'Dr. Hoang Duc Minh specializes in treating eczema, psoriasis, severe cystic acne, and designing recovery regimens for skin damaged by corticosteroid-containing creams.',
        avatarURL: 'https://images.unsplash.com/photo-1637059824899-a441006a6875?q=80&w=300&auto=format&fit=crop',
        isActive: true
      },
      {
        userId: doctorUsers[8]._id,
        fullName: 'Dr. Lam Chi Dung (Specialist II)',
        specialization: 'Acupuncture & Traditional Medicine',
        departmentId: departments.find(d => d.departmentName === 'Traditional Medicine')._id,
        experienceYears: 25,
        baseFee: 300000,
        qualifications: 'Specialist Level II Doctor in Traditional Medicine',
        bio: 'With 25 years of dedication to traditional medicine, Dr. Lam Chi Dung has master-level skills in acupuncture, moxibustion, and acupressure. He has helped thousands of patients recover from stroke and herniated discs.',
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
      isRegistered: true,
    });

    await Staff.create({
      userId: staffUser._id,
      fullName: 'Hoa Thi Nguyen',
      position: 'Customer Care',
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
      isRegistered: true,
    });

    await Staff.create({
      userId: accountantUser._id,
      fullName: 'Ke Toan Tran',
      position: 'Accountant',
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
      isRegistered: true,
    });

    await Patient.create({
      userId: patientUser._id,
      fullName: 'Le Van Minh',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Nam',
      identityCard: '123456789012',
      phoneNumber: '0914444444',
      address: 'District 5, Ho Chi Minh City',
    });
    console.log('✓ Created patient');

    // Extra patients
    const extraPatientsData = [
      { username: '0914000001', email: 'lan.nguyen@example.com', phone: '0914000001', fullName: 'Lan Thi Nguyen', dateOfBirth: new Date('1985-08-20'), gender: 'Nữ', identityCard: '123456789013', address: 'District 1, Ho Chi Minh City' },
      { username: '0914000002', email: 'hoang.tran@example.com', phone: '0914000002', fullName: 'Hoang Minh Tran', dateOfBirth: new Date('1995-12-10'), gender: 'Nam', identityCard: '123456789014', address: 'District 3, Ho Chi Minh City' },
      { username: '0914000003', email: 'huong.pham@example.com', phone: '0914000003', fullName: 'Huong Thanh Pham', dateOfBirth: new Date('1992-03-25'), gender: 'Nữ', identityCard: '123456789015', address: 'Binh Thanh District, Ho Chi Minh City' },
      { username: '0914000004', email: 'tuan.hoang@example.com', phone: '0914000004', fullName: 'Tuan Anh Hoang', dateOfBirth: new Date('1978-11-05'), gender: 'Nam', identityCard: '123456789016', address: 'Tan Binh District, Ho Chi Minh City' },
      { username: '0914000005', email: 'mai.vu@example.com', phone: '0914000005', fullName: 'Mai Thi Vu', dateOfBirth: new Date('2000-07-15'), gender: 'Nữ', identityCard: '123456789017', address: 'Phu Nhuan District, Ho Chi Minh City' },
      { username: '0914000006', email: 'dung.do@example.com', phone: '0914000006', fullName: 'Dung Hung Do', dateOfBirth: new Date('1988-02-28'), gender: 'Nam', identityCard: '123456789018', address: 'Go Vap District, Ho Chi Minh City' },
      { username: '0914000007', email: 'triet.bui@example.com', phone: '0914000007', fullName: 'Triet Minh Bui', dateOfBirth: new Date('1965-05-18'), gender: 'Nam', identityCard: '123456789019', address: 'District 7, Ho Chi Minh City' },
      { username: '0914000008', email: 'trang.ngo@example.com', phone: '0914000008', fullName: 'Trang Thu Ngo', dateOfBirth: new Date('1993-09-09'), gender: 'Nữ', identityCard: '123456789020', address: 'Thu Duc City, Ho Chi Minh City' },
      { username: '0914000009', email: 'nam.le@example.com', phone: '0914000009', fullName: 'Nam Hoai Le', dateOfBirth: new Date('1980-04-30'), gender: 'Nam', identityCard: '123456789021', address: 'District 10, Ho Chi Minh City' },
      { username: '0914000010', email: 'yen.nguyen@example.com', phone: '0914000010', fullName: 'Yen Hai Nguyen', dateOfBirth: new Date('1997-01-22'), gender: 'Nữ', identityCard: '123456789022', address: 'Binh Tan District, Ho Chi Minh City' },
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
      { medicineCode: 'MED001', medicineName: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', usageRoute: 'Uống', unit: 'tablet', unitPrice: 2000, stockQuantity: 500, isActive: true },
      { medicineCode: 'MED002', medicineName: 'Amoxicillin 500mg', activeIngredient: 'Amoxicillin', usageRoute: 'Uống', unit: 'tablet', unitPrice: 5000, stockQuantity: 200, isActive: true },
      { medicineCode: 'MED003', medicineName: 'Ibuprofen 400mg', activeIngredient: 'Ibuprofen', usageRoute: 'Uống', unit: 'tablet', unitPrice: 3000, stockQuantity: 300, isActive: true },
      { medicineCode: 'MED004', medicineName: 'Cetirizine 10mg', activeIngredient: 'Cetirizine', usageRoute: 'Uống', unit: 'tablet', unitPrice: 1500, stockQuantity: 400, isActive: true },
      { medicineCode: 'MED005', medicineName: 'Metformin 850mg', activeIngredient: 'Metformin', usageRoute: 'Uống', unit: 'tablet', unitPrice: 4000, stockQuantity: 250, isActive: true },
      { medicineCode: 'MED006', medicineName: 'Atorvastatin 20mg', activeIngredient: 'Atorvastatin', usageRoute: 'Uống', unit: 'tablet', unitPrice: 8000, stockQuantity: 150, isActive: true },
      { medicineCode: 'MED007', medicineName: 'Salbutamol 2mg', activeIngredient: 'Salbutamol', usageRoute: 'Uống', unit: 'tablet', unitPrice: 2500, stockQuantity: 200, isActive: true },
      { medicineCode: 'MED008', medicineName: 'Omeprazole 20mg', activeIngredient: 'Omeprazole', usageRoute: 'Uống', unit: 'tablet', unitPrice: 3500, stockQuantity: 350, isActive: true },
      { medicineCode: 'MED009', medicineName: 'Gliclazide 60mg', activeIngredient: 'Gliclazide', usageRoute: 'Uống', unit: 'tablet', unitPrice: 4500, stockQuantity: 180, isActive: true },
      { medicineCode: 'MED010', medicineName: 'Amlodipine 5mg', activeIngredient: 'Amlodipine', usageRoute: 'Uống', unit: 'tablet', unitPrice: 3000, stockQuantity: 300, isActive: true },
      { medicineCode: 'MED011', medicineName: 'Losartan 50mg', activeIngredient: 'Losartan', usageRoute: 'Uống', unit: 'tablet', unitPrice: 6000, stockQuantity: 220, isActive: true },
      { medicineCode: 'MED012', medicineName: 'Augmentin 1g', activeIngredient: 'Amoxicillin + Clavulanate', usageRoute: 'Uống', unit: 'tablet', unitPrice: 15000, stockQuantity: 100, isActive: true },
      { medicineCode: 'MED013', medicineName: 'Telfast 180mg', activeIngredient: 'Fexofenadine', usageRoute: 'Uống', unit: 'tablet', unitPrice: 9000, stockQuantity: 120, isActive: true },
      { medicineCode: 'MED014', medicineName: 'Berberin 50mg', activeIngredient: 'Berberine', usageRoute: 'Uống', unit: 'tablet', unitPrice: 800, stockQuantity: 1000, isActive: true },
      { medicineCode: 'MED015', medicineName: 'Panadol Extra', activeIngredient: 'Paracetamol + Caffeine', usageRoute: 'Uống', unit: 'tablet', unitPrice: 3500, stockQuantity: 450, isActive: true },
      { medicineCode: 'MED016', medicineName: 'Vitamin C 500mg', activeIngredient: 'Ascorbic Acid', usageRoute: 'Uống', unit: 'tablet', unitPrice: 1200, stockQuantity: 800, isActive: true }
    ];

    const medicines = await Medicine.insertMany(medicinesData);
    console.log('✓ Created 16 standard medicines');

    // 8. Create sample posts for CMS (6+ posts with rich HTML and thumbnails)
    const postsData = [
      {
        title: 'Proactively Preventing Cardiovascular Disease in Hot Weather',
        slug: 'preventing-cardiovascular-disease-in-hot-weather',
        thumbnailURL: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Extreme summer heat is a dangerous risk factor that increases the risk of acute heart attacks, cardiac arrhythmias, and strokes in individuals with pre-existing medical conditions. According to Assoc. Prof. Dr. Tran Van Hung, high temperatures cause dehydration, which concentrates the blood and increases the workload on the circulatory system.</p>
          <p>To protect a healthy heart in hot weather, keep the following golden rules in mind:</p>
          <ul>
            <li><strong>Drink water regularly:</strong> Do not wait until you are thirsty to drink. Consume 2-2.5 liters of filtered water or light electrolyte drinks daily.</li>
            <li><strong>Limit outdoor activities during peak hours:</strong> Avoid outdoor activities from 10:00 AM to 4:00 PM to prevent heatstroke.</li>
            <li><strong>Keep air conditioning stable:</strong> Do not set the AC more than 7°C lower than the outdoor temperature to avoid sudden vascular constriction.</li>
            <li><strong>Manage blood pressure:</strong> Take maintenance medication on time as prescribed by your cardiologist; never stop medication on your own.</li>
          </ul>
          <p>If you experience symptoms like chest tightness, shortness of breath, dizziness, or cold sweats, proceed immediately to the nearest medical facility for emergency diagnosis and treatment.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-20'),
      },
      {
        title: 'Pediatric Dental Care: Common Mistakes to Avoid',
        slug: 'pediatric-dental-care-common-mistakes',
        thumbnailURL: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Many parents believe that because baby teeth will eventually fall out, they do not require meticulous care. This is a complete misconception. Dr. Do Kim Lien (M.Sc.), Head of Odonto-Stomatology, emphasizes that baby teeth play a crucial role in guiding the eruption of permanent teeth and child speech development.</p>
          <p>Common mistakes parents make:</p>
          <ol>
            <li><strong>Bottle feeding overnight:</strong> Sugars in milk cling to tooth enamel all night, causing rampant early childhood cavities (baby bottle tooth decay).</li>
            <li><strong>Using adult toothpaste:</strong> High fluoride levels can cause toxicity or stain permanent teeth.</li>
            <li><strong>Delaying dental visits:</strong> Children should have routine dental checkups every 6 months, starting from the eruption of their first baby tooth.</li>
          </ol>
          <p>Parents should assist in brushing their child's teeth twice daily using a soft-bristled toothbrush and a pea-sized amount of child-formulated toothpaste.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-18'),
      },
      {
        title: 'Scientific Nutrition Plan for Anorexic Children Under 5 Years Old',
        slug: 'scientific-nutrition-anorexic-children-under-5',
        thumbnailURL: 'https://images.unsplash.com/photo-1471286174574-e966813af344?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Appetite loss in children under 5 is a constant anxiety for parents. To address this issue effectively, Dr. Pham Thi Linh (M.Sc.) advises parents against forcing children to eat, which creates a psychological fear of meals.</p>
          <p>Build healthy eating habits with these tips:</p>
          <ul>
            <li><strong>Set fixed meal times:</strong> Keep a minimum 2-3 hour gap between meals and snacks so the child feels hungry.</li>
            <li><strong>Diversify the menu:</strong> Decorate dishes beautifully and colorfully to stimulate visual interest.</li>
            <li><strong>No distractions (no walking around, no TV/phones):</strong> Encourage focus on chewing and swallowing for better digestion.</li>
            <li><strong>Appropriate micronutrient supplements:</strong> Zinc, Lysine, and B vitamins naturally support appetite. Consult a pediatrician before use.</li>
          </ul>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-16'),
      },
      {
        title: 'The Importance of Periodic General Health Examinations',
        slug: 'importance-periodic-general-health-examinations',
        thumbnailURL: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Many dangerous diseases such as cancer, diabetes, kidney failure, and atherosclerosis develop silently with no early symptoms. Periodic general health checkups are key to early detection and successful treatment.</p>
          <p>Benefits of periodic general checkups:</p>
          <blockquote>
            Early detection increases treatment success rate up to 90%, minimizing hospitalization costs and recovery time.
          </blockquote>
          <p>The standard health examination process at Hop Son Tai Clinic includes: comprehensive clinical exams, blood biochemistry tests (blood glucose, lipids, liver/kidney functions), abdominal ultrasound, ECG, and digital chest X-ray.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-14'),
      },
      {
        title: 'Integrating Eastern and Western Medicine for Musculoskeletal Pain Treatment',
        slug: 'integrating-eastern-western-medicine-musculoskeletal-pain',
        thumbnailURL: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Neck pain, herniated discs, and knee osteoarthritis are increasingly common in younger office workers due to sedentary habits and poor posture. Dr. Lam Chi Dung (Specialist II) points out that integrating Eastern and Western medicine provides outstanding therapeutic effects, quickly relieving pain without overusing stomach-damaging painkillers.</p>
          <p>Key combined therapies include:</p>
          <ul>
            <li><strong>Modern Diagnosis:</strong> X-rays and MRI to precisely identify disc herniation or joint degeneration.</li>
            <li><strong>Acupuncture & Electro-acupuncture:</strong> Stimulates release of natural endorphins - the body's internal painkillers - to relax deep muscles.</li>
            <li><strong>Physical Therapy:</strong> Spinal traction and therapeutic ultrasound help restore natural joint mobility.</li>
          </ul>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-12'),
      },
      {
        title: 'Preventing and Treating Contact Dermatitis in Summer Weather',
        slug: 'preventing-treating-contact-dermatitis-summer',
        thumbnailURL: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Hot and humid summer weather, along with insect proliferation, easily causes skin irritation, redness, and severe itching. Dr. Hoang Duc Minh provides guidance on preventing and properly handling irritant contact dermatitis.</p>
          <p>First steps when skin contacts toxic insect fluids (like rove beetles):</p>
          <ol>
            <li><strong>Wash immediately with clean water:</strong> Absolutely do not scratch or pop blisters, as this spreads the fluid to healthy skin.</li>
            <li><strong>Use calming lotion or mild antiseptic:</strong> Gently dab on the affected area to soothe and sterilize the skin.</li>
            <li><strong>Avoid home remedies:</strong> Many patients apply herbal poultices, causing dangerous deep skin infections and necrosis.</li>
          </ol>
          <p>If large blisters, white pus, or mild fever occur, visit a dermatologist for appropriate topical anti-inflammatory prescriptions.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-05-10'),
      },
      {
        title: 'Medical Diet for Gout Patients: What to Eat and What to Avoid',
        slug: 'medical-diet-gout-patients-what-to-eat-avoid',
        thumbnailURL: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Diet plays a crucial role in controlling blood uric acid levels, reducing acute gout flare-ups, and preventing severe kidney complications. According to rheumatologists, adjusting your daily menu supports medical therapy effectively.</p>
          <h3>Core Nutritional Principles:</h3>
          <ul>
            <li><strong>Limit purine-rich foods:</strong> Avoid organ meats (liver, kidneys, tripe, heart), red meats (beef, goat), and certain seafood like herring, shrimp, and scallops.</li>
            <li><strong>Say no to alcohol:</strong> Alcohol blocks uric acid excretion by kidneys, making it a primary trigger for severe nighttime gout pain.</li>
            <li><strong>Drink plenty of water:</strong> Consume 2 - 2.5 liters of water daily (filtered or slightly alkaline water) to stimulate kidneys to excrete uric acid.</li>
            <li><strong>Prioritize plant protein and low-fat dairy:</strong> Choose tofu, healthy nuts, and low-fat yogurt/cheese to obtain sufficient nutrients without raising uric acid.</li>
          </ul>
          <p>In addition to diet, patients must take uric acid-lowering medications exactly as prescribed and follow up regularly.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-06-03'),
      },
      {
        title: 'Vestibular Disorders: Symptoms and Treatment Options',
        slug: 'vestibular-disorders-symptoms-treatment-options',
        thumbnailURL: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Vestibular disorders are common conditions caused by damage to the 8th cranial nerve or the balance pathways in the brain. They seriously affect balance and daily activities.</p>
          <h3>Typical Symptoms:</h3>
          <ul>
            <li><strong>Severe Vertigo:</strong> A spinning sensation when changing positions suddenly.</li>
            <li><strong>Loss of Balance:</strong> Unsteady walking, stumbling, and high risk of falling.</li>
            <li><strong>Tinnitus and Hearing Loss:</strong> A feeling of fullness or ringing/buzzing in the ears.</li>
            <li><strong>Nausea and Vomiting:</strong> Occurs due to autonomic nervous system overstimulation during vertigo episodes.</li>
          </ul>
          <h3>Medical Treatments:</h3>
          <p>Depending on whether the cause is peripheral or central, doctors prescribe vertigo-relieving medications (such as dimenhydrinate), circulation improvers (betahistine), or integrate traditional acupuncture to clear meridians. Maintaining a healthy lifestyle, reducing stress, and performing vestibular rehabilitation exercises are also critical.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-06-02'),
      },
      {
        title: 'Diabetes: Dangerous Complications and Proactive Prevention',
        slug: 'diabetes-dangerous-complications-proactive-prevention',
        thumbnailURL: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Diabetes is a chronic metabolic disease characterized by persistently high blood glucose levels due to insulin deficiency or insulin resistance. If poorly controlled, it silently damages organs throughout the body.</p>
          <h3>Dangerous Complications:</h3>
          <ul>
            <li><strong>Cardiovascular Complications:</strong> Increases the risk of atherosclerosis, myocardial infarction, and stroke by 2-4 times.</li>
            <li><strong>Kidney Complications:</strong> Damages small blood vessels in glomeruli, leading to end-stage chronic kidney disease requiring dialysis.</li>
            <li><strong>Eye Complications:</strong> Causes retinopathy, cataracts, and even blindness.</li>
            <li><strong>Neurological & Foot Complications:</strong> Causes numbness, tingling, and loss of pain sensation, leading to hard-to-heal infected ulcers and potential amputation.</li>
          </ul>
          <h3>Proactive Prevention:</h3>
          <p>To prevent and control diabetes, people should consume a diet low in refined carbohydrates, rich in fiber from vegetables, exercise at least 150 minutes per week, and perform routine screenings for fasting blood glucose and HbA1c every 6 months.</p>
        `,
        status: 'Published',
        publishedAt: new Date('2026-06-01'),
      },
      {
        title: 'Dengue Fever: Care Guidelines and Dangerous Warning Signs',
        slug: 'dengue-fever-care-guidelines-warning-signs',
        thumbnailURL: 'https://images.unsplash.com/photo-1584036561566-baf241f2c44e?q=80&w=600&auto=format&fit=crop',
        content: `
          <p>Dengue fever is an acute infectious disease caused by the Dengue virus transmitted through Aedes aegypti mosquitoes. The disease can worsen unexpectedly on days when fever subsides (typically days 3 to 7).</p>
          <h3>Safe Home Care:</h3>
          <ul>
            <li><strong>Correct Fever Management:</strong> Use only single-ingredient Paracetamol. Absolutely do not use Aspirin or Ibuprofen, as they worsen bleeding.</li>
            <li><strong>Continuous Rehydration:</strong> Drink plenty of properly mixed Oresols, coconut water, or orange juice to replenish lost electrolytes.</li>
            <li><strong>Bed Rest:</strong> Avoid strenuous physical activity to reduce the risk of internal bleeding.</li>
          </ul>
          <h3>Warning Signs Requiring Urgent Hospitalization:</h3>
          <p>Monitor closely and seek immediate emergency care if any of the following warning signs appear: Severe abdominal pain in the right upper quadrant, persistent vomiting, nosebleeds or bleeding gums, black stools, cold clammy limbs, lethargy, or restlessness.</p>
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

    // 10. Create appointments & medical history for the test patient
    const patientDoc = await Patient.findOne({ phoneNumber: '0914444444' });
    const firstDoctor = doctors[0];
    const todayDate = new Date(2026, 5, 4);
    todayDate.setHours(0, 0, 0, 0);
    const firstSchedule = createdSchedules.find(s =>
      s.doctorId.toString() === firstDoctor._id.toString() &&
      s.startTime === '08:00' &&
      s.workDate.getTime() === todayDate.getTime()
    );

    // Past visit: completed with medical record (shows in patient history)
    const pastVisitDate = new Date(todayDate);
    pastVisitDate.setDate(pastVisitDate.getDate() - 30);

    const pastAppointment = await Appointment.create({
      patientId: patientDoc._id,
      requestedDate: pastVisitDate,
      requestedTime: '09:00',
      symptoms: 'Mild chest tightness, shortness of breath during heavy exertion',
      departmentId: firstDoctor.departmentId,
      doctorId: firstDoctor._id,
      status: 'Completed',
      confirmedBy: staffUser._id,
    });

    const medicalRecord = await Medical_Record.create({
      appointmentId: pastAppointment._id,
      patientId: patientDoc._id,
      doctorId: firstDoctor._id,
      height: 172,
      weight: 68,
      bloodPressure: '135/85',
      heartRate: 82,
      temperature: 36.8,
      diagnosis: 'Mild stage 1 hypertension, suspected coronary atherosclerosis',
      clinicalNotes: 'Limit salt intake, reduce animal fats, follow-up examination in 1 month.',
    });
    console.log('✓ Created past medical record (patient history)');

    await Prescription.create({
      recordId: medicalRecord._id,
      medicineId: medicines[0]._id, // Paracetamol
      quantity: 10,
      dosage: '500mg',
      frequency: '2 times/day when in pain',
      durationDays: 5,
      specialInstructions: 'Take after meals',
    });
    console.log('✓ Created past prescription');

    // Today's visit: confirmed, waiting for doctor to create medical record
    const appointment = await Appointment.create({
      patientId: patientDoc._id,
      requestedDate: todayDate,
      requestedTime: '10:30',
      symptoms: 'Follow-up visit for blood pressure monitoring, vital signs measurement',
      departmentId: firstDoctor.departmentId,
      doctorId: firstDoctor._id,
      scheduleId: firstSchedule ? firstSchedule._id : undefined,
      status: 'Confirmed',
      confirmedBy: staffUser._id,
    });
    console.log('✓ Created today appointment (awaiting examination)');

    if (firstSchedule) {
      firstSchedule.currentBooked = 1;
      await firstSchedule.save();
    }

    // 11. Create invoices: consultation + pharmacy
    const accountantStaff = await Staff.findOne({ position: 'Accountant' });

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
      appointmentId: pastAppointment._id,
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
        patient: extraPatients[0], // Lan Thi Nguyen
        doctor: doctors.find(d => d.fullName.includes('Nguyen Van An')),
        date: new Date(2026, 5, 1),
        time: '09:00',
        startTime: '08:00',
        symptoms: 'Dull epigastric pain, heartburn, nausea after eating',
        height: 158,
        weight: 52,
        bloodPressure: '120/80',
        heartRate: 76,
        temperature: 36.5,
        diagnosis: 'Acute gastritis, gastroesophageal reflux disease (GERD)',
        clinicalNotes: 'Eat well-cooked food and drink boiled water, split into smaller meals, avoid spicy/hot foods and stimulants. Take medication on schedule.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED008'), qty: 14, dosage: '20mg', freq: '2 times/day, 30 mins before meals', duration: 7, inst: 'Take in the morning and evening' },
          { med: medicines.find(m => m.medicineCode === 'MED001'), qty: 10, dosage: '500mg', freq: '3 times/day when in pain', duration: 3, inst: 'Take after meals' }
        ]
      },
      {
        patient: extraPatients[1], // Hoang Minh Tran
        doctor: doctors.find(d => d.fullName.includes('Tran Van Hung')),
        date: new Date(2026, 5, 1),
        time: '14:30',
        startTime: '13:30',
        symptoms: 'Headache, mild dizziness, home blood pressure measured high (150/90)',
        height: 175,
        weight: 74,
        bloodPressure: '155/95',
        heartRate: 85,
        temperature: 36.6,
        diagnosis: 'Essential hypertension stage 2, dyslipidemia',
        clinicalNotes: 'Reduce salt in diet, practice gentle exercise for 30 minutes daily. Follow-up visit in 1 month.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED010'), qty: 30, dosage: '5mg', freq: '1 time/day', duration: 30, inst: 'Take in the morning after meals' },
          { med: medicines.find(m => m.medicineCode === 'MED006'), qty: 30, dosage: '20mg', freq: '1 time/day', duration: 30, inst: 'Take in the evening before bedtime' }
        ]
      },
      {
        patient: extraPatients[2], // Huong Thanh Pham
        doctor: doctors.find(d => d.fullName.includes('Hoang Đức Minh') || d.fullName.includes('Hoang Duc Minh')),
        date: new Date(2026, 5, 2),
        time: '10:00',
        startTime: '08:00',
        symptoms: 'Red streaks on the neck skin, small blisters, burning sensation suspected from rove beetle contact',
        height: 162,
        weight: 48,
        bloodPressure: '110/70',
        heartRate: 72,
        temperature: 36.7,
        diagnosis: 'Irritant contact dermatitis caused by insects',
        clinicalNotes: 'Avoid scratching, do not apply herbal leaves on your own. Wash gently with physiological saline before applying topical medication.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED004'), qty: 10, dosage: '10mg', freq: '1 time/day', duration: 10, inst: 'Take in the evening after meals' }
        ]
      },
      {
        patient: extraPatients[3], // Tuan Anh Hoang
        doctor: doctors.find(d => d.fullName.includes('Lam Chi Dũng') || d.fullName.includes('Lam Chi Dung')),
        date: new Date(2026, 5, 3),
        time: '15:30',
        startTime: '13:30',
        symptoms: 'Neck and shoulder pain radiating to the right arm, mild finger numbness',
        height: 170,
        weight: 70,
        bloodPressure: '130/80',
        heartRate: 78,
        temperature: 36.4,
        diagnosis: 'Acute neck and shoulder pain, mild cervical spine degeneration',
        clinicalNotes: 'Avoid sitting in one position for too long, perform gentle neck mobility exercises. Combine with acupuncture therapy.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED016'), qty: 20, dosage: '500mg', freq: '2 times/day', duration: 10, inst: 'Take after meals' }
        ]
      },
      {
        patient: extraPatients[4], // Mai Thi Vu
        doctor: doctors.find(d => d.fullName.includes('Vuong Quoc Hung')),
        date: new Date(2026, 5, 4),
        time: '09:30',
        startTime: '08:00',
        symptoms: 'Sore throat, difficulty swallowing, mild fever at 37.8°C, clear runny nose',
        height: 160,
        weight: 50,
        bloodPressure: '115/75',
        heartRate: 80,
        temperature: 37.8,
        diagnosis: 'Acute follicular pharyngitis, weather-induced allergic rhinitis',
        clinicalNotes: 'Gargle with warm physiological saline several times daily, drink plenty of warm water, keep neck warm.',
        medicines: [
          { med: medicines.find(m => m.medicineCode === 'MED002'), qty: 20, dosage: '500mg', freq: '2 times/day', duration: 10, inst: 'Take in the morning and evening after meals' },
          { med: medicines.find(m => m.medicineCode === 'MED001'), qty: 10, dosage: '500mg', freq: '2 times/day when fever is > 38.5°C', duration: 5, inst: 'Take 4-6 hours apart' }
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
