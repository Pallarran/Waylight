import { useState } from 'react';
import { Sun, Download, Upload, Trash2, Bell, MapPin, Eye } from 'lucide-react';
import useUserPreferencesStore from '../stores/useUserPreferencesStore';
import WeatherTestPanel from '../components/debug/WeatherTestPanel';

export default function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [defaultPark, setDefaultPark] = useState('magic-kingdom');
  const [timeFormat, setTimeFormat] = useState('24h');
  
  const { displaySettings, updatePreferences } = useUserPreferencesStore();

  const handleExportData = () => {
    // This would export user data in the future
    console.log('Exporting user data...');
  };

  const handleImportData = () => {
    // This would import user data in the future
    console.log('Importing user data...');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      // This would clear user data in the future
      console.log('Clearing user data...');
    }
  };

  return (
    <div className="container-waylight section-padding">
      <div className="mb-6">
        <p className="text-ink-light">Customize your Waylight experience.</p>
      </div>
      
      <div className="space-y-6">
        {/* Display Settings */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Eye className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-lg font-semibold text-ink">Display Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-ink font-medium">Show Tips</label>
                <p className="text-sm text-ink-light">Display helpful tips and recommendations for attractions</p>
              </div>
              <button
                onClick={() => updatePreferences({ 
                  displaySettings: { 
                    ...displaySettings, 
                    showTips: !displaySettings.showTips 
                  } 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  displaySettings.showTips ? 'bg-sea' : 'bg-surface-dark'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displaySettings.showTips ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Sun className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-lg font-semibold text-ink">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-ink font-medium">Theme</label>
                <p className="text-sm text-ink-light">Choose your preferred color scheme</p>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-sea' : 'bg-surface-dark'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Planning Preferences */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-lg font-semibold text-ink">Planning Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-ink font-medium mb-2 block">Default Park</label>
              <select
                value={defaultPark}
                onChange={(e) => setDefaultPark(e.target.value)}
                className="input w-full"
              >
                <option value="magic-kingdom">Magic Kingdom</option>
                <option value="epcot">EPCOT</option>
                <option value="hollywood-studios">Hollywood Studios</option>
                <option value="animal-kingdom">Animal Kingdom</option>
              </select>
            </div>

            <div>
              <label className="text-ink font-medium mb-2 block">Time Format</label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={timeFormat === '12h'}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="mr-2 text-sea focus:ring-sea/20"
                  />
                  <span className="text-ink">12-hour (2:30 PM)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={timeFormat === '24h'}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="mr-2 text-sea focus:ring-sea/20"
                  />
                  <span className="text-ink">24-hour (14:30)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-lg font-semibold text-ink">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-ink font-medium">Trip Reminders</label>
                <p className="text-sm text-ink-light">Get notified about upcoming trip dates</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-sea' : 'bg-surface-dark'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Download className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-lg font-semibold text-ink">Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-ink mb-2">Backup & Restore</h3>
              <p className="text-sm text-ink-light mb-4">
                Export your trips and preferences to keep them safe, or import data from another device.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportData}
                  className="btn-secondary flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
                <button
                  onClick={handleImportData}
                  className="btn-secondary flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </button>
              </div>
            </div>

            <div className="border-t border-surface-dark/50 pt-4">
              <h3 className="font-medium text-ink mb-2 text-red-600">Danger Zone</h3>
              <p className="text-sm text-ink-light mb-4">
                Permanently delete all your trips, preferences, and stored data.
              </p>
              <button
                onClick={handleClearData}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">About Waylight</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-light">Version</span>
              <span className="text-ink">1.0.0 (Alpha)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light">Build</span>
              <span className="text-ink">September 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-light">Target</span>
              <span className="text-ink">Walt Disney World</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}