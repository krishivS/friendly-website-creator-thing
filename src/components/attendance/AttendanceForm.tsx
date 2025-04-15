
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Course, User } from '@/types/cms';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Search, Filter, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState('all');
  
  // Enhanced filtering options
  const [filteredStudents, setFilteredStudents] = useState<StudentAttendance[]>([]);
  const [bulkAction, setBulkAction] = useState<AttendanceStatus | ''>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    fetchStudents();
  }, [course.id, date]);

  useEffect(() => {
    // Filter students based on search and status filter
    let filtered = [...students];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }
    
    if (selectedTab !== 'all') {
      filtered = filtered.filter(student => {
        if (selectedTab === 'present') return student.status === 'present';
        if (selectedTab === 'absent') return student.status === 'absent';
        if (selectedTab === 'late') return student.status === 'late';
        if (selectedTab === 'excused') return student.status === 'excused';
        return true;
      });
    }
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter, selectedTab]);

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

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      toast({
        title: 'Error',
        description: 'Please select an action',
        variant: 'destructive',
      });
      return;
    }

    // If no students are selected, apply to all filtered students
    const studentsToUpdate = selectedStudents.length > 0 
      ? selectedStudents 
      : filteredStudents.map(s => s.studentId);

    setStudents(prev => 
      prev.map(student => {
        if (studentsToUpdate.includes(student.studentId)) {
          return { ...student, status: bulkAction as AttendanceStatus };
        }
        return student;
      })
    );

    // Clear selection after applying
    setSelectedStudents([]);
    setBulkAction('');
    
    toast({
      title: 'Success',
      description: `Marked ${studentsToUpdate.length} students as ${bulkAction}`,
    });
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      // Deselect all
      setSelectedStudents([]);
    } else {
      // Select all filtered students
      setSelectedStudents(filteredStudents.map(s => s.studentId));
    }
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

  // Get counts for status badges
  const getStatusCounts = () => {
    const counts = {
      present: students.filter(s => s.status === 'present').length,
      absent: students.filter(s => s.status === 'absent').length,
      late: students.filter(s => s.status === 'late').length,
      excused: students.filter(s => s.status === 'excused').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              {existingRecordId ? 'Edit' : 'Record'} Attendance - {course.title}
            </CardTitle>
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" /> 
              Date: {format(date, 'PPPP')}
            </p>
          </div>
        </div>
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
            {/* Statistics and filters */}
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

            {/* Search and filter controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="present">Present</TabsTrigger>
                  <TabsTrigger value="absent">Absent</TabsTrigger>
                  <TabsTrigger value="late">Late</TabsTrigger>
                  <TabsTrigger value="excused">Excused</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Bulk action controls */}
            <div className="flex flex-col md:flex-row gap-2 items-center p-3 border rounded-lg bg-gray-50 mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                  onCheckedChange={toggleAllStudents}
                />
                <Label htmlFor="select-all">Select All</Label>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex items-center gap-2">
                <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as AttendanceStatus | '')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Mark selected as..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="secondary" 
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Students list */}
            <div className="space-y-4">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div key={student.studentId} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox 
                        id={`select-${student.studentId}`} 
                        checked={selectedStudents.includes(student.studentId)}
                        onCheckedChange={() => toggleStudentSelection(student.studentId)}
                      />
                      <Label htmlFor={`select-${student.studentId}`} className="font-medium">{student.name}</Label>
                    </div>
                    
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
                ))
              ) : (
                <div className="text-center py-6 border rounded-lg">
                  <p className="text-gray-500">No students match your filters</p>
                </div>
              )}
            </div>
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
