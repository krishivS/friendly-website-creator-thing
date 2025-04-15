
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, UserPlus, Users, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getAllStudents, enrollStudent } from '@/utils/courseUtils';

interface StudentEnrollmentProps {
  courseId: string;
  onEnrollmentChange?: () => void;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const StudentEnrollment: React.FC<StudentEnrollmentProps> = ({ courseId, onEnrollmentChange }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { students, error } = await getAllStudents();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive',
        });
        return;
      }
      
      setStudents(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: 'No students selected',
        description: 'Please select at least one student to enroll',
        variant: 'destructive',
      });
      return;
    }

    setIsEnrolling(true);
    try {
      const promises = selectedStudents.map(studentId => 
        enrollStudent(courseId, studentId)
      );
      
      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.success);
      
      if (failures.length > 0) {
        toast({
          title: 'Enrollment Error',
          description: `Failed to enroll ${failures.length} students`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `${selectedStudents.length} students enrolled successfully`,
        });
        
        if (onEnrollmentChange) {
          onEnrollmentChange();
        }
        
        setIsOpen(false);
        setSelectedStudents([]);
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll students',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
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

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          Enroll Students
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="border rounded-md p-1">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cms-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading students...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="max-h-72 overflow-y-auto">
                {filteredStudents.map(student => (
                  <div key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded-sm">
                    <Checkbox 
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                    />
                    <Label 
                      htmlFor={`student-${student.id}`} 
                      className="flex-1 cursor-pointer ml-2"
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No students found</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-sm text-gray-500">
                {selectedStudents.length} students selected
              </span>
            </div>
            <Button 
              onClick={handleEnrollStudents}
              disabled={selectedStudents.length === 0 || isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enrolling...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Enroll Selected
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEnrollment;
