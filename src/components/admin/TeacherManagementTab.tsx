import React, { useState, useEffect } from 'react';
import { User } from '@/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAllTeachers, removeUser, updateUserProfile } from '@/utils/adminUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TeacherManagement from '@/components/teachers/TeacherManagement';
import UserEditDialog from '@/components/admin/UserEditDialog';
import UserDeleteDialog from '@/components/admin/UserDeleteDialog';

const TeacherManagementTab: React.FC = () => {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const { teachers: teacherData, error } = await getAllTeachers();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load teachers',
          variant: 'destructive',
        });
        return;
      }
      
      // Convert string role to UserRole type
      const typedTeachers = teacherData.map(teacher => ({
        ...teacher,
        role: teacher.role as User['role']
      }));
      
      setTeachers(typedTeachers);
      setFilteredTeachers(typedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = teachers.filter(
        teacher => 
          teacher.name.toLowerCase().includes(lowercaseSearch) ||
          teacher.email.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchTerm, teachers]);

  const handleEditTeacher = (teacher: User) => {
    setSelectedTeacher(teacher);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTeacher = (teacher: User) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleTeacherUpdated = () => {
    fetchTeachers();
    setIsEditDialogOpen(false);
  };

  const handleTeacherDeleted = () => {
    fetchTeachers();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Teacher Management</h2>
          <p className="text-gray-500">Add, edit, or remove teachers from the platform</p>
        </div>
        <TeacherManagement onTeacherAdded={fetchTeachers} />
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search teachers..."
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
          ) : filteredTeachers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} />
                        <AvatarFallback className="bg-cms-primary text-white">
                          {teacher.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{teacher.name}</span>
                    </TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditTeacher(teacher)}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteTeacher(teacher)}
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
              <h3 className="text-lg font-medium mb-1">No teachers found</h3>
              <p className="text-gray-500 text-center max-w-md mb-4">
                {searchTerm
                  ? "No teachers match your search. Try adjusting your search terms."
                  : "No teachers have been added yet. Add teachers to get started."}
              </p>
              {!searchTerm && (
                <TeacherManagement onTeacherAdded={fetchTeachers} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      {selectedTeacher && (
        <UserEditDialog 
          user={selectedTeacher}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onUserUpdated={handleTeacherUpdated}
        />
      )}
      
      {/* Delete Dialog */}
      {selectedTeacher && (
        <UserDeleteDialog 
          user={selectedTeacher}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onUserDeleted={handleTeacherDeleted}
        />
      )}
    </div>
  );
};

export default TeacherManagementTab;
