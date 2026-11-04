import 'dotenv/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
  PrismaClient,
  StaffRole,
  SecurityEventType,
  RecoveryRequestStatus,
  ServicePriceType,
  ArtistLevel,
  ContractStatus,
  BookingStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper to hash recovery codes and OTPs with SHA-256
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
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
const DEMO_CUSTOMER_OTP = '123456';

const SEED_STAFF: SeedStaffDefinition[] = [
  {
    username: 'zahra_modir',
    fullName: 'زهرا مدیر (مدیر ارشد)',
    phone: '09121111111',
    role: StaffRole.MANAGER,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    recoveryCodes: ['MGR1-A1B2-C3D4', 'MGR1-E5F6-G7H8', 'MGR1-I9J0-K1L2'],
  },
  {
    username: 'sara_modir',
    fullName: 'سارا مدیر (مدیر داخلی و ناظر)',
    phone: '09122222222',
    role: StaffRole.MANAGER,
    mfaSecret: 'JBSWY3DPEHPK3PXQ',
    recoveryCodes: ['MGR2-B2C3-D4E5', 'MGR2-F6G7-H8I9', 'MGR2-J0K1-L2M3'],
  },
  {
    username: 'niloofar_paziresh',
    fullName: 'نیلوفر پذیرشی (مسئول پذیرش و نوبت‌دهی)',
    phone: '09123333333',
    role: StaffRole.RECEPTIONIST,
    mfaSecret: 'JBSWY3DPEHPK3PXR',
    recoveryCodes: ['RCP1-C3D4-E5F6', 'RCP1-G7H8-I9J0', 'RCP1-K1L2-M3N4'],
  },
  {
    username: 'maryam_hesabdar',
    fullName: 'مریم حسابدار (امور مالی و کمیسیون‌ها)',
    phone: '09124444444',
    role: StaffRole.ACCOUNTANT,
    mfaSecret: 'JBSWY3DPEHPK3PXS',
    recoveryCodes: ['ACC1-D4E5-F6G7', 'ACC1-H8I9-J0K1', 'ACC1-L2M3-N4O5'],
  },
  {
    username: 'mahsa_artist',
    fullName: 'مهسا کریمی (آرتیست ارشد رنگ و لایت)',
    phone: '09125555555',
    role: StaffRole.ARTIST,
    mfaSecret: 'JBSWY3DPEHPK3PXT',
    recoveryCodes: ['ART1-E5F6-G7H8', 'ART1-I9J0-K1L2', 'ART1-M3N4-O5P6'],
  },
  {
    username: 'elham_artist',
    fullName: 'الهام رضایی (استادکار میکاپ و عروس)',
    phone: '09126666666',
    role: StaffRole.ARTIST,
    mfaSecret: 'JBSWY3DPEHPK3PXU',
    recoveryCodes: ['ART2-F6G7-H8I9', 'ART2-J0K1-L2M3', 'ART2-N4O5-P6Q7'],
  },
  {
    username: 'sahar_artist',
    fullName: 'سحر ناصری (آرتیست کوتاهی و براشینگ)',
    phone: '09127777771',
    role: StaffRole.ARTIST,
    mfaSecret: 'JBSWY3DPEHPK3PXV',
    recoveryCodes: ['ART3-G7H8-I9J0', 'ART3-K1L2-M3N4', 'ART3-O5P6-Q7R8'],
  },
  {
    username: 'fatemeh_artist',
    fullName: 'فاطمه حسینی (آرتیست فیشیال و اسکین‌کر)',
    phone: '09128888881',
    role: StaffRole.ARTIST,
    mfaSecret: 'JBSWY3DPEHPK3PXW',
    recoveryCodes: ['ART4-H8I9-J0K1', 'ART4-L2M3-N4O5', 'ART4-P6Q7-R8S9'],
  },
];

async function main() {
  console.log('🌱 شروع مقداردهی اولیه پایگاه داده سالن زیبایی (Seeding Database)...\n');

  console.log('🧹 ۱. پاکسازی داده‌های پیشین برای تضمین تکرارپذیری اتمیک...');
  await prisma.serviceBookingResourceAllocation.deleteMany();
  await prisma.serviceBooking.deleteMany();
  await prisma.servicePhase.deleteMany();
  await prisma.sharedResource.deleteMany();
  await prisma.workingShift.deleteMany();
  await prisma.artistLeave.deleteMany();
  await prisma.artistServiceTariff.deleteMany();
  await prisma.commissionContract.deleteMany();
  await prisma.artistProfile.deleteMany();
  await prisma.service.deleteMany();
  await prisma.customerSession.deleteMany();
  await prisma.customerOtp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.recoveryCode.deleteMany();
  await prisma.independentRecoveryRequest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.staff.deleteMany();

  const passwordHash = await argon2.hash(DEFAULT_PASSWORD);

  // -------------------------------------------------------------
  // ۱. کارکنان و احراز هویت (Staff & Auth - Ticket 01)
  // -------------------------------------------------------------
  console.log('👤 ۲. ایجاد حساب‌های کاربری پرسنل و کدهای بازیابی...');
  const staffMap = new Map<string, any>();

  for (const staffDef of SEED_STAFF) {
    const staff = await prisma.staff.create({
      data: {
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

    await prisma.recoveryCode.createMany({
      data: staffDef.recoveryCodes.map((code) => ({
        staffId: staff.id,
        codeHash: sha256(code),
      })),
    });

    await prisma.auditLog.create({
      data: {
        staffId: staff.id,
        eventType: SecurityEventType.LOGIN_SUCCESS,
        details: {
          note: 'مقداردهی اولیه پرسنل توسط سیدر دیتابیس',
          username: staff.username,
          role: staff.role,
        },
        ipAddress: '127.0.0.1',
      },
    });

    staffMap.set(staffDef.username, { ...staffDef, id: staff.id });
  }

  // درخواست بازیابی مستقل معلق نمونه (تست جریان بازیابی چندمدیریتی)
  const manager1 = staffMap.get('zahra_modir');
  const manager2 = staffMap.get('sara_modir');
  if (manager1 && manager2) {
    await prisma.independentRecoveryRequest.create({
      data: {
        targetStaffId: manager1.id,
        requesterNote: 'درخواست بازیابی اضطراری دسترسی به دلیل عدم دسترسی موقت به گوشی عامل TOTP',
        status: RecoveryRequestStatus.PENDING,
      },
    });
  }

  // -------------------------------------------------------------
  // ۲. پروفایل آرتیست‌ها (Artist Profiles - Ticket 02)
  // -------------------------------------------------------------
  console.log('🎨 ۳. ایجاد پروفایل تخصصی آرتیست‌ها...');
  const mahsaStaff = staffMap.get('mahsa_artist');
  const elhamStaff = staffMap.get('elham_artist');
  const saharStaff = staffMap.get('sahar_artist');
  const fatemehStaff = staffMap.get('fatemeh_artist');

  const mahsaProfile = await prisma.artistProfile.create({
    data: {
      staffId: mahsaStaff.id,
      bio: 'متخصص رنگ، مش، بالیاژ روسی و تکنیک‌های پیشرفته دکلره با ۸ سال تجربه و مدارک بین‌المللی.',
      experienceYears: 8,
      level: ArtistLevel.SENIOR,
      portfolioUrls: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      ],
    },
  });

  const elhamProfile = await prisma.artistProfile.create({
    data: {
      staffId: elhamStaff.id,
      bio: 'استادکار و مدرس گریم سینمایی، میکاپ تخصصی عروس، کانتورینگ چهره و شینیون‌های سلطنتی با ۱۲ سال سابقه.',
      experienceYears: 12,
      level: ArtistLevel.MASTER,
      portfolioUrls: [
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80',
      ],
    },
  });

  const saharProfile = await prisma.artistProfile.create({
    data: {
      staffId: saharStaff.id,
      bio: 'طراح و متخصص کوپ‌های ژورنالی، کوتاهی لایه‌ای و براشینگ ماندگار متناسب با آناتومی چهره.',
      experienceYears: 5,
      level: ArtistLevel.MID,
      portfolioUrls: [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
      ],
    },
  });

  const fatemehProfile = await prisma.artistProfile.create({
    data: {
      staffId: fatemehStaff.id,
      bio: 'آرتیست مراقبت و پاکسازی پوست، هیدروفیشیال و جوانسازی تخصصی با به‌روزترین دستگاه‌های کابین پوست.',
      experienceYears: 6,
      level: ArtistLevel.SENIOR,
      portfolioUrls: [
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      ],
    },
  });

  // -------------------------------------------------------------
  // ۳. منابع مشترک سالن (Shared Resources - Ticket 03)
  // -------------------------------------------------------------
  console.log('🪑 ۴. پیکربندی منابع مشترک و تجهیزات دارای ظرفیت محدود سالن...');
  const washingChair = await prisma.sharedResource.create({
    data: {
      name: 'صندلی سرشور تخصصی',
      capacity: 2,
      description: 'یونیت ارگونومیک شست‌وشوی سر همراه با ماساژور و کاسه متحرک',
      isActive: true,
    },
  });

  const facialBed = await prisma.sharedResource.create({
    data: {
      name: 'تخت فیشیال و مراقبت پوست',
      capacity: 2,
      description: 'تخت برقی ارگونومیک همراه با تجهیزات هیدروفیشیال و پلاسماتراپی',
      isActive: true,
    },
  });

  const vipBridalRoom = await prisma.sharedResource.create({
    data: {
      name: 'اتاق VIP میکاپ و عروس',
      capacity: 1,
      description: 'فضای اختصاصی میکاپ و آماده‌سازی عروس با آینه هالیوودی و نورپردازی استاندارد',
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      staffId: manager1.id,
      eventType: SecurityEventType.RESOURCE_CONFIGURED,
      details: {
        note: 'پیکربندی منابع مشترک شامل صندلی‌های سرشور، تخت فیشیال و اتاق VIP عروس',
        resources: [washingChair.name, facialBed.name, vipBridalRoom.name],
      },
      ipAddress: '127.0.0.1',
    },
  });

  // -------------------------------------------------------------
  // ۴. کاتالوگ خدمات و مراحل خدمت (Services & Phases - Tickets 02 & 03)
  // -------------------------------------------------------------
  console.log('✂️ ۵. تعریف خدمات سالن، ساختار تعرفه‌ها و مراحل اجرایی (Phases)...');

  // خدمت ۱: کوتاهی ژورنالی (قیمت قطعی)
  const haircutService = await prisma.service.create({
    data: {
      name: 'کوتاهی ژورنالی و براشینگ',
      description: 'کوپ تخصصی به سبک روز همراه با براشینگ فرم‌دهی و ماندگار',
      priceType: ServicePriceType.FIXED,
      fixedPrice: 450000,
      durationMinutes: 45,
      requiresReview: false,
      isPublished: true,
    },
  });

  await prisma.servicePhase.createMany({
    data: [
      {
        serviceId: haircutService.id,
        name: 'شست‌وشوی مو و ماساژ سر',
        sequenceOrder: 1,
        durationMinutes: 15,
        isPause: false,
        resourceId: washingChair.id,
        resourceUnits: 1,
        setupBufferMinutes: 0,
        cleanupBufferMinutes: 5,
      },
      {
        serviceId: haircutService.id,
        name: 'کوپ ژورنالی و براشینگ نهایی',
        sequenceOrder: 2,
        durationMinutes: 30,
        isPause: false,
        resourceId: null,
      },
    ],
  });

  // خدمت ۲: شینیون مجلسی (قیمت قطعی)
  const updoService = await prisma.service.create({
    data: {
      name: 'شینیون کلاسیک و مجلسی',
      description: 'طراحی مو، شینیون خطی، حرارتی و باز متناسب با فرم صورت و مراسم',
      priceType: ServicePriceType.FIXED,
      fixedPrice: 850000,
      durationMinutes: 60,
      requiresReview: false,
      isPublished: true,
    },
  });

  await prisma.servicePhase.createMany({
    data: [
      {
        serviceId: updoService.id,
        name: 'آماده‌سازی مو، پف‌دهی و ویو',
        sequenceOrder: 1,
        durationMinutes: 20,
        isPause: false,
      },
      {
        serviceId: updoService.id,
        name: 'فرم‌دهی و فیکس نهایی شینیون',
        sequenceOrder: 2,
        durationMinutes: 40,
        isPause: false,
      },
    ],
  });

  // خدمت ۳: بالیاژ و لایت (بازه قیمت با بیعانه ثابت و مکث مواد رنگ)
  const balayageService = await prisma.service.create({
    data: {
      name: 'رنگ و لایت بالیاژ',
      description: 'تکنیک تخصصی بالیاژ روسی، سامبره و آمبره متناسب با پایه مو',
      priceType: ServicePriceType.RANGE,
      minPrice: 2500000,
      maxPrice: 6000000,
      fixedDeposit: 500000,
      durationMinutes: 120,
      requiresReview: false,
      isPublished: true,
    },
  });

  await prisma.servicePhase.createMany({
    data: [
      {
        serviceId: balayageService.id,
        name: 'پوشال‌دهی و فویل‌پیچی بالیاژ',
        sequenceOrder: 1,
        durationMinutes: 50,
        isPause: false,
      },
      {
        serviceId: balayageService.id,
        name: 'مکث مواد رنگ و روشن‌سازی (زمان مکث)',
        sequenceOrder: 2,
        durationMinutes: 40,
        isPause: true,
      },
      {
        serviceId: balayageService.id,
        name: 'شست‌وشو، رنگساژ و براشینگ',
        sequenceOrder: 3,
        durationMinutes: 30,
        isPause: false,
        resourceId: washingChair.id,
        resourceUnits: 1,
        setupBufferMinutes: 5,
        cleanupBufferMinutes: 10,
      },
    ],
  });

  // خدمت ۴: فیشیال تخصصی (بازه قیمت با بیعانه ثابت)
  const facialService = await prisma.service.create({
    data: {
      name: 'فیشیال تخصصی و پاکسازی عمیق پوست',
      description: 'پاکسازی چندمرحله‌ای، هیدروژن‌تراپی، اسکراب و ماسک مغذی پوست',
      priceType: ServicePriceType.RANGE,
      minPrice: 950000,
      maxPrice: 1900000,
      fixedDeposit: 250000,
      durationMinutes: 75,
      requiresReview: false,
      isPublished: true,
    },
  });

  await prisma.servicePhase.createMany({
    data: [
      {
        serviceId: facialService.id,
        name: 'پاکسازی و اسکراب اولیه',
        sequenceOrder: 1,
        durationMinutes: 20,
        isPause: false,
        resourceId: facialBed.id,
        resourceUnits: 1,
      },
      {
        serviceId: facialService.id,
        name: 'ماسک حرارتی و مکث تغذیه پوست (زمان مکث)',
        sequenceOrder: 2,
        durationMinutes: 25,
        isPause: true,
        resourceId: facialBed.id,
        resourceUnits: 1,
      },
      {
        serviceId: facialService.id,
        name: 'سرم‌تراپی، آبرسانی و ماساژ لیفت',
        sequenceOrder: 3,
        durationMinutes: 30,
        isPause: false,
        resourceId: facialBed.id,
        resourceUnits: 1,
        setupBufferMinutes: 5,
        cleanupBufferMinutes: 5,
      },
    ],
  });

  // خدمت ۵: پکیج VIP میکاپ و عروس (نیازمند مشاوره و بررسی)
  const bridalService = await prisma.service.create({
    data: {
      name: 'پکیج VIP میکاپ و عروس',
      description: 'میکاپ لوکس و گریم تخصصی ۲۴ ساعته همراه با شینیون و اتاق VIP',
      priceType: ServicePriceType.RANGE,
      minPrice: 8000000,
      maxPrice: 18000000,
      fixedDeposit: 1500000,
      durationMinutes: 240,
      requiresReview: true,
      isPublished: true,
    },
  });

  await prisma.servicePhase.createMany({
    data: [
      {
        serviceId: bridalService.id,
        name: 'آماده‌سازی پوست و فونداسیون',
        sequenceOrder: 1,
        durationMinutes: 60,
        isPause: false,
        resourceId: vipBridalRoom.id,
        resourceUnits: 1,
      },
      {
        serviceId: bridalService.id,
        name: 'میکاپ چشم، کانتورینگ و گریم تخصصی',
        sequenceOrder: 2,
        durationMinutes: 90,
        isPause: false,
        resourceId: vipBridalRoom.id,
        resourceUnits: 1,
      },
      {
        serviceId: bridalService.id,
        name: 'شینیون، نصب تور و تاج عروس',
        sequenceOrder: 3,
        durationMinutes: 90,
        isPause: false,
        resourceId: vipBridalRoom.id,
        resourceUnits: 1,
        setupBufferMinutes: 10,
        cleanupBufferMinutes: 15,
      },
    ],
  });

  // خدمت ۶: دکلره کامل و احیای مو (نیازمند مشاوره و بدون مدت قطعی)
  await prisma.service.create({
    data: {
      name: 'تغییر رنگ تخصصی و دکلره کامل',
      description: 'دکلره پایه ۹ و ۱۰ با اولاپلکس و پروتئین‌تراپی تخصصی؛ نیازمند مشاوره حضوری و تست تار مو پیش از نوبت قطعی',
      priceType: ServicePriceType.RANGE,
      minPrice: 3500000,
      maxPrice: 8000000,
      fixedDeposit: 800000,
      durationMinutes: null,
      requiresReview: true,
      isPublished: true,
    },
  });

  // -------------------------------------------------------------
  // ۵. تعرفه‌های اختصاصی آرتیست‌ها (Artist Tariffs - Ticket 02)
  // -------------------------------------------------------------
  console.log('📋 ۶. ثبت تعرفه‌های اختصاصی هر آرتیست...');
  await prisma.artistServiceTariff.createMany({
    data: [
      {
        artistId: mahsaProfile.id,
        serviceId: balayageService.id,
        priceType: ServicePriceType.RANGE,
        minPrice: 2800000,
        maxPrice: 6500000,
        fixedDeposit: 600000,
        durationMinutes: 120,
        version: 1,
        isActive: true,
      },
      {
        artistId: elhamProfile.id,
        serviceId: bridalService.id,
        priceType: ServicePriceType.RANGE,
        minPrice: 10000000,
        maxPrice: 20000000,
        fixedDeposit: 2000000,
        durationMinutes: 240,
        version: 1,
        isActive: true,
      },
      {
        artistId: elhamProfile.id,
        serviceId: updoService.id,
        priceType: ServicePriceType.FIXED,
        fixedPrice: 950000,
        durationMinutes: 60,
        version: 1,
        isActive: true,
      },
      {
        artistId: saharProfile.id,
        serviceId: haircutService.id,
        priceType: ServicePriceType.FIXED,
        fixedPrice: 450000,
        durationMinutes: 45,
        version: 1,
        isActive: true,
      },
      {
        artistId: fatemehProfile.id,
        serviceId: facialService.id,
        priceType: ServicePriceType.RANGE,
        minPrice: 1100000,
        maxPrice: 2200000,
        fixedDeposit: 300000,
        durationMinutes: 75,
        version: 1,
        isActive: true,
      },
    ],
  });

  // -------------------------------------------------------------
  // ۶. قراردادهای کمیسیون با تایید مستقل دو مدیر (Contracts - Ticket 02)
  // -------------------------------------------------------------
  console.log('📜 ۷. ثبت قراردادهای کمیسیون و سهم سالن با تفکیک هزینه مواد...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

  // قراردادهای فعال و تایید شده توسط مدیر دوم
  await prisma.commissionContract.createMany({
    data: [
      {
        artistId: mahsaProfile.id,
        creatorStaffId: manager1.id,
        approverStaffId: manager2.id,
        commissionRate: 0.45,
        deductMaterialCost: true,
        effectiveFrom: thirtyDaysAgo,
        status: ContractStatus.ACTIVE,
        approvedAt: twentyNineDaysAgo,
        version: 1,
      },
      {
        artistId: elhamProfile.id,
        creatorStaffId: manager1.id,
        approverStaffId: manager2.id,
        commissionRate: 0.50,
        deductMaterialCost: true,
        effectiveFrom: thirtyDaysAgo,
        status: ContractStatus.ACTIVE,
        approvedAt: twentyNineDaysAgo,
        version: 1,
      },
      {
        artistId: saharProfile.id,
        creatorStaffId: manager1.id,
        approverStaffId: manager2.id,
        commissionRate: 0.40,
        deductMaterialCost: false,
        effectiveFrom: thirtyDaysAgo,
        status: ContractStatus.ACTIVE,
        approvedAt: twentyNineDaysAgo,
        version: 1,
      },
      {
        artistId: fatemehProfile.id,
        creatorStaffId: manager1.id,
        approverStaffId: manager2.id,
        commissionRate: 0.45,
        deductMaterialCost: true,
        effectiveFrom: thirtyDaysAgo,
        status: ContractStatus.ACTIVE,
        approvedAt: twentyNineDaysAgo,
        version: 1,
      },
      // یک نمونه قرارداد پیشنهادی معلق (جهت تست تأیید توسط مدیر مستقل دوم)
      {
        artistId: mahsaProfile.id,
        creatorStaffId: manager1.id,
        commissionRate: 0.48,
        deductMaterialCost: true,
        effectiveFrom: new Date(),
        status: ContractStatus.PENDING_APPROVAL,
        version: 2,
      },
    ],
  });

  // -------------------------------------------------------------
  // ۷. شیفت‌های کاری و مرخصی آرتیست‌ها (Shifts & Leaves - Ticket 03)
  // -------------------------------------------------------------
  console.log('⏰ ۸. تنظیم برنامه شیفت کاری هفتگی آرتیست‌ها (تقویم ایرانی)...');
  // 0: شنبه, 1: یک‌شنبه, 2: دوشنبه, 3: سه‌شنبه, 4: چهارشنبه, 5: پنج‌شنبه
  const shiftsData = [
    // مهسا کریمی: شنبه تا چهارشنبه (۰۹:۰۰ تا ۱۸:۰۰)
    ...[0, 1, 2, 3, 4].map((day) => ({
      artistId: mahsaProfile.id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '18:00',
      isActive: true,
    })),
    // الهام رضایی: شنبه، دوشنبه، سه‌شنبه، چهارشنبه، پنج‌شنبه (۱۰:۰۰ تا ۱۹:۰۰)
    ...[0, 2, 3, 4, 5].map((day) => ({
      artistId: elhamProfile.id,
      dayOfWeek: day,
      startTime: '10:00',
      endTime: '19:00',
      isActive: true,
    })),
    // سحر ناصری: شنبه تا پنج‌شنبه (۰۹:۳۰ تا ۱۸:۳۰)
    ...[0, 1, 2, 3, 4, 5].map((day) => ({
      artistId: saharProfile.id,
      dayOfWeek: day,
      startTime: '09:30',
      endTime: '18:30',
      isActive: true,
    })),
    // فاطمه حسینی: شنبه تا چهارشنبه (۱۰:۰۰ تا ۱۸:۰۰)
    ...[0, 1, 2, 3, 4].map((day) => ({
      artistId: fatemehProfile.id,
      dayOfWeek: day,
      startTime: '10:00',
      endTime: '18:00',
      isActive: true,
    })),
  ];

  await prisma.workingShift.createMany({ data: shiftsData });

  // یک نمونه مرخصی تایید شده برای نمایش اثر بر ظرفیت
  const leaveStartDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  leaveStartDate.setUTCHours(9, 0, 0, 0);
  const leaveEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  leaveEndDate.setUTCHours(19, 0, 0, 0);

  await prisma.artistLeave.create({
    data: {
      artistId: saharProfile.id,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: 'شرکت در کارگاه آموزشی تخصصی کوپ ژورنالی و کوتاهی مدرن',
      isApproved: true,
    },
  });

  // -------------------------------------------------------------
  // ۸. مشتریان پایدار و ورود OTP (Customer Accounts - Ticket 04)
  // -------------------------------------------------------------
  console.log('📱 ۹. تعریف مشتریان با هویت پایدار و کدهای اعتبارسنجی ورود...');
  const customer1 = await prisma.customer.create({
    data: {
      phone: '09127777777',
      fullName: 'مونا حسینی',
      isActive: true,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      phone: '09128888888',
      fullName: 'نگار محمدی',
      isActive: true,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      phone: '09129999999',
      fullName: 'پریا کاظمی',
      isActive: true,
    },
  });

  // تولید کد OTP فعال و معتبر برای مشتری سوم جهت تست فوری فرم ورود مشتری
  const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // ۲۴ ساعت اعتبار در محیط آزمایشی
  await prisma.customerOtp.create({
    data: {
      phone: customer3.phone,
      codeHash: sha256(DEMO_CUSTOMER_OTP),
      attempts: 0,
      maxAttempts: 5,
      expiresAt: otpExpiresAt,
      customerId: customer3.id,
    },
  });

  // ایجاد نشست فعال برای مشتری اول (مونا حسینی)
  await prisma.customerSession.create({
    data: {
      customerId: customer1.id,
      tokenHash: sha256('demo-customer-session-token-777'),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Demo Seeder)',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // -------------------------------------------------------------
  // ۹. نوبت‌های نمونه و تخصیص منابع (Bookings & Allocations - Tickets 03 & 04)
  // -------------------------------------------------------------
  console.log('📅 ۱۰. ثبت نمونه رزروهای تاییدشده، انجام‌شده و متأثر با تخصیص منابع...');

  // نوبت گذشته تکمیل‌شده (مونا حسینی)
  const pastStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  pastStart.setUTCHours(10, 0, 0, 0);
  const pastEnd = new Date(pastStart.getTime() + 45 * 60 * 1000);

  await prisma.serviceBooking.create({
    data: {
      serviceId: haircutService.id,
      artistId: saharProfile.id,
      customerId: customer1.id,
      customerName: customer1.fullName || 'مونا حسینی',
      customerPhone: customer1.phone,
      startTime: pastStart,
      endTime: pastEnd,
      status: BookingStatus.COMPLETED,
      isImpacted: false,
    },
  });

  // نوبت آینده تاییدشده با تخصیص صندلی سرشور در فاز ۳ (مونا حسینی)
  const futureStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  futureStart.setUTCHours(10, 0, 0, 0);
  const futureEnd = new Date(futureStart.getTime() + 120 * 60 * 1000);

  const activeBooking = await prisma.serviceBooking.create({
    data: {
      serviceId: balayageService.id,
      artistId: mahsaProfile.id,
      customerId: customer1.id,
      customerName: customer1.fullName || 'مونا حسینی',
      customerPhone: customer1.phone,
      startTime: futureStart,
      endTime: futureEnd,
      status: BookingStatus.CONFIRMED,
      isImpacted: false,
    },
  });

  // تخصیص صندلی سرشور برای ۳۰ دقیقه انتهای خدمت بالیاژ
  const allocationStart = new Date(futureStart.getTime() + 90 * 60 * 1000);
  await prisma.serviceBookingResourceAllocation.create({
    data: {
      bookingId: activeBooking.id,
      resourceId: washingChair.id,
      phaseOrder: 3,
      startTime: allocationStart,
      endTime: futureEnd,
      unitsUsed: 1,
    },
  });

  // نوبت متأثر از تغییر شرایط جهت نمایش در پنل ارزیابی مدیر (نگار محمدی)
  const impactedStart = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  impactedStart.setUTCHours(11, 0, 0, 0);
  const impactedEnd = new Date(impactedStart.getTime() + 240 * 60 * 1000);

  const impactedBooking = await prisma.serviceBooking.create({
    data: {
      serviceId: bridalService.id,
      artistId: elhamProfile.id,
      customerId: customer2.id,
      customerName: customer2.fullName || 'نگار محمدی',
      customerPhone: customer2.phone,
      startTime: impactedStart,
      endTime: impactedEnd,
      status: BookingStatus.CONFIRMED,
      isImpacted: true,
      impactReason: 'تداخل ساعت اجرای خدمت با بازسازی تجهیزات اتاق VIP میکاپ',
    },
  });

  await prisma.serviceBookingResourceAllocation.create({
    data: {
      bookingId: impactedBooking.id,
      resourceId: vipBridalRoom.id,
      phaseOrder: 1,
      startTime: impactedStart,
      endTime: impactedEnd,
      unitsUsed: 1,
    },
  });

  console.log('\n================================================================================');
  console.log('✨ مقداردهی اولیه پایگاه داده سالن زیبایی با موفقیت کامل انجام شد! ✨');
  console.log('================================================================================\n');

  console.log('📋 فهرست پرسنل و دسترسی‌های سامانه:');
  console.table(
    SEED_STAFF.map((s) => ({
      'نام کاربری (Username)': s.username,
      'نقش سازمانی': s.role,
      'نام پرسنل': s.fullName,
      'رمز عبور': DEFAULT_PASSWORD,
      'کد محرمانه TOTP': s.mfaSecret,
      'کد بازیابی اضطراری': s.recoveryCodes[0],
    })),
  );

  console.log('\n📱 حساب‌های مشتریان پایدار (جهت تست ورود با پیامک / OTP):');
  console.table([
    {
      'نام مشتری': customer3.fullName,
      'شماره موبایل': customer3.phone,
      'کد OTP آماده ورود': DEMO_CUSTOMER_OTP,
      'توضیحات': 'کد یک‌بارمصرف فعال با ۲۴ ساعت اعتبار در محیط توسعه',
    },
    {
      'نام مشتری': customer1.fullName,
      'شماره موبایل': customer1.phone,
      'کد OTP آماده ورود': 'درخواست از طریق فرم ورود (کد در کنسول چاپ می‌شود)',
      'توضیحات': 'دارای سابقه رزرو تکمیل‌شده و رزرو آینده بالیاژ',
    },
    {
      'نام مشتری': customer2.fullName,
      'شماره موبایل': customer2.phone,
      'کد OTP آماده ورود': 'درخواست از طریق فرم ورود',
      'توضیحات': 'دارای رزرو متأثر پکیج عروس جهت بررسی پنل مدیریت',
    },
  ]);

  console.log('\n💡 راهنمای ارزیابی و سناریوهای آماده بررسی:');
  console.log('  ۱. مقایسه خدمات و تخصص آرتیست‌ها: http://localhost:3000/services');
  console.log('     - خدمات با قیمت قطعی، بازه قیمت، بیعانه ثابت و تفکیک خدمات نیازمند مشاوره');
  console.log('     - نمایش سوابق و سطوح مهارت آرتیست‌ها (Master, Senior, Mid)');
  console.log('  ۲. استعلام ظرفیت واقعی و رزرو: http://localhost:3000/booking');
  console.log('     - نمایش زمان‌های آزاد با احتساب اشغال آرتیست، مراحل خدمت و ظرفیت صندلی‌های سرشور');
  console.log('     - پنل مدیریت نوبت‌های متأثر (Impacted Bookings Tab)');
  console.log('  ۳. حساب شخصی مشتری: http://localhost:3000/customer/account');
  console.log(`     - ورود با شماره ${customer3.phone} و کد پیامکی ${DEMO_CUSTOMER_OTP}`);
  console.log('     - مشاهده پنل هویت پایدار مشتری و نوبت‌های شخصی');
  console.log('  ۴. پنل ورود پرسنل با احراز هویت دو عاملی: http://localhost:3000/login');
  console.log(`     - ورود با نام کاربری zahra_modir / رمز ${DEFAULT_PASSWORD} / کد TOTP اعتبارسنجی\n`);
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
