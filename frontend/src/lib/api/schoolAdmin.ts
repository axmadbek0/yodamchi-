/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { axiosInstance } from '../../api/axios';
import type {
  TeacherItem,
  TeacherWithCredentials,
  StudentItem,
  SchoolReportData,
  SchoolProfileData,
  CameraItem,
  AnnouncementItem,
  AnnouncementPayload,
} from '../../types/schoolAdmin';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export async function getTeachers(): Promise<TeacherItem[]> {
  const res = await axiosInstance.get<ApiResponse<TeacherItem[]>>('/school-admin/teachers');
  return res.data.data;
}

export async function addTeacher(payload: {
  displayName: string;
  className: string;
  phone?: string;
}): Promise<TeacherWithCredentials> {
  const res = await axiosInstance.post<ApiResponse<TeacherWithCredentials>>(
    '/school-admin/teachers',
    payload
  );
  return res.data.data;
}

export async function resetTeacherCredentials(
  teacherId: string
): Promise<TeacherWithCredentials> {
  const res = await axiosInstance.post<ApiResponse<TeacherWithCredentials>>(
    `/school-admin/teachers/${teacherId}/reset-credentials`
  );
  return res.data.data;
}

export async function getStudents(classFilter?: string): Promise<StudentItem[]> {
  const res = await axiosInstance.get<ApiResponse<StudentItem[]>>('/school-admin/students', {
    params: { classFilter },
  });
  return res.data.data;
}

export async function getReports(
  period: 'week' | 'month' | 'quarter' = 'week'
): Promise<SchoolReportData> {
  const res = await axiosInstance.get<ApiResponse<SchoolReportData>>('/school-admin/reports', {
    params: { period },
  });
  return res.data.data;
}

export async function getSchoolProfile(): Promise<SchoolProfileData> {
  const res = await axiosInstance.get<ApiResponse<SchoolProfileData>>('/school-admin/profile');
  return res.data.data;
}

export async function updateSchoolProfile(
  payload: Partial<SchoolProfileData>
): Promise<SchoolProfileData> {
  const res = await axiosInstance.patch<ApiResponse<SchoolProfileData>>(
    '/school-admin/profile',
    payload
  );
  return res.data.data;
}

export async function getCameras(): Promise<CameraItem[]> {
  const res = await axiosInstance.get<ApiResponse<CameraItem[]>>('/school-admin/cameras');
  return res.data.data;
}

export async function addCamera(payload: {
  type: 'DORMITORY' | 'KITCHEN';
  sectorLabel: string;
  streamUrl?: string;
}): Promise<CameraItem> {
  const res = await axiosInstance.post<ApiResponse<CameraItem>>('/school-admin/cameras', payload);
  return res.data.data;
}

export async function updateCamera(
  id: string,
  payload: { sectorLabel?: string; streamUrl?: string; isActive?: boolean }
): Promise<CameraItem> {
  const res = await axiosInstance.patch<ApiResponse<CameraItem>>(
    `/school-admin/cameras/${id}`,
    payload
  );
  return res.data.data;
}

export async function sendAnnouncement(
  payload: AnnouncementPayload
): Promise<{ announcement: AnnouncementItem; deliveredCount: number }> {
  const res = await axiosInstance.post<
    ApiResponse<{ announcement: AnnouncementItem; deliveredCount: number }>
  >('/school-admin/announcements', payload);
  return res.data.data;
}

export interface ResetDatabasePayload {
  password: string;
  confirmation: string;
  resetCameras?: boolean;
}

export interface ResetDatabaseResult {
  success: boolean;
  message: string;
  stats?: {
    deletedStudents: number;
    deletedLogs: number;
    deletedUsers: number;
    deletedFoodAnalyses: number;
    deletedAnnouncements: number;
    deletedCameras: number;
  };
}

export async function resetSchoolDatabase(
  payload: ResetDatabasePayload
): Promise<ResetDatabaseResult> {
  const res = await axiosInstance.post<ResetDatabaseResult>(
    '/school-admin/reset-database',
    payload
  );
  return res.data;
}
