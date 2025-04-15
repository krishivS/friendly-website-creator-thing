
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend,
  className
}) => {
  return (
    <div className={cn("stats-card", className)}>
      <div className="p-3 rounded-full bg-cms-primary/10 mb-3">
        {icon}
      </div>
      
      <h3 className="text-3xl font-bold">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      
      {trend && (
        <div className={cn(
          "text-xs font-medium mt-2",
          trend.isPositive ? "text-green-600" : "text-red-600"
        )}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}%
          <span className="ml-1 text-gray-500">
            vs last month
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
