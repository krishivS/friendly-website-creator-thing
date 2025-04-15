
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Course } from '@/types/cms';
import { CalendarCheck, ClipboardCheck, Plus } from 'lucide-react';
import CourseAttendanceList from '@/components/attendance/CourseAttendanceList';
import AttendanceForm from '@/components/attendance/AttendanceForm';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const AttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        let query;
        
        if (currentUser?.role === 'teacher') {
          // Teachers see the courses they teach
          query = supabase
            .from('courses')
            .select('*')
            .eq('teacher_id', currentUser.id);
        } else if (currentUser?.role === 'student') {
          // Students see the courses they're enrolled in
          query = supabase
            .from('courses')
            .select('*')
            .eq('enrollments.student_id', currentUser.id)
            .order('created_at', { ascending: false });
        } else if (currentUser?.role === 'admin') {
          // Admins see all courses
          query = supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        }

        if (query) {
          const { data, error } = await query;
          
          if (error) {
            console.error('Error fetching courses:', error);
            toast({
              title: 'Error',
              description: 'Failed to load courses',
              variant: 'destructive',
            });
          } else {
            setCourses(data as Course[]);
            if (data.length > 0 && !selectedCourse) {
              setSelectedCourse(data[0] as Course);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchCourses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchCourses();
    }
  }, [currentUser]);

  const startRecordingAttendance = () => {
    if (selectedCourse) {
      setIsRecording(true);
    } else {
      toast({
        title: 'Error',
        description: 'Please select a course first',
        variant: 'destructive',
      });
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cms-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-gray-500 mt-1">Track and manage course attendance</p>
      </div>
      
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-gray-500 mb-4">
              {currentUser?.role === 'teacher' 
                ? "You don't have any courses to manage attendance for." 
                : "You haven't been enrolled in any courses yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Course Selection */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>Select a course to view or record attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {courses.map((course) => (
                    <Button
                      key={course.id}
                      variant={selectedCourse?.id === course.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleCourseSelect(course)}
                    >
                      {course.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Attendance Tabs */}
          <div className="md:col-span-2">
            {isRecording ? (
              <AttendanceForm 
                course={selectedCourse!} 
                date={selectedDate} 
                onCancel={cancelRecording} 
                onSuccess={() => {
                  setIsRecording(false);
                  toast({
                    title: 'Success',
                    description: 'Attendance recorded successfully',
                  });
                }}
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>{selectedCourse?.title || 'Select a Course'}</CardTitle>
                    <CardDescription>
                      {selectedCourse 
                        ? `View and manage attendance for ${selectedCourse.title}` 
                        : 'Please select a course from the list'}
                    </CardDescription>
                  </div>
                  {currentUser?.role === 'teacher' && selectedCourse && (
                    <Button onClick={startRecordingAttendance}>
                      <Plus className="mr-2 h-4 w-4" />
                      Record Attendance
                    </Button>
                  )}
                </CardHeader>
                
                <CardContent>
                  {selectedCourse ? (
                    <Tabs defaultValue="calendar">
                      <TabsList className="mb-4">
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        <TabsTrigger value="list">Attendance Records</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="calendar">
                        <div className="flex flex-col">
                          <p className="text-sm mb-4">Select a date to view or record attendance:</p>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="rounded-md border mx-auto"
                          />
                          <Separator className="my-4" />
                          <div className="text-center">
                            <p className="font-medium">Selected: {format(selectedDate, 'PPP')}</p>
                            {currentUser?.role === 'teacher' && (
                              <Button 
                                onClick={startRecordingAttendance} 
                                className="mt-4"
                              >
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Record Attendance for {format(selectedDate, 'MMM d, yyyy')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="list">
                        {selectedCourse && (
                          <CourseAttendanceList 
                            courseId={selectedCourse.id} 
                            isTeacher={currentUser?.role === 'teacher'} 
                            studentId={currentUser?.role === 'student' ? currentUser.id : undefined}
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="text-center py-8">
                      <p>Please select a course to view attendance records</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
