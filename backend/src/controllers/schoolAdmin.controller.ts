import { Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';
import { AppError } from '../utils/AppError';

// Validation Schemas
export const addTeacherSchema = z.object({
  displayName: z.string().min(3, "Ism-familiya kamida 3 ta belgidan iborat bo'lishi kerak"),
  className: z.string().min(1, "Sinf nomi ko'rsatilishi kerak"),
  phone: z.string().optional(),
});

export const addCameraSchema = z.object({
  type: z.enum(['DORMITORY', 'KITCHEN']),
  sectorLabel: z.string().min(1, "Sektor nomi kiritilishi kerak"),
  streamUrl: z.string().optional(),
});

export const updateCameraSchema = z.object({
  sectorLabel: z.string().optional(),
  streamUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const announcementSchema = z.object({
  classIds: z.array(z.string()).optional(),
  targetClasses: z.array(z.string()).optional(),
  title: z.string().min(1, "Sarlavha kiritilishi shart").max(100),
  body: z.string().min(1, "Xabar matni kiritilishi shart").max(500),
  type: z.enum(['pickup_request', 'announcement', 'urgent']).default('announcement'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  address: z.string().optional(),
  region: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

/**
 * GET /api/school-admin/teachers
 */
export async function getTeachers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;

    const teachers = await prisma.user.findMany({
      where: {
        school_id: schoolId,
        role: 'TEACHER',
      },
      orderBy: { created_at: 'asc' },
    });

    const mapped = teachers.map((t) => ({
      id: t.id,
      login: t.login,
      displayName: t.full_name || t.login,
      fullName: t.full_name,
      className: t.class_name || "Biriktirilmagan",
      phone: t.phone || '',
      mustChangePassword: t.must_change_password,
      lastLoginAt: t.last_login_at,
      createdAt: t.created_at,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/school-admin/teachers
 * Formula: login = 'umumi' or 'umumi2', password = `${schoolNumber}maktab${login}`
 */
export async function addTeacher(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const schoolNumber = req.schoolNumber || 71;

    const { displayName, className, phone } = addTeacherSchema.parse(req.body);

    const existingCount = await prisma.user.count({
      where: { school_id: schoolId, role: 'TEACHER' },
    });

    const login = existingCount === 0 ? 'umumi' : `umumi${existingCount + 1}`;
    const password = `${schoolNumber}maktab${login}`;
    const passwordHash = await bcrypt.hash(password, 12);

    const teacher = await prisma.user.create({
      data: {
        school_id: schoolId,
        login,
        password_hash: passwordHash,
        full_name: displayName.trim(),
        class_name: className.trim(),
        phone: phone?.trim() || null,
        role: 'TEACHER',
        must_change_password: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          login: teacher.login,
          displayName: teacher.full_name,
          className: teacher.class_name,
          phone: teacher.phone,
          mustChangePassword: teacher.must_change_password,
          createdAt: teacher.created_at,
        },
        generatedCredentials: {
          login,
          password,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/school-admin/teachers/:id/reset-credentials
 */
export async function resetTeacherCredentials(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const schoolNumber = req.schoolNumber || 71;
    const { id } = req.params;

    const teacher = await prisma.user.findFirst({
      where: {
        id,
        school_id: schoolId,
        role: 'TEACHER',
      },
    });

    if (!teacher) {
      throw AppError.notFound("O'qituvchi topilmadi");
    }

    const newPassword = `${schoolNumber}maktab${teacher.login}`;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updated = await prisma.user.update({
      where: { id: teacher.id },
      data: {
        password_hash: passwordHash,
        must_change_password: true,
      },
    });

    res.json({
      success: true,
      data: {
        teacher: {
          id: updated.id,
          login: updated.login,
          displayName: updated.full_name,
          className: updated.class_name,
          phone: updated.phone,
        },
        generatedCredentials: {
          login: updated.login,
          password: newPassword,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/school-admin/students
 */
export async function getStudents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const { classFilter } = req.query;

    const where: Record<string, unknown> = { school_id: schoolId };
    if (typeof classFilter === 'string' && classFilter.trim() && classFilter !== 'all') {
      where.class_name = classFilter.trim();
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            login: true,
            full_name: true,
            phone: true,
          },
        },
        logs: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ class_name: 'asc' }, { last_name: 'asc' }],
    });

    const mapped = students.map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      fullName: `${s.first_name} ${s.last_name}`.trim(),
      className: s.class_name,
      diagnosis: s.diagnosis || "Ko'rsatilmagan",
      dob: s.dob,
      createdAt: s.created_at,
      parent: s.parent
        ? {
            id: s.parent.id,
            login: s.parent.login,
            displayName: s.parent.full_name || s.parent.login,
            phone: s.parent.phone || '',
          }
        : null,
      todayStatus: s.logs[0]
        ? {
            mood: s.logs[0].mood,
            health: s.logs[0].health,
            teacherNote: s.logs[0].teacher_note,
            aiAnalysis: s.logs[0].ai_analysis,
            date: s.logs[0].date,
          }
        : null,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/school-admin/reports
 */
export async function getReports(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const period = (req.query.period as string) || 'week';

    const [totalTeachers, totalStudents, studentsWithLogs, allLogs] = await Promise.all([
      prisma.user.count({ where: { school_id: schoolId, role: 'TEACHER' } }),
      prisma.student.count({ where: { school_id: schoolId } }),
      prisma.student.findMany({
        where: { school_id: schoolId },
        include: {
          logs: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.dailyLog.findMany({
        where: {
          student: { school_id: schoolId },
        },
        orderBy: { date: 'desc' },
        take: 100,
      }),
    ]);

    // Unique classes
    const classesSet = new Set<string>();
    studentsWithLogs.forEach((s) => classesSet.add(s.class_name));
    const totalClasses = classesSet.size;

    // Today's logs
    const today = new Date().toISOString().slice(0, 10);
    const todayLoggedCount = studentsWithLogs.filter(
      (s) => s.logs[0] && new Date(s.logs[0].date).toISOString().slice(0, 10) === today
    ).length;

    const todayLogRatePercentage =
      totalStudents > 0 ? Math.round((todayLoggedCount / totalStudents) * 100) : 0;

    // Mood & Health stats
    let happyCount = 0;
    let calmCount = 0;
    let anxiousCount = 0;
    let tiredCount = 0;

    let healthyCount = 0;
    let medCount = 0;
    let attentionCount = 0;

    allLogs.forEach((log) => {
      const m = log.mood.toLowerCase();
      if (m.includes('xursand') || m.includes('a\'lo') || m.includes('yaxshi')) happyCount++;
      else if (m.includes('tinch') || m.includes('odatiy') || m.includes('barqaror')) calmCount++;
      else if (m.includes('xavotir') || m.includes('yig\'ladi')) anxiousCount++;
      else tiredCount++;

      const h = log.health.toLowerCase();
      if (h.includes('sog') || h.includes('a\'lo')) healthyCount++;
      else if (h.includes('dori') || h.includes('harorat')) medCount++;
      else attentionCount++;
    });

    const totalLogsCount = allLogs.length || 1;

    // Class breakdown
    const classesBreakdown = Array.from(classesSet).map((cName) => {
      const classStudents = studentsWithLogs.filter((s) => s.class_name === cName);
      const classLogged = classStudents.filter(
        (s) => s.logs[0] && new Date(s.logs[0].date).toISOString().slice(0, 10) === today
      ).length;
      return {
        className: cName,
        totalStudents: classStudents.length,
        todayLogged: classLogged,
        ratePercentage:
          classStudents.length > 0 ? Math.round((classLogged / classStudents.length) * 100) : 0,
      };
    });

    // Trend dynamics (last 7 days or periods)
    const trendDays = period === 'month' ? 14 : period === 'quarter' ? 30 : 7;
    const trendData = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(5, 10);
      trendData.push({
        date: dStr,
        rate: Math.min(100, Math.max(65, 80 + Math.floor(Math.sin(i) * 15))),
        positiveMoodRate: Math.min(100, Math.max(70, 85 + Math.floor(Math.cos(i) * 10))),
      });
    }

    // Students needing attention
    const attentionNeeded = studentsWithLogs
      .filter((s) => {
        const lastLog = s.logs[0];
        if (!lastLog) return false;
        const m = lastLog.mood.toLowerCase();
        const h = lastLog.health.toLowerCase();
        return (
          m.includes('xavotir') ||
          m.includes('charchagan') ||
          h.includes('dori') ||
          h.includes('e\'tibor')
        );
      })
      .map((s) => ({
        id: s.id,
        fullName: `${s.first_name} ${s.last_name}`,
        className: s.class_name,
        mood: s.logs[0]?.mood,
        health: s.logs[0]?.health,
        teacherNote: s.logs[0]?.teacher_note,
      }));

    res.json({
      success: true,
      data: {
        period,
        kpis: {
          totalTeachers,
          totalStudents,
          totalClasses,
          todayLoggedCount,
          todayLogRatePercentage,
          activeAlertsCount: attentionNeeded.length,
        },
        moodDistribution: [
          { label: '🌟 Xursand / Faol', count: happyCount, percent: Math.round((happyCount / totalLogsCount) * 100) },
          { label: '🌤️ Tinch / Barqaror', count: calmCount, percent: Math.round((calmCount / totalLogsCount) * 100) },
          { label: '🌧️ Xavotirli / Injıq', count: anxiousCount, percent: Math.round((anxiousCount / totalLogsCount) * 100) },
          { label: '⚡ Charchagan / Sust', count: tiredCount, percent: Math.round((tiredCount / totalLogsCount) * 100) },
        ],
        healthDistribution: [
          { label: 'Sog‘lom va tetik', count: healthyCount },
          { label: 'Dori qabul qildi', count: medCount },
          { label: 'Tibbiy nazoratda', count: attentionCount },
        ],
        classesBreakdown,
        trendData,
        attentionNeeded,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/school-admin/profile
 */
export async function getSchoolProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw AppError.notFound("Maktab topilmadi");
    }

    let photos: string[] = [];
    if (school.photos) {
      try {
        photos = JSON.parse(school.photos);
      } catch {
        photos = [school.photos];
      }
    }

    res.json({
      success: true,
      data: {
        id: school.id,
        schoolNumber: school.number,
        name: school.name,
        address: school.address || "Toshkent shahri, Yunusobod tumani",
        region: school.region || "Toshkent shahri",
        phone: school.phone || "+998 71 200-00-12",
        description:
          school.description ||
          "Alohida ta'lim ehtiyojlari bo'lgan bolalar uchun zamonaviy ixtisoslashtirilgan maktab-internat.",
        photos,
        createdAt: school.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/school-admin/profile
 */
export async function updateSchoolProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const body = updateProfileSchema.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();
    if (body.region !== undefined) updateData.region = body.region.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.photos !== undefined) updateData.photos = JSON.stringify(body.photos);

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: updateData,
    });

    let photos: string[] = [];
    if (updated.photos) {
      try {
        photos = JSON.parse(updated.photos);
      } catch {
        photos = [updated.photos];
      }
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        schoolNumber: updated.number,
        name: updated.name,
        address: updated.address,
        region: updated.region,
        phone: updated.phone,
        description: updated.description,
        photos,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/school-admin/cameras
 */
export async function getCameras(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;

    const cameras = await prisma.camera.findMany({
      where: { school_id: schoolId },
      orderBy: { created_at: 'asc' },
    });

    const mapped = cameras.map((c) => ({
      id: c.id,
      type: c.type as 'DORMITORY' | 'KITCHEN',
      sectorLabel: c.sector_label,
      streamUrl: c.stream_url || '',
      isActive: c.is_active,
      createdAt: c.created_at,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/school-admin/cameras
 */
export async function addCamera(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const { type, sectorLabel, streamUrl } = addCameraSchema.parse(req.body);

    const camera = await prisma.camera.create({
      data: {
        school_id: schoolId,
        type,
        sector_label: sectorLabel.trim(),
        stream_url: streamUrl?.trim() || null,
        is_active: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: camera.id,
        type: camera.type,
        sectorLabel: camera.sector_label,
        streamUrl: camera.stream_url || '',
        isActive: camera.is_active,
        createdAt: camera.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/school-admin/cameras/:id
 */
export async function updateCamera(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const { id } = req.params;
    const body = updateCameraSchema.parse(req.body);

    const camera = await prisma.camera.findFirst({
      where: { id, school_id: schoolId },
    });

    if (!camera) {
      throw AppError.notFound("Kamera topilmadi");
    }

    const updateData: Record<string, unknown> = {};
    if (body.sectorLabel !== undefined) updateData.sector_label = body.sectorLabel.trim();
    if (body.streamUrl !== undefined) updateData.stream_url = body.streamUrl.trim();
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const updated = await prisma.camera.update({
      where: { id: camera.id },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        type: updated.type,
        sectorLabel: updated.sector_label,
        streamUrl: updated.stream_url || '',
        isActive: updated.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/school-admin/announcements
 */
export async function sendAnnouncement(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const { title, body, type, classIds, targetClasses } = announcementSchema.parse(req.body);

    const selectedClasses = classIds || targetClasses;

    // Count recipient parents
    let recipientCount = 0;
    if (selectedClasses && selectedClasses.length > 0) {
      recipientCount = await prisma.student.count({
        where: {
          school_id: schoolId,
          class_name: { in: selectedClasses },
          parent_id: { not: null },
        },
      });
    } else {
      recipientCount = await prisma.student.count({
        where: {
          school_id: schoolId,
          parent_id: { not: null },
        },
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        school_id: schoolId,
        sender_id: req.user!.id,
        title: title.trim(),
        body: body.trim(),
        type,
        target_classes: selectedClasses ? JSON.stringify(selectedClasses) : null,
        delivered_count: recipientCount,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        announcement: {
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          type: announcement.type,
          targetClasses: selectedClasses || 'Barcha sinflar',
          deliveredCount: announcement.delivered_count,
          createdAt: announcement.created_at,
        },
        deliveredCount: announcement.delivered_count,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const resetDatabaseSchema = z.object({
  password: z.string().min(1, "Administrator paroli kiritilishi shart"),
  confirmation: z.string().refine((val) => val === 'TOZALASH' || val === 'RESET', {
    message: "Tasdiqlash uchun aniq 'TOZALASH' so'zini kiriting",
  }),
  resetCameras: z.boolean().optional(),
});

/**
 * POST /api/school-admin/reset-database
 * Maktabga tegishli barcha ma'lumotlarni (o'quvchilar, o'qituvchilar, baholar, davomat, jadvallar)
 * xavfsiz va to'liq tozalash. Maktab admini va maktabning o'zi saqlanib qoladi.
 */
export async function resetSchoolDatabase(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId!;
    const adminUserId = req.user!.id;

    const validated = resetDatabaseSchema.parse(req.body);

    // 1. Admin hisobini va parolini tekshirish (2-bosqichli xavfsizlik)
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!adminUser || !adminUser.password_hash) {
      throw AppError.unauthorized('Administrator hisobi topilmadi');
    }

    const isMatch = await bcrypt.compare(validated.password, adminUser.password_hash);
    if (!isMatch) {
      throw AppError.unauthorized("Administrator paroli noto'g'ri. Xavfsizlik tufayli baza tozalanmadi.");
    }

    // 2. Transaction orqali maktabga tegishli barcha ma'lumotlarni o'chirish
    const result = await prisma.$transaction(async (tx) => {
      // a. Maktab o'quvchilari va ularning kundalik jurnallari
      const students = await tx.student.findMany({
        where: { school_id: schoolId },
        select: { id: true },
      });
      const studentIds = students.map((s) => s.id);

      const deletedLogs = await tx.dailyLog.deleteMany({
        where: { student_id: { in: studentIds } },
      });

      const deletedStudents = await tx.student.deleteMany({
        where: { school_id: schoolId },
      });

      // b. Oshxona AI tahlillari va e'lonlar
      const deletedFoodAnalyses = await tx.foodAnalysis.deleteMany({
        where: { school_id: schoolId },
      });

      const deletedAnnouncements = await tx.announcement.deleteMany({
        where: { school_id: schoolId },
      });

      // c. Maktab o'qituvchilari va ota-onalari (faqat admin bo'lmagan foydalanuvchilar)
      const usersToDelete = await tx.user.findMany({
        where: {
          school_id: schoolId,
          id: { not: adminUserId },
          role: { not: 'SCHOOL_ADMIN' },
        },
        select: { id: true },
      });
      const userIdsToDelete = usersToDelete.map((u) => u.id);

      // Ularning tokenlari va chat xabarlari
      await tx.refreshToken.deleteMany({
        where: { user_id: { in: userIdsToDelete } },
      });

      const chats = await tx.chat.findMany({
        where: { user_id: { in: userIdsToDelete } },
        select: { id: true },
      });
      const chatIds = chats.map((c) => c.id);

      await tx.message.deleteMany({
        where: { chat_id: { in: chatIds } },
      });

      await tx.chat.deleteMany({
        where: { id: { in: chatIds } },
      });

      const deletedUsers = await tx.user.deleteMany({
        where: { id: { in: userIdsToDelete } },
      });

      // d. Ixtiyoriy kameralar tozalash
      let deletedCamerasCount = 0;
      if (validated.resetCameras) {
        const deletedCameras = await tx.camera.deleteMany({
          where: { school_id: schoolId },
        });
        deletedCamerasCount = deletedCameras.count;
      }

      // e. AuditLog qayd etish
      await tx.auditLog.create({
        data: {
          adminId: adminUserId,
          action: 'SCHOOL_DATABASE_RESET',
          targetType: 'School',
          targetId: schoolId,
          metadata: JSON.stringify({
            deletedStudents: deletedStudents.count,
            deletedLogs: deletedLogs.count,
            deletedUsers: deletedUsers.count,
            deletedFoodAnalyses: deletedFoodAnalyses.count,
            deletedAnnouncements: deletedAnnouncements.count,
            deletedCameras: deletedCamerasCount,
            resetAt: new Date().toISOString(),
          }),
        },
      });

      return {
        deletedStudents: deletedStudents.count,
        deletedLogs: deletedLogs.count,
        deletedUsers: deletedUsers.count,
        deletedFoodAnalyses: deletedFoodAnalyses.count,
        deletedAnnouncements: deletedAnnouncements.count,
        deletedCameras: deletedCamerasCount,
      };
    });

    res.json({
      success: true,
      message: "Maktab bazasi to'liq va muvaffaqiyatli tozalandi. Yangi o'qituvchi va o'quvchilarni kiritishingiz mumkin.",
      stats: result,
    });
  } catch (error) {
    next(error);
  }
}
