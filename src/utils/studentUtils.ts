
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Add a new student to the database
 */
export const addStudent = async (
  studentData: { 
    name: string; 
    email: string;
  }
) => {
  try {
    // Check if student with this email already exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', studentData.email)
      .eq('role', 'student')
      .maybeSingle();

    if (checkError) throw checkError;
    
    if (existingStudent) {
      return { data: existingStudent, error: 'Student with this email already exists' };
    }

    // Add new student with a generated UUID
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(), // Generate UUID for the student
        name: studentData.name,
        email: studentData.email,
        role: 'student',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=8b5cf6&color=fff`
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error adding student:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get all courses a student is enrolled in
 */
export const getStudentCourses = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('courses:course_id(id, title, description, category, profiles:teacher_id(name))')
      .eq('student_id', studentId);

    if (error) throw error;
    
    // Transform the data to a more usable format
    const courses = data.map(enrollment => ({
      id: enrollment.courses.id,
      title: enrollment.courses.title,
      description: enrollment.courses.description,
      category: enrollment.courses.category,
      teacherName: enrollment.courses.profiles.name,
    }));
    
    return { courses, error: null };
  } catch (error: any) {
    console.error('Error fetching student courses:', error);
    return { courses: [], error: error.message };
  }
};

/**
 * Get all available courses that a student is not enrolled in
 */
export const getAvailableCoursesForStudent = async (studentId: string) => {
  try {
    // First get all courses the student is already enrolled in
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    if (enrollmentError) throw enrollmentError;
    
    const enrolledCourseIds = enrollments.map(e => e.course_id);
    
    // Then get all courses they're not enrolled in
    let query = supabase
      .from('courses')
      .select('id, title, description, category, profiles:teacher_id(name)');
    
    if (enrolledCourseIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledCourseIds.join(',')})`);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    
    // Transform the data
    const courses = data.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      teacherName: course.profiles.name,
    }));
    
    return { courses, error: null };
  } catch (error: any) {
    console.error('Error fetching available courses:', error);
    return { courses: [], error: error.message };
  }
};

/**
 * Self-enroll a student in a course
 */
export const selfEnrollInCourse = async (courseId: string, studentId: string) => {
  try {
    // Check if already enrolled
    const { data: existing, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (checkError) throw checkError;
    
    if (existing) {
      return { success: true, message: 'Already enrolled in this course' };
    }

    // Enroll in the course
    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId
      });

    if (error) throw error;
    return { success: true, message: 'Successfully enrolled in the course' };
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    return { success: false, message: error.message };
  }
};
