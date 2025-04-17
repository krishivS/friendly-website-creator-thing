
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getEnrolledStudents, recordAttendance, getAttendanceForDate } from '@/utils/courseUtils';
import { Loader2, UserCheck, UserX, Clock, Shield } from 'lucide-react';

interface QuickAttendanceProps {
  courseId: string;
  onComplete?: () => void;
}

interface Student {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

const QuickAttendance: React.FC<QuickAttendanceProps> = ({ courseId, onComplete }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [today] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // First try to get today's attendance
      const { attendances, error: attendanceError } = await getAttendanceForDate(courseId, today);
      
      if (attendanceError) {
        toast({
          title: 'Error',
          description: 'Failed to check existing attendance',
          variant: 'destructive',
        });
        return;
      }

      // If we have attendance data for today, use it
      if (attendances.length > 0) {
        setStudents(attendances.map(a => ({
          id: a.studentId,
          name: a.studentName,
          status: a.status as 'present' | 'absent' | 'late' | 'excused'
        })));
        setIsLoading(false);
        return;
      }

      // Otherwise get enrolled students and mark all as present by default
      const { students: enrolledStudents, error } = await getEnrolledStudents(courseId);
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive',
        });
        return;
      }
      
      setStudents(enrolledStudents.map(student => ({
        id: student.id,
        name: student.name,
        status: 'present' as const // Explicitly type as const to satisfy TypeScript
      })));
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

  const handleStatusChange = (studentId: string, newStatus: 'present' | 'absent' | 'late' | 'excused') => {
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleMarkAllAs = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setStudents(prev => 
      prev.map(student => ({ ...student, status }))
    );
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      toast({
        title: 'No students',
        description: 'There are no students to mark attendance for',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const studentAttendances = students.map(student => ({
        studentId: student.id,
        status: student.status
      }));

      const { success, error } = await recordAttendance(courseId, today, studentAttendances);
      
      if (!success) {
        throw new Error(error || 'Failed to save attendance');
      }
      
      toast({
        title: 'Success',
        description: 'Today\'s attendance has been recorded',
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading students...</p>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <p className="mb-4">No students are enrolled in this course.</p>
          <Button variant="outline" onClick={onComplete}>Back</Button>
        </CardContent>
      </Card>
    );
  }

  // Count students by status
  const statusCounts = {
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length,
    excused: students.filter(s => s.status === 'excused').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Attendance for Today</CardTitle>
        <CardDescription>{format(new Date(today), 'PPPP')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status summary */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="flex items-center gap-1">
              Total: {students.length}
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Present: {statusCounts.present}
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Absent: {statusCounts.absent}
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Late: {statusCounts.late}
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Excused: {statusCounts.excused}
            </Badge>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleMarkAllAs('present')}>
              <UserCheck className="h-4 w-4 mr-1" /> Mark All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleMarkAllAs('absent')}>
              <UserX className="h-4 w-4 mr-1" /> Mark All Absent
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleMarkAllAs('late')}>
              <Clock className="h-4 w-4 mr-1" /> Mark All Late
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleMarkAllAs('excused')}>
              <Shield className="h-4 w-4 mr-1" /> Mark All Excused
            </Button>
          </div>

          {/* Student list */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {students.map(student => (
              <div key={student.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{student.name}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={student.status === 'present' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(student.id, 'present')}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'absent' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(student.id, 'absent')}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'late' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(student.id, 'late')}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'excused' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(student.id, 'excused')}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onComplete}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttendance} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Attendance'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAttendance;
