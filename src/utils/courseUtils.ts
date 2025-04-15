
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Add a new course to the database
 */
export const addCourse = async (
  courseData: { 
    title: string; 
    description: string; 
    category: string;
    teacher_id: string | undefined;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        teacher_id: courseData.teacher_id
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error adding course:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get students who are enrolled in a course
 */
export const getEnrolledStudents = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('profiles:student_id(id, name, email, role)')
      .eq('course_id', courseId);

    if (error) throw error;
    
    // Transform the data to a more usable format
    const students = data.map(enrollment => ({
      id: enrollment.profiles.id,
      name: enrollment.profiles.name,
      email: enrollment.profiles.email,
      role: enrollment.profiles.role
    }));
    
    return { students, error: null };
  } catch (error: any) {
    console.error('Error fetching enrolled students:', error);
    return { students: [], error: error.message };
  }
};

/**
 * Enroll a student in a course
 */
export const enrollStudent = async (courseId: string, studentId: string) => {
  try {
    // Check if the student is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (checkError) throw checkError;
    
    // If already enrolled, don't create a duplicate
    if (existingEnrollment) {
      return { success: true, message: 'Student is already enrolled' };
    }

    // Enroll the student
    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId
      });

    if (error) throw error;
    return { success: true, message: 'Student enrolled successfully' };
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get all students from the database
 */
export const getAllStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'student');

    if (error) throw error;
    return { students: data, error: null };
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return { students: [], error: error.message };
  }
};

/**
 * Record attendance for a specific date
 */
export const recordAttendance = async (
  courseId: string, 
  date: string, 
  studentAttendances: { studentId: string; status: 'present' | 'absent' | 'late' | 'excused' }[]
) => {
  try {
    // Check if attendance record already exists for this date and course
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('course_id', courseId)
      .eq('date', date)
      .maybeSingle();

    if (checkError) throw checkError;

    let attendanceRecordId: string;

    if (existingRecord) {
      // Record exists, delete existing student attendances to update them
      attendanceRecordId = existingRecord.id;
      const { error: deleteError } = await supabase
        .from('student_attendance')
        .delete()
        .eq('attendance_record_id', attendanceRecordId);

      if (deleteError) throw deleteError;
    } else {
      // Create new attendance record
      const { data: newRecord, error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          course_id: courseId,
          date: date
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      attendanceRecordId = newRecord.id;
    }

    // Insert student attendance records
    const studentRecords = studentAttendances.map(attendance => ({
      attendance_record_id: attendanceRecordId,
      student_id: attendance.studentId,
      status: attendance.status
    }));

    const { error: insertError } = await supabase
      .from('student_attendance')
      .insert(studentRecords);

    if (insertError) throw insertError;

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get attendance for a specific date and course
 */
export const getAttendanceForDate = async (courseId: string, date: string) => {
  try {
    const { data: record, error: recordError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('course_id', courseId)
      .eq('date', date)
      .maybeSingle();

    if (recordError) throw recordError;

    if (!record) {
      return { attendances: [], error: null };
    }

    const { data: attendances, error: attendanceError } = await supabase
      .from('student_attendance')
      .select('id, status, profiles:student_id(id, name)')
      .eq('attendance_record_id', record.id);

    if (attendanceError) throw attendanceError;

    return { 
      attendances: attendances.map(a => ({
        id: a.id,
        studentId: a.profiles.id,
        studentName: a.profiles.name,
        status: a.status
      })), 
      error: null 
    };
  } catch (error: any) {
    console.error('Error getting attendance:', error);
    return { attendances: [], error: error.message };
  }
};

/**
 * Update attendance status for a student
 */
export const updateAttendanceStatus = async (attendanceId: string, newStatus: 'present' | 'absent' | 'late' | 'excused') => {
  try {
    const { error } = await supabase
      .from('student_attendance')
      .update({ status: newStatus })
      .eq('id', attendanceId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error updating attendance status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete an attendance record and all related student attendance records
 */
export const deleteAttendanceRecord = async (recordId: string) => {
  try {
    // The student_attendance records will be deleted by cascade
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error deleting attendance record:', error);
    return { success: false, error: error.message };
  }
};
