
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Course, User } from '@/types/cms';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AttendanceFormProps {
  course: Course;
  date: Date;
  onCancel: () => void;
  onSuccess: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  studentId: string;
  name: string;
  status: AttendanceStatus;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ course, date, onCancel, onSuccess }) => {
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        // First check if attendance already exists for this date and course
        const { data: existingAttendance, error: existingError } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('course_id', course.id)
          .eq('date', format(date, 'yyyy-MM-dd'))
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          // PGRST116 means no rows returned, which is fine
          console.error('Error checking existing attendance:', existingError);
          toast({
            title: 'Error',
            description: 'Failed to check existing attendance',
            variant: 'destructive',
          });
          return;
        }

        // If we found an existing record
        if (existingAttendance) {
          setExistingRecordId(existingAttendance.id);
          
          // Fetch existing attendance statuses
          const { data: existingStudents, error: studentsError } = await supabase
            .from('student_attendance')
            .select('id, status, profiles:student_id(id, name)')
            .eq('attendance_record_id', existingAttendance.id);

          if (studentsError) {
            console.error('Error fetching existing attendance:', studentsError);
            toast({
              title: 'Error',
              description: 'Failed to load existing attendance',
              variant: 'destructive',
            });
            return;
          }

          setStudents(
            existingStudents.map((s) => ({
              studentId: s.profiles.id,
              name: s.profiles.name,
              status: s.status as AttendanceStatus,
            }))
          );
        } else {
          // No existing record, fetch enrolled students
          const { data: enrolledStudents, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('profiles:student_id(id, name)')
            .eq('course_id', course.id);

          if (enrollmentError) {
            console.error('Error fetching enrollments:', enrollmentError);
            toast({
              title: 'Error',
              description: 'Failed to load enrolled students',
              variant: 'destructive',
            });
            return;
          }

          // Set initial attendance for all students to present
          setStudents(
            enrolledStudents.map((e) => ({
              studentId: e.profiles.id,
              name: e.profiles.name,
              status: 'present',
            }))
          );
        }
      } catch (error) {
        console.error('Error in fetchStudents:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [course.id, date]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleSubmit = async () => {
    if (students.length === 0) {
      toast({
        title: 'Error',
        description: 'No students to record attendance for',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let attendanceRecordId = existingRecordId;

      // If we don't have an existing record, create one
      if (!attendanceRecordId) {
        const { data: newRecord, error: recordError } = await supabase
          .from('attendance_records')
          .insert({
            course_id: course.id,
            date: format(date, 'yyyy-MM-dd'),
          })
          .select('id')
          .single();

        if (recordError) {
          throw recordError;
        }

        attendanceRecordId = newRecord.id;
      } else {
        // Delete existing student attendance records
        const { error: deleteError } = await supabase
          .from('student_attendance')
          .delete()
          .eq('attendance_record_id', attendanceRecordId);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Insert student attendance records
      const studentAttendanceRecords = students.map((student) => ({
        attendance_record_id: attendanceRecordId,
        student_id: student.studentId,
        status: student.status,
      }));

      const { error: insertError } = await supabase
        .from('student_attendance')
        .insert(studentAttendanceRecords);

      if (insertError) {
        throw insertError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance records',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Students...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cms-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingRecordId ? 'Edit' : 'Record'} Attendance - {course.title}
        </CardTitle>
        <p className="text-sm text-gray-500">Date: {format(date, 'PPPP')}</p>
      </CardHeader>
      
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No students enrolled</h3>
            <p className="text-gray-500">
              There are no students enrolled in this course.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {students.map((student) => (
              <div key={student.studentId} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{student.name}</h3>
                <RadioGroup
                  value={student.status}
                  onValueChange={(value) => handleStatusChange(student.studentId, value as AttendanceStatus)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="present" id={`present-${student.studentId}`} />
                    <Label htmlFor={`present-${student.studentId}`}>Present</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="absent" id={`absent-${student.studentId}`} />
                    <Label htmlFor={`absent-${student.studentId}`}>Absent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="late" id={`late-${student.studentId}`} />
                    <Label htmlFor={`late-${student.studentId}`}>Late</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excused" id={`excused-${student.studentId}`} />
                    <Label htmlFor={`excused-${student.studentId}`}>Excused</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving || students.length === 0}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Attendance'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceForm;
