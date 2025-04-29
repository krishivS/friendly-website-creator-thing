
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>
          Configure global platform settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Settings features coming soon.</p>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
