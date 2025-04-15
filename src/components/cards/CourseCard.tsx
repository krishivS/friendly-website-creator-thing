
import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '@/types/cms';
import { BookOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  // Map category to background color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'math':
        return 'bg-cms-course-math';
      case 'science':
        return 'bg-cms-course-science';
      case 'literature':
        return 'bg-cms-course-literature';
      case 'history':
        return 'bg-cms-course-history';
      case 'programming':
        return 'bg-cms-course-programming';
      default:
        return 'bg-gray-100';
    }
  };
  
  return (
    <Link 
      to={`/courses/${course.id}`}
      className={cn(
        'course-card block animate-fade-in', 
        getCategoryColor(course.category)
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold line-clamp-1">{course.title}</h3>
        <Badge variant="outline" className="capitalize">
          {course.category}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {course.description}
      </p>
      
      <div className="flex justify-between items-center text-sm text-gray-500 mt-auto">
        <div className="flex items-center">
          <BookOpen className="h-4 w-4 mr-1 text-cms-primary" />
          <span>Teacher: {course.teacherName}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-cms-primary" />
          <span>{course.enrolledStudents} students</span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
