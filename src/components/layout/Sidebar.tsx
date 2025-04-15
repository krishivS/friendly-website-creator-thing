
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  ClipboardList,
  Calendar,
  User,
  Users,
  FileText,
  Settings,
  BarChart3,
  LogOut,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  
  // Different navigation items based on user role
  const getNavItems = () => {
    if (!currentUser) return [];
    
    switch(currentUser.role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: Home },
          { name: 'Courses', path: '/courses', icon: BookOpen },
          { name: 'Teachers', path: '/teachers', icon: Users },
          { name: 'Students', path: '/students', icon: Users },
          { name: 'Reports', path: '/reports', icon: BarChart3 },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'teacher':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: Home },
          { name: 'My Courses', path: '/courses', icon: BookOpen },
          { name: 'Assignments', path: '/assignments', icon: FileText },
          { name: 'Attendance', path: '/attendance', icon: ClipboardList },
          { name: 'Calendar', path: '/calendar', icon: Calendar },
          { name: 'Students', path: '/students', icon: Users },
          { name: 'Profile', path: '/profile', icon: User },
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: Home },
          { name: 'My Courses', path: '/courses', icon: BookOpen },
          { name: 'Assignments', path: '/assignments', icon: FileText },
          { name: 'Attendance', path: '/attendance', icon: ClipboardList },
          { name: 'Calendar', path: '/calendar', icon: Calendar },
          { name: 'Profile', path: '/profile', icon: User },
        ];
      default:
        return [];
    }
  };
  
  const navItems = getNavItems();
  
  return (
    <div className="min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col w-64 shadow-sm">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-cms-primary flex items-center">
          <BookOpen className="mr-2 h-6 w-6" />
          CMS Platform
        </h1>
      </div>
      
      {currentUser && (
        <div className="p-4 border-b border-sidebar-border flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback className="bg-cms-primary text-white">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-sm">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
