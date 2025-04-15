
// User types
export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Course types
export type CourseCategory = 'math' | 'science' | 'literature' | 'history' | 'programming' | 'other';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  teacherId: string;
  teacherName: string;
  enrolledStudents: number;
  materials?: CourseMaterial[];
  assignments?: Assignment[];
  quizzes?: Quiz[];
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link';
  url: string;
  courseId: string;
}

// Assignment types
export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  points: number;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submissionDate: string;
  content: string;
  grade?: number;
  feedback?: string;
}

// Quiz types
export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  dueDate: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number | boolean;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  submissionDate: string;
  answers: Record<string, string | number | boolean>;
  score: number;
}

// Attendance types
export interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string;
  students: StudentAttendance[];
}

export interface StudentAttendance {
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

// Dashboard statistics
export interface DashboardStats {
  totalCourses: number;
  totalAssignments: number;
  totalQuizzes: number;
  averageAttendance: number;
  upcomingDeadlines: Assignment[];
}
