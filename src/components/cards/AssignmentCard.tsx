
import React from 'react';
import { Link } from 'react-router-dom';
import { Assignment } from '@/types/cms';
import { format, isPast } from 'date-fns';
import { FileText, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AssignmentCardProps {
  assignment: Assignment;
  courseId: string;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, courseId }) => {
  const dueDate = new Date(assignment.dueDate);
  const isPastDue = isPast(dueDate);
  
  return (
    <div className="assignment-card">
      <div className="flex-1">
        <div className="flex items-start md:items-center flex-col md:flex-row gap-2 md:gap-4">
          <div className="p-2 rounded-full bg-cms-primary/10">
            <FileText className="h-5 w-5 text-cms-primary" />
          </div>
          
          <div>
            <h3 className="font-medium">{assignment.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{assignment.description}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:items-end mt-4 md:mt-0">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-sm text-gray-500">
            Due: {format(dueDate, 'MMM dd, yyyy')}
          </span>
        </div>
        
        <div className="flex items-center mt-2 space-x-2">
          <Badge variant={isPastDue ? "destructive" : "outline"}>
            {isPastDue ? 'Past due' : 'Open'}
          </Badge>
          <Button size="sm" asChild>
            <Link to={`/courses/${courseId}/assignments/${assignment.id}`}>
              View
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;
