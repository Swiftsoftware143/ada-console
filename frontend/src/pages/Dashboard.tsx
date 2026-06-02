import React from 'react';
import { Layout, Activity, Users, Settings } from 'lucide-react';
import { DashboardCard } from '../components/DashboardCard';
import { StatCard } from '../components/StatCard';

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Widget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Widgets"
          value="12"
          description="Active ADA widgets"
          icon={Layout}
          trend={{ value: 15, isPositive: true }}
        />
        <DashboardCard
          title="Interactions"
          value="2,847"
          description="This month"
          icon={Activity}
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard
          title="Active Users"
          value="156"
          description="Unique visitors"
          icon={Users}
          trend={{ value: 3, isPositive: false }}
        />
        <DashboardCard
          title="Settings"
          value="4"
          description="Configured"
          icon={Settings}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-500">Activity chart will appear here</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <StatCard
              title="Conversion Rate"
              value="3.2%"
              change="+0.5% from last week"
              changeType="positive"
              icon={Activity}
            />
            <StatCard
              title="Avg. Session"
              value="4m 32s"
              change="+12s from last week"
              changeType="positive"
              icon={Users}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
