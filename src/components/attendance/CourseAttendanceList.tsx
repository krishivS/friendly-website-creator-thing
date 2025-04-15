
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/cms';
import { toast } from '@/hooks/use-toast';
import { CalendarDays } from 'lucide-react';

interface CourseAttendanceListProps {
  courseId: string;
  isTeacher: boolean;
  studentId?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  courseId: string;
  students: {
    id: string;
    name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
}

const CourseAttendanceList: React.FC<CourseAttendanceListProps> = ({ courseId, isTeacher, studentId }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      setIsLoading(true);
      try {
        // Fetch attendance records for the course
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('id, date, course_id')
          .eq('course_id', courseId)
          .order('date', { ascending: false });

        if (attendanceError) {
          throw attendanceError;
        }

        if (!attendanceData || attendanceData.length === 0) {
          setAttendanceRecords([]);
          setIsLoading(false);
          return;
        }

        // For each attendance record, fetch the student attendance details
        const recordsWithStudents = await Promise.all(
          attendanceData.map(async (record) => {
            let query = supabase
              .from('student_attendance')
              .select('id, status, profiles:student_id(id, name)')
              .eq('attendance_record_id', record.id);

            // If we're a student, only get our own attendance
            if (!isTeacher && studentId) {
              query = query.eq('student_id', studentId);
            }

            const { data: studentData, error: studentError } = await query;

            if (studentError) {
              throw studentError;
            }

            return {
              id: record.id,
              date: record.date,
              courseId: record.course_id,
              students: studentData.map((s) => ({
                id: s.profiles.id,
                name: s.profiles.name,
                status: s.status as 'present' | 'absent' | 'late' | 'excused',
              })),
            };
          })
        );

        setAttendanceRecords(recordsWithStudents);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance records',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchAttendanceRecords();
    }
  }, [courseId, isTeacher, studentId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Late</Badge>;
      case 'excused':
        return <Badge variant="outline">Excused</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cms-primary"></div>
      </div>
    );
  }

  if (attendanceRecords.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No attendance records</h3>
        <p className="text-gray-500">
          {isTeacher
            ? "You haven't recorded any attendance for this course yet."
            : "No attendance has been recorded for this course yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceRecords.flatMap((record) =>
            record.students.map((student) => (
              <TableRow key={`${record.id}-${student.id}`}>
                <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{getStatusBadge(student.status)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseAttendanceList;
