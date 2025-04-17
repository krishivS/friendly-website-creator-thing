
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Search, BookOpen, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAvailableCoursesForStudent, selfEnrollInCourse } from '@/utils/studentUtils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface CourseEnrollmentProps {
  onEnrollmentChange?: () => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  teacherName: string;
}

const CourseEnrollment: React.FC<CourseEnrollmentProps> = ({ onEnrollmentChange }) => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchAvailableCourses();
    }
  }, [isOpen, currentUser]);

  const fetchAvailableCourses = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const { courses, error } = await getAvailableCoursesForStudent(currentUser.id);
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load available courses',
          variant: 'destructive',
        });
        return;
      }
      
      setCourses(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to enroll in courses',
        variant: 'destructive',
      });
      return;
    }

    setEnrollingCourseId(courseId);
    try {
      const { success, message } = await selfEnrollInCourse(courseId, currentUser.id);
      
      if (!success) {
        toast({
          title: 'Error',
          description: message || 'Failed to enroll in course',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'You have been enrolled in the course',
      });
      
      // Remove the course from the list
      setCourses(prev => prev.filter(c => c.id !== courseId));
      
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll in course',
        variant: 'destructive',
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <BookOpen className="mr-2 h-4 w-4" />
          Enroll in Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Available Courses</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses by title, description or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="border rounded-md">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cms-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading courses...</p>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="max-h-72 overflow-y-auto p-1">
                {filteredCourses.map(course => (
                  <Card key={course.id} className="mb-2 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                          <div className="flex mt-2 space-x-2 items-center">
                            <Badge variant="outline">{course.category}</Badge>
                            <span className="text-xs text-gray-500">Teacher: {course.teacherName}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingCourseId === course.id}
                        >
                          {enrollingCourseId === course.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Enroll
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  {searchTerm 
                    ? "No courses match your search" 
                    : "No available courses found. You might be enrolled in all existing courses."}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEnrollment;
