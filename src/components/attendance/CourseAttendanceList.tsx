
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parse } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/cms';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, Filter, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    attendanceId: string; // added for updating individual records
    name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
}

const CourseAttendanceList: React.FC<CourseAttendanceListProps> = ({ courseId, isTeacher, studentId }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    attendanceId: string;
    name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  } | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [courseId, isTeacher, studentId]);

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
              attendanceId: s.id, // Store the attendance record ID for updates
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

  const handleEditStatus = (recordId: string, student: {
    id: string;
    attendanceId: string;
    name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }) => {
    const record = attendanceRecords.find(r => r.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setSelectedStudent(student);
      setIsEditingRecord(true);
    }
  };

  const handleStatusChange = async (newStatus: 'present' | 'absent' | 'late' | 'excused') => {
    if (!selectedStudent) return;
    
    try {
      const { error } = await supabase
        .from('student_attendance')
        .update({ status: newStatus })
        .eq('id', selectedStudent.attendanceId);
        
      if (error) throw error;
      
      // Update local state
      setAttendanceRecords(prevRecords => 
        prevRecords.map(record => {
          if (record.id === selectedRecord?.id) {
            return {
              ...record,
              students: record.students.map(student => {
                if (student.id === selectedStudent.id) {
                  return { ...student, status: newStatus };
                }
                return student;
              })
            };
          }
          return record;
        })
      );
      
      setIsEditingRecord(false);
      toast({
        title: 'Success',
        description: 'Attendance status updated',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance status',
        variant: 'destructive',
      });
    }
  };

  const confirmDeleteRecord = (recordId: string) => {
    setRecordToDelete(recordId);
    setIsConfirmingDelete(true);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    try {
      // Delete the attendance record - cascade will handle the student_attendance records
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordToDelete);
        
      if (error) throw error;
      
      // Update local state
      setAttendanceRecords(prevRecords => 
        prevRecords.filter(record => record.id !== recordToDelete)
      );
      
      setIsConfirmingDelete(false);
      setRecordToDelete(null);
      
      toast({
        title: 'Success',
        description: 'Attendance record deleted',
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete attendance record',
        variant: 'destructive',
      });
    }
  };

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter(record => {
    // Date filter
    if (dateFilter && record.date !== dateFilter) {
      return false;
    }
    
    // Student filter
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      const hasMatchingStudent = record.students.some(student => 
        student.name.toLowerCase().includes(termLower)
      );
      if (!hasMatchingStudent) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const hasMatchingStatus = record.students.some(student => 
        student.status === statusFilter
      );
      if (!hasMatchingStatus) return false;
    }
    
    return true;
  });
  
  // Get unique dates for filter
  const uniqueDates = [...new Set(attendanceRecords.map(record => record.date))];

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
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All dates</SelectItem>
              {uniqueDates.map(date => (
                <SelectItem key={date} value={date}>
                  {format(new Date(date), 'MMM dd, yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              {isTeacher && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.flatMap((record) =>
              record.students.map((student) => (
                <TableRow key={`${record.id}-${student.id}`} className="group">
                  <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  {isTeacher && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditStatus(record.id, student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => confirmDeleteRecord(record.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
            
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={isTeacher ? 4 : 3} className="text-center py-4">
                  No attendance records match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit status dialog */}
      <Dialog open={isEditingRecord} onOpenChange={setIsEditingRecord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">
              <strong>Student:</strong> {selectedStudent?.name}
            </p>
            <p className="mb-4">
              <strong>Date:</strong> {selectedRecord ? format(new Date(selectedRecord.date), 'PPPP') : ''}
            </p>
            
            <div className="space-y-4">
              <RadioGroup
                value={selectedStudent?.status}
                onValueChange={(value: 'present' | 'absent' | 'late' | 'excused') => 
                  handleStatusChange(value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="present" id="present" />
                  <Label htmlFor="present">Present</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="absent" id="absent" />
                  <Label htmlFor="absent">Absent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="late" id="late" />
                  <Label htmlFor="late">Late</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excused" id="excused" />
                  <Label htmlFor="excused">Excused</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingRecord(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this attendance record?</p>
            <p className="text-gray-500 mt-2">This will delete the attendance for all students on this date and cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecord}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseAttendanceList;
