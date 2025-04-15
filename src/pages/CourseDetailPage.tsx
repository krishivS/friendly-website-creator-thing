
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseById, getAssignmentsByCourseId, getQuizzesByCourseId, getAttendanceByCourseId } from '@/services/mockData';
import { Course, Assignment, Quiz, AttendanceRecord } from '@/types/cms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AssignmentCard from '@/components/cards/AssignmentCard';
import AttendanceTable from '@/components/tables/AttendanceTable';
import { FileText, Users, Calendar, BookOpen, Clock, Plus, ArrowLeft } from 'lucide-react';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      setIsLoading(true);
      
      try {
        // Fetch course details
        const fetchedCourse = await getCourseById(courseId);
        
        if (!fetchedCourse) {
          // Course not found
          navigate('/courses', { replace: true });
          return;
        }
        
        setCourse(fetchedCourse);
        
        // Fetch associated data
        const [fetchedAssignments, fetchedQuizzes, fetchedAttendance] = await Promise.all([
          getAssignmentsByCourseId(courseId),
          getQuizzesByCourseId(courseId),
          getAttendanceByCourseId(courseId),
        ]);
        
        setAssignments(fetchedAssignments);
        setQuizzes(fetchedQuizzes);
        setAttendanceRecords(fetchedAttendance);
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, navigate]);
  
  // Helper to determine if the current user is the teacher of this course
  const isTeacherOfCourse = currentUser?.role === 'teacher' && course?.teacherId === currentUser.id;
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cms-primary"></div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <p className="text-gray-500 mt-2">The requested course does not exist.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Course Header */}
      <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <Badge variant="outline" className="capitalize">
              {course.category}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">{course.description}</p>
        </div>
        
        {/* Teacher actions */}
        {isTeacherOfCourse && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <span>
                <Clock className="mr-2 h-4 w-4" />
                Take Attendance
              </span>
            </Button>
            <Button asChild>
              <span>
                <Plus className="mr-2 h-4 w-4" />
                Add Content
              </span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Course Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-cms-primary" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{course.enrolledStudents}</p>
            <p className="text-sm text-gray-500">Enrolled in this course</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-cms-primary" />
              Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{assignments.length}</p>
            <p className="text-sm text-gray-500">Total assignments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-cms-primary" />
              Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">April 15, 2025</p>
            <p className="text-sm text-gray-500">Course start date</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Course Content Tabs */}
      <Tabs defaultValue="materials" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>
                Access all learning materials for this course
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No materials uploaded yet</h3>
              <p className="text-gray-500 mb-4">
                The instructor hasn't uploaded any course materials yet.
              </p>
              
              {isTeacherOfCourse && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Materials
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Assignments</h2>
              
              {isTeacherOfCourse && (
                <Button className="mt-2 md:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {assignments.length > 0 ? (
                assignments.map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    courseId={course.id}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                    <p className="text-gray-500 mb-4">
                      There are no assignments for this course yet.
                    </p>
                    
                    {isTeacherOfCourse && (
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Assignment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="quizzes">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Quizzes</h2>
              
              {isTeacherOfCourse && (
                <Button className="mt-2 md:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {quizzes.length > 0 ? (
                quizzes.map(quiz => (
                  <Card key={quiz.id} className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="flex items-start md:items-center flex-col md:flex-row gap-2 md:gap-4">
                        <div className="p-2 rounded-full bg-cms-primary/10">
                          <FileText className="h-5 w-5 text-cms-primary" />
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{quiz.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {quiz.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end mt-4 md:mt-0">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            Due: {new Date(quiz.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <Button size="sm" className="mt-2">
                          {currentUser?.role === 'student' ? 'Take Quiz' : 'View Quiz'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No quizzes yet</h3>
                    <p className="text-gray-500 mb-4">
                      There are no quizzes for this course yet.
                    </p>
                    
                    {isTeacherOfCourse && (
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="attendance">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Attendance Records</h2>
              
              {isTeacherOfCourse && (
                <Button className="mt-2 md:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Attendance
                </Button>
              )}
            </div>
            
            {attendanceRecords.length > 0 ? (
              <AttendanceTable attendanceRecords={attendanceRecords} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No attendance records</h3>
                  <p className="text-gray-500 mb-4">
                    There are no attendance records for this course yet.
                  </p>
                  
                  {isTeacherOfCourse && (
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Record Attendance
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetailPage;
