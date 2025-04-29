
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/cms';
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
      .maybeSingle();

    if (checkError) throw checkError;
    
    if (existingStudent) {
      return { data: existingStudent, error: 'Student with this email already exists' };
    }

    // Add new student
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
 * Get all students from the database
 */
export const getAllStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student');

    if (error) throw error;
    return { students: data, error: null };
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return { students: [], error: error.message };
  }
};

/**
 * Get available courses for a student
 * Courses that the student is not enrolled in yet
 */
export const getAvailableCoursesForStudent = async (studentId: string) => {
  try {
    // Get courses that student is not enrolled in
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, 
        title, 
        description, 
        category,
        teacher_id,
        profiles(name)
      `)
      .not('id', 'in', (subquery) => {
        return subquery
          .from('enrollments')
          .select('course_id')
          .eq('student_id', studentId);
      });

    if (error) throw error;
    
    // Format the response
    const coursesData = data.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description || '',
      category: course.category || 'other',
      teacherName: course.profiles?.name || 'Unknown Teacher'
    }));
    
    return { courses: coursesData, error: null };
  } catch (error: any) {
    console.error('Error fetching available courses:', error);
    return { courses: [], error: error.message };
  }
};

/**
 * Self enroll a student in a course
 */
export const selfEnrollInCourse = async (courseId: string, studentId: string) => {
  try {
    // Check if student is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (checkError) throw checkError;
    
    if (existingEnrollment) {
      return { success: false, message: 'You are already enrolled in this course' };
    }

    // Create new enrollment
    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId
      });

    if (error) throw error;
    
    return { success: true, message: 'Successfully enrolled in course' };
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    return { success: false, message: error.message };
  }
};
