
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
