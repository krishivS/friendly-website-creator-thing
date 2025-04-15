
import { Course, Assignment, AttendanceRecord, Quiz, CourseCategory } from '@/types/cms';

// Course data
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Mathematics',
    description: 'Fundamental concepts of algebra, geometry, and calculus.',
    category: 'math',
    teacherId: '2',
    teacherName: 'Teacher User',
    enrolledStudents: 25,
  },
  {
    id: '2',
    title: 'Biology 101',
    description: 'Basic principles of biology, including cell structure and function.',
    category: 'science',
    teacherId: '2',
    teacherName: 'Teacher User',
    enrolledStudents: 30,
  },
  {
    id: '3',
    title: 'World Literature',
    description: 'Survey of literature from various cultures and time periods.',
    category: 'literature',
    teacherId: '2',
    teacherName: 'Teacher User',
    enrolledStudents: 20,
  },
  {
    id: '4',
    title: 'Modern History',
    description: 'Overview of major historical events from the 20th century to present day.',
    category: 'history',
    teacherId: '2',
    teacherName: 'Teacher User',
    enrolledStudents: 35,
  },
  {
    id: '5',
    title: 'Web Programming',
    description: 'Introduction to HTML, CSS, and JavaScript for web development.',
    category: 'programming',
    teacherId: '2',
    teacherName: 'Teacher User',
    enrolledStudents: 28,
  },
];

// Assignment data
export const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Algebra Fundamentals',
    description: 'Solve the given equations and show your work.',
    courseId: '1',
    dueDate: '2025-04-25T23:59:59Z',
    points: 100,
  },
  {
    id: '2',
    title: 'Cell Structure Report',
    description: 'Write a report on eukaryotic cell structures and their functions.',
    courseId: '2',
    dueDate: '2025-04-20T23:59:59Z',
    points: 75,
  },
  {
    id: '3',
    title: 'Literary Analysis',
    description: 'Analyze the themes in "To Kill a Mockingbird".',
    courseId: '3',
    dueDate: '2025-04-30T23:59:59Z',
    points: 50,
  },
  {
    id: '4',
    title: 'Cold War Essay',
    description: 'Discuss the causes and effects of the Cold War.',
    courseId: '4',
    dueDate: '2025-05-05T23:59:59Z',
    points: 100,
  },
  {
    id: '5',
    title: 'Interactive Web Page',
    description: 'Create a simple interactive webpage using HTML, CSS, and JavaScript.',
    courseId: '5',
    dueDate: '2025-05-10T23:59:59Z',
    points: 120,
  },
];

// Quiz data
export const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Algebra Quiz',
    description: 'Test your knowledge of basic algebraic concepts.',
    courseId: '1',
    dueDate: '2025-04-28T23:59:59Z',
    questions: [
      {
        id: '1',
        text: 'Solve for x: 2x + 5 = 15',
        type: 'short-answer',
        correctAnswer: '5',
      },
      {
        id: '2',
        text: 'Is the equation y = 2x + 3 a linear equation?',
        type: 'true-false',
        correctAnswer: true,
      },
    ],
  },
  {
    id: '2',
    title: 'Cell Biology Quiz',
    description: 'Test your knowledge of cell structures and functions.',
    courseId: '2',
    dueDate: '2025-04-22T23:59:59Z',
    questions: [
      {
        id: '1',
        text: 'Which organelle is responsible for protein synthesis?',
        type: 'multiple-choice',
        options: ['Ribosome', 'Mitochondria', 'Nucleus', 'Golgi apparatus'],
        correctAnswer: 0,
      },
      {
        id: '2',
        text: 'Is the mitochondria known as the powerhouse of the cell?',
        type: 'true-false',
        correctAnswer: true,
      },
    ],
  },
];

// Attendance data
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    courseId: '1',
    date: '2025-04-14',
    students: [
      {
        studentId: '3',
        studentName: 'Student User',
        status: 'present',
      },
      {
        studentId: '4',
        studentName: 'Jane Doe',
        status: 'absent',
      },
    ],
  },
  {
    id: '2',
    courseId: '2',
    date: '2025-04-14',
    students: [
      {
        studentId: '3',
        studentName: 'Student User',
        status: 'present',
      },
      {
        studentId: '4',
        studentName: 'Jane Doe',
        status: 'present',
      },
    ],
  },
];

// Helper functions to mock API calls
export const getCourses = (): Promise<Course[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCourses);
    }, 500);
  });
};

export const getCourseById = (id: string): Promise<Course | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCourses.find(course => course.id === id));
    }, 300);
  });
};

export const getAssignmentsByCourseId = (courseId: string): Promise<Assignment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAssignments.filter(assignment => assignment.courseId === courseId));
    }, 300);
  });
};

export const getQuizzesByCourseId = (courseId: string): Promise<Quiz[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockQuizzes.filter(quiz => quiz.courseId === courseId));
    }, 300);
  });
};

export const getAttendanceByCourseId = (courseId: string): Promise<AttendanceRecord[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAttendanceRecords.filter(record => record.courseId === courseId));
    }, 300);
  });
};

export const getCourseCategories = (): CourseCategory[] => {
  return ['math', 'science', 'literature', 'history', 'programming', 'other'];
};

export const getStudentCourses = (studentId: string): Promise<Course[]> => {
  // For demo purposes, return all courses for any student
  return getCourses();
};

export const getTeacherCourses = (teacherId: string): Promise<Course[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCourses.filter(course => course.teacherId === teacherId));
    }, 300);
  });
};
