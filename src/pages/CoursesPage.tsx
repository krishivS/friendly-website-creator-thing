
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCourses, getTeacherCourses, getStudentCourses, getCourseCategories } from '@/services/mockData';
import { Course, CourseCategory } from '@/types/cms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CourseCard from '@/components/cards/CourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Plus, Search } from 'lucide-react';

const CoursesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const categories = getCourseCategories();
  
  useEffect(() => {
    const fetchCourses = async () => {
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
        setFilteredCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [currentUser]);
  
  // Filter courses based on search term and category
  useEffect(() => {
    const filterCourses = () => {
      let filtered = courses;
      
      // Filter by search term
      if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(
          course => 
            course.title.toLowerCase().includes(lowerCaseSearch) ||
            course.description.toLowerCase().includes(lowerCaseSearch)
        );
      }
      
      // Filter by category
      if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(course => course.category === categoryFilter);
      }
      
      setFilteredCourses(filtered);
    };
    
    filterCourses();
  }, [searchTerm, categoryFilter, courses]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cms-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-gray-500 mt-1">Browse all available courses</p>
        </div>
        
        {/* Only show create button for teachers and admins */}
        {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && (
          <Button className="mt-4 md:mt-0" asChild>
            <Link to="/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="capitalize">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Courses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== 'all'
                  ? "No courses match your current filters. Try adjusting your search terms."
                  : currentUser?.role === 'teacher'
                    ? "You haven't created any courses yet."
                    : "There are no courses available currently."}
              </p>
              
              {(currentUser?.role === 'teacher' || currentUser?.role === 'admin') && 
               !searchTerm && categoryFilter === 'all' && (
                <Button asChild>
                  <Link to="/courses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
