import React, { useState } from 'react';
import { User, Lock, Bell, Globe, CreditCard, Shield, Clock, Save, Mail, Phone, Building, MapPin, Calendar } from 'lucide-react';
const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const tabs = [{
    id: 'profile',
    name: 'Profile Settings',
    icon: <User size={18} />
  }, {
    id: 'security',
    name: 'Security',
    icon: <Lock size={18} />
  }, {
    id: 'notifications',
    name: 'Notifications',
    icon: <Bell size={18} />
  }, {
    id: 'preferences',
    name: 'Preferences',
    icon: <Globe size={18} />
  }, {
    id: 'billing',
    name: 'Billing',
    icon: <CreditCard size={18} />
  }, {
    id: 'privacy',
    name: 'Privacy',
    icon: <Shield size={18} />
  }, {
    id: 'activity',
    name: 'Activity Log',
    icon: <Clock size={18} />
  }];
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'preferences':
        return <PreferenceSettings />;
      case 'billing':
        return <BillingSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'activity':
        return <ActivitySettings />;
      default:
        return <ProfileSettings />;
    }
  };
  return <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Account Settings
        </h2>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <nav className="space-y-1 p-2">
                {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-3 rounded-md text-sm font-medium ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <span className="mr-3">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>)}
              </nav>
            </div>
          </div>
          {/* Tab Content */}
          <div className="flex-1">{renderTabContent()}</div>
        </div>
      </div>
    </div>;
};
const ProfileSettings = () => {
  return <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
          <User size={40} className="text-blue-600" />
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-800">Profile Picture</h3>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              Upload New
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
              Remove
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input type="text" id="firstName" defaultValue="Sarah" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input type="text" id="lastName" defaultValue="Johnson" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="flex items-center">
              <Mail size={16} className="text-gray-400 absolute ml-3" />
              <input type="email" id="email" defaultValue="sarah.johnson@company.com" className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="flex items-center">
              <Phone size={16} className="text-gray-400 absolute ml-3" />
              <input type="tel" id="phone" defaultValue="+94 71 123 4567" className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <div className="flex items-center">
              <Building size={16} className="text-gray-400 absolute ml-3" />
              <input type="text" id="organization" defaultValue="ABC Corporation" className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input type="text" id="position" defaultValue="Corporate Agent" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="flex items-center">
              <MapPin size={16} className="text-gray-400 absolute ml-3" />
              <input type="text" id="location" defaultValue="Colombo, Sri Lanka" className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <div className="flex items-center">
              <Clock size={16} className="text-gray-400 absolute ml-3" />
              <select id="timezone" className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>(GMT+05:30) Sri Lanka Standard Time</option>
                <option>(GMT+00:00) Greenwich Mean Time</option>
                <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                <option>(GMT-08:00) Pacific Time (US & Canada)</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700 mb-1">
              Join Date
            </label>
            <div className="flex items-center">
              <Calendar size={16} className="text-gray-400 absolute ml-3" />
              <input type="date" id="joinDate" defaultValue="2022-06-15" className="w-full border border-gray-300 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">About Me</h3>
        <textarea rows={4} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="Corporate Agent with over 5 years of experience in healthcare appointment management. Specializing in corporate client relations and group bookings." />
      </div>
      <div className="flex justify-end pt-4">
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-3 text-sm">
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm">
          <Save size={16} className="mr-2" />
          Save Changes
        </button>
      </div>
    </div>;
};
const SecuritySettings = () => {
  return <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Change Password
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input type="password" id="currentPassword" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input type="password" id="newPassword" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input type="password" id="confirmPassword" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
        </div>
        <div className="pt-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            Update Password
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Enhance your account security by enabling two-factor
              authentication.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You'll be asked for an authentication code when you sign in on a
              new device.
            </p>
          </div>
          <div className="flex items-center">
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Session Management
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">Current Session</p>
                <p className="text-xs text-gray-500 mt-1">
                  Windows 10 • Chrome • Colombo, Sri Lanka
                </p>
                <p className="text-xs text-gray-500">
                  Started: Today, 09:24 AM
                </p>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-sm text-gray-600">Active Now</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">Previous Session</p>
                <p className="text-xs text-gray-500 mt-1">
                  macOS • Safari • Colombo, Sri Lanka
                </p>
                <p className="text-xs text-gray-500">
                  Last active: Yesterday, 04:12 PM
                </p>
              </div>
              <div>
                <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button className="text-sm text-red-600 hover:text-red-800 font-medium">
            Logout from all devices
          </button>
        </div>
      </div>
    </div>;
};
const NotificationSettings = () => {
  return <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        Notification Preferences
      </h3>
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-800 mb-3">
            Email Notifications
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">New Appointment Alerts</p>
                <p className="text-xs text-gray-500">
                  Receive notifications when new appointments are booked
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Appointment Reminders</p>
                <p className="text-xs text-gray-500">
                  Receive reminders about upcoming appointments
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Payment Confirmations</p>
                <p className="text-xs text-gray-500">
                  Receive email when payments are processed
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  System Updates & Announcements
                </p>
                <p className="text-xs text-gray-500">
                  Receive updates about system changes and new features
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-800 mb-3">SMS Notifications</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Appointment Confirmations
                </p>
                <p className="text-xs text-gray-500">
                  Receive SMS when appointments are confirmed
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Appointment Reminders</p>
                <p className="text-xs text-gray-500">
                  Receive SMS reminders before appointments
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-800 mb-3">
            In-App Notifications
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">All Notifications</p>
                <p className="text-xs text-gray-500">
                  Show notifications for all activities
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Sound Alerts</p>
                <p className="text-xs text-gray-500">
                  Play sound when notifications arrive
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          Save Preferences
        </button>
      </div>
    </div>;
};
// Placeholder components for other settings tabs
const PreferenceSettings = () => <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
    <p className="text-gray-700">System Preferences Settings</p>
  </div>;
const BillingSettings = () => <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
    <p className="text-gray-700">Billing & Payment Settings</p>
  </div>;
const PrivacySettings = () => <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
    <p className="text-gray-700">Privacy & Data Settings</p>
  </div>;
const ActivitySettings = () => <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
    <p className="text-gray-700">Activity Log & History</p>
  </div>;
export default Settings;