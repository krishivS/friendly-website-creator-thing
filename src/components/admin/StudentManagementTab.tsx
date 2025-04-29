
import React, { useState, useEffect } from 'react';
import { User } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAllStudents, removeUser, updateUserProfile } from '@/utils/adminUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StudentManagement from '@/components/students/StudentManagement';
import UserEditDialog from '@/components/admin/UserEditDialog';
import UserDeleteDialog from '@/components/admin/UserDeleteDialog';

const StudentManagementTab: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { students: studentData, error } = await getAllStudents();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive',
        });
        return;
      }
      
      setStudents(studentData);
      setFilteredStudents(studentData);
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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = students.filter(
        student => 
          student.name.toLowerCase().includes(lowercaseSearch) ||
          student.email.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchTerm, students]);

  const handleEditStudent = (student: User) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudent = (student: User) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleStudentUpdated = () => {
    fetchStudents();
    setIsEditDialogOpen(false);
  };

  const handleStudentDeleted = () => {
    fetchStudents();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-gray-500">Add, edit, or remove students from the platform</p>
        </div>
        <StudentManagement onStudentAdded={fetchStudents} />
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cms-primary"></div>
            </div>
          ) : filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback className="bg-cms-primary text-white">
                          {student.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditStudent(student)}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteStudent(student)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <UserPlus className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No students found</h3>
              <p className="text-gray-500 text-center max-w-md mb-4">
                {searchTerm
                  ? "No students match your search. Try adjusting your search terms."
                  : "No students have been added yet. Add students to get started."}
              </p>
              {!searchTerm && (
                <StudentManagement onStudentAdded={fetchStudents} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      {selectedStudent && (
        <UserEditDialog 
          user={selectedStudent}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUserUpdated={handleStudentUpdated}
        />
      )}
      
      {/* Delete Dialog */}
      {selectedStudent && (
        <UserDeleteDialog 
          user={selectedStudent}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onUserDeleted={handleStudentDeleted}
        />
      )}
    </div>
  );
};

export default StudentManagementTab;
