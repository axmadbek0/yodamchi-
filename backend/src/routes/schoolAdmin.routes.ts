import { Router } from 'express';
import { requireSchoolAdmin } from '../middlewares/requireSchoolAdmin';
import {
  getTeachers,
  addTeacher,
  resetTeacherCredentials,
  getStudents,
  getReports,
  getSchoolProfile,
  updateSchoolProfile,
  getCameras,
  addCamera,
  updateCamera,
  sendAnnouncement,
  resetSchoolDatabase,
} from '../controllers/schoolAdmin.controller';

const router = Router();

// Har bir endpointga requireSchoolAdmin qat'iy qo'llanadi
router.use(requireSchoolAdmin);

router.get('/teachers', getTeachers);
router.post('/teachers', addTeacher);
router.post('/teachers/:id/reset-credentials', resetTeacherCredentials);

router.get('/students', getStudents);
router.get('/reports', getReports);

router.get('/profile', getSchoolProfile);
router.patch('/profile', updateSchoolProfile);

router.get('/cameras', getCameras);
router.post('/cameras', addCamera);
router.patch('/cameras/:id', updateCamera);

router.post('/announcements', sendAnnouncement);

// Baza ma'lumotlarini tozalash va qayta boshlash (2-bosqichli xavfsizlik bilan)
router.post('/reset-database', resetSchoolDatabase);

export default router;
