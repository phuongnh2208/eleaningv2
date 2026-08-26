import axios from 'axios';

const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:3000';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes NestJS error shapes ({message}, {error}, class-validator arrays)
// into a single friendly string for the UI.
export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra.') {
  const data = error?.response?.data;
  const message = data?.message ?? data?.error;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return fallback;
}

export function getApiErrorStatus(error) {
  return error?.response?.status;
}

// ---- Auth ----
export const registerWithEmailPassword = (email, password) =>
  client.post('/auth/register', { email, password }).then((r) => r.data);

export const loginWithEmailPassword = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);

export const googleLogin = (idToken) =>
  client.post('/auth/google-login', { idToken }).then((r) => r.data);

// Links a verified Google identity to the currently logged-in (email/password)
// account — does not create a new user or session. Required so a student who
// registered with email/password can meet the "correct Google account"
// requirement for paid-video access.
export const linkGoogleAccount = (idToken) =>
  client.post('/auth/link-google', { idToken }).then((r) => r.data);

export const getCurrentUser = () =>
  client.get('/users/me').then((r) => r.data);

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
}

// ---- Courses / Lessons / Video ----
export const getCourses = (admin = false) =>
  client.get(admin ? '/courses/admin' : '/courses').then((r) => r.data);

export const getAdminCourses = () => client.get('/courses/admin').then((r) => r.data);

export const updateCourse = (courseId, body) =>
  client.patch(`/courses/${courseId}`, body).then((r) => r.data);

export const deleteCourse = (courseId) =>
  client.delete(`/courses/${courseId}`).then((r) => r.data);

export const getCourse = (courseId) =>
  client.get(`/courses/${courseId}`).then((r) => r.data);

export const getLessons = (courseId) =>
  client.get(`/courses/${courseId}/lessons`).then((r) => r.data);

// Video is only ever served through this single protected route — there is
// no separate public/private/allowed tier at the API level. JWT is always
// required; VideoAccessGuard on the backend decides FREE-vs-PAID access.
export const getLessonVideo = (lessonId) =>
  client.get(`/lessons/${lessonId}/video`).then((r) => r.data);

// ---- Enrollments ----
export const getMyEnrollments = () =>
  client.get('/enrollments/me').then((r) => r.data);

export const getAdminEnrollments = (status) =>
  client.get('/enrollments/admin', { params: status ? { status } : {} }).then((r) => r.data);

export const createEnrollment = (courseId) =>
  client.post(`/enrollments/courses/${courseId}`).then((r) => r.data);

export const createPublicEnrollment = ({
  contactName,
  contactEmail,
  contactPhone,
  courseId,
}) =>
  client
    .post('/enrollments/public', {
      contactName,
      contactEmail,
      contactPhone,
      courseId,
    })
    .then((r) => r.data);

export const confirmEnrollmentPayment = (enrollmentId) =>
  client
    .post(`/enrollments/${enrollmentId}/confirm-payment`)
    .then((r) => r.data);

export const getEnrollment = (enrollmentId) =>
  client.get(`/enrollments/${enrollmentId}`).then((r) => r.data);

export default client;
