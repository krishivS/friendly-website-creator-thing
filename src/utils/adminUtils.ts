
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/cms';
import { toast } from '@/hooks/use-toast';

/**
 * Add a new teacher to the database
 */
export const addTeacher = async (
  teacherData: { 
    name: string; 
    email: string;
  }
) => {
  try {
    // Check if teacher with this email already exists
    const { data: existingTeacher, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', teacherData.email)
      .maybeSingle();

    if (checkError) throw checkError;
    
    if (existingTeacher) {
      return { data: existingTeacher, error: 'Teacher with this email already exists' };
    }

    // Add new teacher
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(), // Generate UUID for the teacher
        name: teacherData.name,
        email: teacherData.email,
        role: 'teacher',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherData.name)}&background=8b5cf6&color=fff`
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error adding teacher:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Remove a user (teacher or student) from the database
 */
export const removeUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error removing user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all teachers from the database
 */
export const getAllTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher');

    if (error) throw error;
    return { teachers: data, error: null };
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    return { teachers: [], error: error.message };
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
 * Update user profile information
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: { 
    name?: string; 
    email?: string;
    role?: UserRole;
    avatar?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { data: null, error: error.message };
  }
};
