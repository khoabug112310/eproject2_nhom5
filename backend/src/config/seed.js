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

    // 3. Create Departments
    const departments = await Department.insertMany([
      { departmentName: 'Tổng quát', description: 'Khám tổng quát' },
      { departmentName: 'Tim mạch', description: 'Chuyên khoa tim mạch' },
      { departmentName: 'Nhi khoa', description: 'Khám bệnh trẻ em' },
      { departmentName: 'Nha khoa', description: 'Chuyên khoa nha khoa' },
    ]);
    console.log('✓ Created departments');

    // 4. Create Doctor Users & Doctors
    const doctorRole = roles.find(r => r.roleName === 'doctor');
    const doctorPasswordHash = await bcrypt.hash('doctor123', 10);
    const doctorUsers = await User.insertMany([
      {
        username: '0911111111',
        passwordHash: doctorPasswordHash,
        roleId: doctorRole._id,
        email: 'dr.hung@clinic.com',
        phone: '0911111111',
        isActive: true,
      },
      {
        username: '0912222222',
        passwordHash: doctorPasswordHash,
        roleId: doctorRole._id,
        email: 'dr.linh@clinic.com',
        phone: '0912222222',
        isActive: true,
      },
    ]);

    await Doctor.insertMany([
      {
        userId: doctorUsers[0]._id,
        fullName: 'Dr. Trần Văn Hùng',
        specialization: 'Tim mạch',
        departmentId: departments.find(d => d.departmentName === 'Tim mạch')._id,
        experienceYears: 10,
        baseFee: 300000,
        isActive: true,
      },
      {
        userId: doctorUsers[1]._id,
        fullName: 'Dr. Phạm Thị Linh',
        specialization: 'Nhi khoa',
        departmentId: departments.find(d => d.departmentName === 'Nhi khoa')._id,
        experienceYears: 8,
        baseFee: 250000,
        isActive: true,
      },
    ]);
    console.log('✓ Created doctors');

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
      address: 'Hà Nội',
    });
    console.log('✓ Created patient');

    // 7. Create Medicines
    const medicines = await Medicine.insertMany([
      {
        medicineCode: 'MED001',
        medicineName: 'Paracetamol 500mg',
        activeIngredient: 'Paracetamol',
        usageRoute: 'Uống',
        unit: 'viên',
        unitPrice: 2000,
        stockQuantity: 500,
        isActive: true,
      },
      {
        medicineCode: 'MED002',
        medicineName: 'Amoxicillin 500mg',
        activeIngredient: 'Amoxicillin',
        usageRoute: 'Uống',
        unit: 'viên',
        unitPrice: 5000,
        stockQuantity: 200,
        isActive: true,
      },
    ]);
    console.log('✓ Created medicines');

    // 8b. Create sample posts for CMS
    await Post.insertMany([
      {
        title: 'Khai trương Phòng khám Hợp Sơn Tài',
        slug: 'khai-truong-phong-kham-hop-son-tai',
        thumbnailURL: '',
        content: 'Chúng tôi hân hạnh thông báo khai trương phòng khám với đội ngũ chuyên môn cao.',
        status: 'Published',
        publishedAt: new Date(),
      },
      {
        title: 'Hướng dẫn phòng chống cảm cúm mùa hè',
        slug: 'huong-dan-phong-chong-cam-cum',
        thumbnailURL: '',
        content: 'Những biện pháp đơn giản để bảo vệ bản thân và gia đình.',
        status: 'Published',
        publishedAt: new Date(),
      },
      {
        title: 'Khuyến mãi khám sức khỏe tổng quát',
        slug: 'khuyen-mai-kham-tong-quat',
        thumbnailURL: '',
        content: 'Ưu đãi gói khám tổng quát trong tháng đầu khai trương.',
        status: 'Published',
        publishedAt: new Date(),
      },
    ]);
    console.log('✓ Created sample posts');

    // 8. Create a schedule for first doctor
    const firstDoctor = await Doctor.findOne();
    const schedule = await Doctor_Schedule.create({
      doctorId: firstDoctor._id,
      workDate: new Date(),
      startTime: '08:00',
      endTime: '12:00',
      maxPatients: 10,
      currentBooked: 0,
      status: 'Available',
    });
    console.log('✓ Created doctor schedule');

    // 9. Create an appointment, medical record and prescription for the patient
    const patientDoc = await Patient.findOne({ phoneNumber: '0914444444' });
    const dept = await Department.findOne();
    const appointment = await Appointment.create({
      patientId: patientDoc._id,
      requestedDate: new Date(),
      requestedTime: '09:00',
      symptoms: 'Sốt, ho',
      departmentId: dept._id,
      doctorId: firstDoctor._id,
      scheduleId: schedule._id,
      status: 'Confirmed',
      confirmedBy: staffUser._id,
    });
    console.log('✓ Created appointment');

    const medicalRecord = await Medical_Record.create({
      appointmentId: appointment._id,
      patientId: patientDoc._id,
      doctorId: firstDoctor._id,
      height: 170,
      weight: 70,
      bloodPressure: '120/80',
      heartRate: 78,
      temperature: 37.5,
      diagnosis: 'Nhiễm virus đường hô hấp nhẹ',
      clinicalNotes: 'Nghỉ ngơi, uống nhiều nước',
    });
    console.log('✓ Created medical record');

    const prescription = await Prescription.create({
      recordId: medicalRecord._id,
      medicineId: medicines[0]._id,
      quantity: 10,
      dosage: '500mg',
      frequency: '3 lần/ngày',
      durationDays: 3,
      specialInstructions: 'Uống sau ăn',
    });
    console.log('✓ Created prescription');

    // 10. Create invoices: consultation + pharmacy
    const accountantStaff = await Staff.findOne({ position: 'Kế toán' });

    // Ensure old unique index on appointmentId is removed (safe to run)
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
      totalAmount: firstDoctor.baseFee || 300000,
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
