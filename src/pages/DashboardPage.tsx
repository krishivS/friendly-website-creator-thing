
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Calendar, Users, BarChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StatCard from '@/components/cards/StatCard';
import CourseCard from '@/components/cards/CourseCard';
import AssignmentCard from '@/components/cards/AssignmentCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course, Assignment } from '@/types/cms';
import { getCourses, getTeacherCourses, getStudentCourses, getAssignmentsByCourseId } from '@/services/mockData';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        let fetchedCourses: Course[] = [];
        
        if (currentUser) {
          // Different API calls based on user role
          switch (currentUser.role) {
            case 'admin':
              fetchedCourses = await getCourses();
              break;
            case 'teacher':
              fetchedCourses = await getTeacherCourses(currentUser.id);
              break;
            case 'student':
              fetchedCourses = await getStudentCourses(currentUser.id);
              break;
            default:
              fetchedCourses = [];
          }
        }
        
        setCourses(fetchedCourses);
        
        // Get assignments for the first few courses
        if (fetchedCourses.length > 0) {
          const assignmentPromises = fetchedCourses
            .slice(0, 3)
            .map(course => getAssignmentsByCourseId(course.id));
          
          const assignmentsArrays = await Promise.all(assignmentPromises);
          const allAssignments = assignmentsArrays.flat();
          
          // Sort by due date (newest first)
          const sortedAssignments = allAssignments.sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );
          
          setRecentAssignments(sortedAssignments.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);
  
  // Stats based on fetched data
  const getStats = () => {
    return [
      {
        title: 'Total Courses',
        value: courses.length,
        icon: <BookOpen className="h-6 w-6 text-cms-primary" />,
        trend: { value: 12, isPositive: true },
      },
      {
        title: 'Assignments',
        value: recentAssignments.length,
        icon: <FileText className="h-6 w-6 text-cms-primary" />,
        trend: { value: 5, isPositive: true },
      },
      {
        title: 'Students',
        value: courses.reduce((acc, course) => acc + course.enrolledStudents, 0),
        icon: <Users className="h-6 w-6 text-cms-primary" />,
        trend: { value: 8, isPositive: true },
      },
      {
        title: 'Avg. Attendance',
        value: '85%',
        icon: <BarChart className="h-6 w-6 text-cms-primary" />,
        trend: { value: 3, isPositive: false },
      },
    ];
  };
  
  // Greeting based on the time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cms-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getGreeting()}, {currentUser?.name}</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your courses today.</p>
        </div>
        
        {/* Action buttons based on role */}
        {currentUser?.role === 'teacher' && (
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/courses/new">Create Course</Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Stats cards */}
      <div className="dashboard-stats">
        {getStats().map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="courses" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length > 0 ? (
              courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <h3 className="text-lg font-medium mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-4">
                    {currentUser?.role === 'teacher' 
                      ? "You don't have any courses yet. Create one to get started." 
                      : "You haven't been assigned any courses yet."}
                  </p>
                  {currentUser?.role === 'teacher' && (
                    <Button asChild>
                      <Link to="/courses/new">Create Course</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upcoming Assignments</h3>
            
            <div className="space-y-4">
              {recentAssignments.length > 0 ? (
                recentAssignments.map(assignment => (
                  <AssignmentCard 
                    key={assignment.id} 
                    assignment={assignment} 
                    courseId={assignment.courseId}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <h3 className="text-lg font-medium mb-2">No upcoming assignments</h3>
                    <p className="text-gray-500">You don't have any assignments due soon.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-16 w-16 text-cms-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Calendar View</h3>
              <p className="text-gray-500 mb-4">
                A full calendar implementation would be available here to track assignments, 
                quizzes, and class schedules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
