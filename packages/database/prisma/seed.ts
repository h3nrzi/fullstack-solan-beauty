import 'dotenv/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaClient, StaffRole, SecurityEventType, RecoveryRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to hash recovery codes with SHA-256
function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

interface SeedStaffDefinition {
  username: string;
  fullName: string;
  phone: string;
  role: StaffRole;
  mfaSecret: string;
  recoveryCodes: string[];
}

const DEFAULT_PASSWORD = 'Salon@123456';

const SEED_STAFF: SeedStaffDefinition[] = [
  {
    username: 'zahra_modir',
    fullName: 'زهرا مدیر',
    phone: '09121111111',
    role: StaffRole.MANAGER,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    recoveryCodes: ['MGR1-A1B2-C3D4', 'MGR1-E5F6-G7H8', 'MGR1-I9J0-K1L2'],
  },
  {
    username: 'sara_modir',
    fullName: 'سارا مدیر',
    phone: '09122222222',
    role: StaffRole.MANAGER,
    mfaSecret: 'JBSWY3DPEHPK3PXQ',
    recoveryCodes: ['MGR2-B2C3-D4E5', 'MGR2-F6G7-H8I9', 'MGR2-J0K1-L2M3'],
  },
  {
    username: 'niloofar_paziresh',
    fullName: 'نیلوفر پذیرشی',
    phone: '09123333333',
    role: StaffRole.RECEPTIONIST,
    mfaSecret: 'JBSWY3DPEHPK3PXR',
    recoveryCodes: ['RCP1-C3D4-E5F6', 'RCP1-G7H8-I9J0', 'RCP1-K1L2-M3N4'],
  },
  {
    username: 'maryam_hesabdar',
    fullName: 'مریم حسابدار',
    phone: '09124444444',
    role: StaffRole.ACCOUNTANT,
    mfaSecret: 'JBSWY3DPEHPK3PXS',
    recoveryCodes: ['ACC1-D4E5-F6G7', 'ACC1-H8I9-J0K1', 'ACC1-L2M3-N4O5'],
  },
  {
    username: 'mahsa_artist',
    fullName: 'مهسا کریمی (آرتیست رنگ و لایت)',
    phone: '09125555555',
    role: StaffRole.ARTIST,
    mfaSecret: 'JBSWY3DPEHPK3PXT',
    recoveryCodes: ['ART1-E5F6-G7H8', 'ART1-I9J0-K1L2', 'ART1-M3N4-O5P6'],
  },
  {
    username: 'elham_artist',
    fullName: 'الهام رضایی (آرتیست میکاپ و عروس)',
    phone: '09126666666',
    role: StaffRole.ARTIST,
    mfaSecret: 'JBSWY3DPEHPK3PXU',
    recoveryCodes: ['ART2-F6G7-H8I9', 'ART2-J0K1-L2M3', 'ART2-N4O5-P6Q7'],
  },
];

async function main() {
  console.log('🌱 شروع مقداردهی اولیه پایگاه داده (Seeding Database)...\n');

  const passwordHash = await argon2.hash(DEFAULT_PASSWORD);

  const seededStaffRecords = [];

  for (const staffDef of SEED_STAFF) {
    // 1. Upsert Staff (Idempotent)
    const staff = await prisma.staff.upsert({
      where: { username: staffDef.username },
      update: {
        fullName: staffDef.fullName,
        phone: staffDef.phone,
        role: staffDef.role,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: staffDef.mfaSecret,
        isActive: true,
      },
      create: {
        username: staffDef.username,
        fullName: staffDef.fullName,
        phone: staffDef.phone,
        role: staffDef.role,
        passwordHash,
        mfaEnabled: true,
        mfaSecret: staffDef.mfaSecret,
        isActive: true,
      },
    });

    // 2. Re-create recovery codes idempotently
    await prisma.recoveryCode.deleteMany({
      where: { staffId: staff.id },
    });

    await prisma.recoveryCode.createMany({
      data: staffDef.recoveryCodes.map((code) => ({
        staffId: staff.id,
        codeHash: hashRecoveryCode(code),
      })),
    });

    // 3. Seed an initial audit log record for creation/audit readiness
    await prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.LOGIN_SUCCESS,
        details: {
          note: 'مقداردهی اولیه توسط سیدر دیتابیس',
          username: staff.username,
          role: staff.role,
        },
        ipAddress: '127.0.0.1',
      },
    });

    seededStaffRecords.push({
      ...staffDef,
      id: staff.id,
    });
  }

  // 4. Seed a sample Independent Recovery Request for testing multi-manager recovery flow
  const manager1 = seededStaffRecords.find((s) => s.username === 'zahra_modir');
  const manager2 = seededStaffRecords.find((s) => s.username === 'sara_modir');

  if (manager1 && manager2) {
    // Clear any previous mock recovery requests for these test users
    await prisma.independentRecoveryRequest.deleteMany({
      where: { targetStaffId: manager1.id },
    });

    await prisma.independentRecoveryRequest.create({
      data: {
        targetStaffId: manager1.id,
        requesterNote: 'درخواست بازیابی اضطراری به علت عدم دسترسی موقت به گوشی عامل MFA',
        status: RecoveryRequestStatus.PENDING,
      },
    });
  }

  console.log('✅ مقداردهی اولیه پایگاه داده با موفقیت انجام شد:\n');
  console.table(
    seededStaffRecords.map((s) => ({
      'نام کاربری (Username)': s.username,
      'نقش (Role)': s.role,
      'نام پرسنل (Full Name)': s.fullName,
      'رمز عبور پیش‌فرض': DEFAULT_PASSWORD,
      'کد محرمانه TOTP': s.mfaSecret,
      'نمونه کد بازیابی': s.recoveryCodes[0],
    })),
  );

  console.log('\n💡 راهنمای ورود و تست:');
  console.log('۱. رمز عبور پیش‌فرض تمام کاربران: ' + DEFAULT_PASSWORD);
  console.log('۲. کدهای محرمانه TOTP در اپلیکیشن‌های اعتبارسنجی (مانند Google Authenticator) قابل استفاده هستند.');
  console.log('۳. نمونه کدهای بازیابی یک‌بارمصرف برای ورود در شرایط اضطراری آماده استفاده‌اند.\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطا در اجرای سیدر پایگاه داده:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
