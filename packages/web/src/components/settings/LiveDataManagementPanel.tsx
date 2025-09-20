import { useState } from 'react';
import { Download, CheckCircle, XCircle, Clock, Database, CloudRain, Calendar, TrendingUp } from 'lucide-react';

interface ImportResult {
  success: boolean;
  recordsImported?: number;
  parksProcessed?: string[];
  errors?: string[];
  message?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function LiveDataManagementPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [importingType, setImportingType] = useState<string | null>(null);

  const handleCrowdDataImport = async () => {
    setIsImporting(true);
    setImportingType('crowd-data');
    setLastResult(null);

    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 1, currentYear, currentYear + 1]; // Last year, current year, next year
      console.log(`Importing crowd data for years: ${years.join(', ')}`);

      let totalRecords = 0;
      let allParks: string[] = [];
      let allErrors: string[] = [];
      let dateRange = { start: '', end: '' };

      for (const year of years) {
        console.log(`Importing crowd data for ${year}...`);

        const response = await fetch('/api/import-thrill-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ year }),
        });

        if (!response.ok) {
          const errorResult = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`
          }));

          console.error(`Failed to import year ${year}:`, errorResult);
          if (errorResult.debug) {
            console.error('Debug Info:', errorResult.debug);
            allErrors.push(`${year}: ${errorResult.debug.errorMessage}`);
          } else {
            allErrors.push(`${year}: ${errorResult.error || 'Unknown error'}`);
          }
          continue;
        }

        const result = await response.json();

        if (result.success) {
          totalRecords += result.recordsImported || 0;
          if (result.parksProcessed) {
            allParks = [...new Set([...allParks, ...result.parksProcessed])]; // Deduplicate
          }

          // Set overall date range
          if (!dateRange.start || (result.dateRange?.start && result.dateRange.start < dateRange.start)) {
            dateRange.start = result.dateRange?.start || '';
          }
          if (!dateRange.end || (result.dateRange?.end && result.dateRange.end > dateRange.end)) {
            dateRange.end = result.dateRange?.end || '';
          }
        } else {
          allErrors.push(`${year}: ${result.errors?.join(', ') || 'Import failed'}`);
        }
      }

      setLastResult({
        success: totalRecords > 0,
        recordsImported: totalRecords,
        parksProcessed: allParks,
        errors: allErrors,
        dateRange,
        message: totalRecords > 0 ? `Successfully imported crowd data for ${years.join(', ')}` : 'No data imported'
      });

    } catch (error) {
      console.error('Multi-year import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Multi-year import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const handleWeatherDataImport = async () => {
    setIsImporting(true);
    setImportingType('weather-data');
    setLastResult(null);

    try {
      console.log('Importing weather data...');

      // Call Supabase Edge Function directly (same as header button)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration for weather import');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-weather`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));

        console.error('Failed to import weather data:', errorResult);
        setLastResult({
          success: false,
          errors: [errorResult.error || 'Unknown error'],
          message: 'Weather import failed'
        });
        return;
      }

      const result = await response.json();

      setLastResult({
        success: true,
        recordsImported: result.forecasts || 0,
        message: `Successfully imported weather forecasts for ${result.location || 'Walt Disney World'}`,
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

    } catch (error) {
      console.error('Weather import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Weather import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const handleParkHoursImport = async () => {
    setIsImporting(true);
    setImportingType('park-hours');
    setLastResult(null);

    try {
      console.log('Importing park hours and events using working header button logic...');

      // Use the same working logic as the header refresh button
      // This will be implemented by copying the exact working code

      setLastResult({
        success: false,
        message: 'Park hours import - Using header refresh button logic (to be implemented)',
        errors: ['This will use the exact same working code as the header refresh button']
      });

    } catch (error) {
      console.error('Park hours import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Park hours import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const handleWaitTimesImport = async () => {
    setIsImporting(true);
    setImportingType('wait-times');
    setLastResult(null);

    try {
      console.log('Importing live wait times...');

      const response = await fetch('/api/sync-live-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));

        console.error('Failed to import wait times:', errorResult);
        setLastResult({
          success: false,
          errors: [errorResult.error || 'Unknown error'],
          message: 'Wait times import failed'
        });
        return;
      }

      const result = await response.json();

      setLastResult({
        success: result.success,
        recordsImported: result.stats?.totalAttractions || result.stats?.totalRecords || 0,
        parksProcessed: result.config?.enabledParks || [],
        message: result.success
          ? `Successfully imported live wait times for ${result.config?.enabledParks?.length || 4} parks`
          : 'Wait times import failed',
        errors: result.success ? undefined : [result.error || 'Unknown error']
      });

    } catch (error) {
      console.error('Wait times import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Wait times import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const getStatusIcon = (type: string) => {
    if (importingType === type && isImporting) {
      return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    if (lastResult?.success) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (lastResult && !lastResult.success) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <Database className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-ink mb-2">Live Data Management</h3>
        <p className="text-sm text-ink-light mb-4">
          Import and update real-time park data from various sources to enhance your trip planning experience.
        </p>
      </div>

      {/* Import Buttons - All in One Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Crowd Data */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('crowd-data')}
            <div>
              <h4 className="font-medium text-ink">Crowd Predictions</h4>
              <p className="text-sm text-ink-light">Import 3-year crowd data</p>
            </div>
          </div>
          <button
            onClick={handleCrowdDataImport}
            disabled={isImporting}
            className={`btn-primary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {importingType === 'crowd-data' ? 'Importing...' : 'Import Crowd Data'}
          </button>
        </div>

        {/* Weather Data */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('weather-data')}
            <div>
              <h4 className="font-medium text-ink">Weather Data</h4>
              <p className="text-sm text-ink-light">Import weather forecasts</p>
            </div>
          </div>
          <button
            onClick={handleWeatherDataImport}
            disabled={isImporting}
            className={`btn-secondary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <CloudRain className="w-4 h-4 mr-2" />
            {importingType === 'weather-data' ? 'Importing...' : 'Import Weather'}
          </button>
        </div>

        {/* Park Hours */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('park-hours')}
            <div>
              <h4 className="font-medium text-ink">Park Hours & Events</h4>
              <p className="text-sm text-ink-light">Import operating hours and special events</p>
            </div>
          </div>
          <button
            onClick={handleParkHoursImport}
            disabled={isImporting}
            className={`btn-secondary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {importingType === 'park-hours' ? 'Importing...' : 'Import Hours'}
          </button>
        </div>

        {/* Wait Times */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('wait-times')}
            <div>
              <h4 className="font-medium text-ink">Live Wait Times</h4>
              <p className="text-sm text-ink-light">Import current attraction wait times</p>
            </div>
          </div>
          <button
            onClick={handleWaitTimesImport}
            disabled={isImporting}
            className={`btn-secondary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            {importingType === 'wait-times' ? 'Importing...' : 'Import Wait Times'}
          </button>
        </div>
      </div>

      {/* Import Status */}
      {lastResult && (
        <div className={`p-4 rounded-lg border ${
          lastResult.success
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="text-sm">
            {lastResult.success ? (
              <div className="space-y-2">
                <div className="font-medium text-green-800">
                  ✅ {lastResult.message || `Successfully imported ${lastResult.recordsImported || 0} predictions`}
                </div>
                {lastResult.parksProcessed && lastResult.parksProcessed.length > 0 && (
                  <div className="text-green-700">
                    Parks: {lastResult.parksProcessed.join(', ')}
                  </div>
                )}
                {lastResult.dateRange?.start && (
                  <div className="text-green-700">
                    Date range: {lastResult.dateRange.start} to {lastResult.dateRange.end}
                  </div>
                )}
                {lastResult.recordsImported && lastResult.recordsImported > 0 && (
                  <div className="text-green-700">
                    Total records: {lastResult.recordsImported.toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-medium text-red-800">
                  ❌ {lastResult.message || 'Import failed'}
                </div>
                {lastResult.errors && lastResult.errors.map((error, index) => (
                  <div key={index} className="text-red-700 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information */}
      <div className="text-xs text-ink-light bg-blue-50 p-3 rounded-lg">
        <div className="font-medium text-blue-800 mb-1">ℹ️ About Live Data Management</div>
        <ul className="space-y-1 text-blue-700">
          <li>• <strong>Crowd Data:</strong> Imports 3 years of predictions from Thrill Data (thousands of records)</li>
          <li>• <strong>Weather:</strong> Real-time weather forecasts for trip planning</li>
          <li>• <strong>Park Hours:</strong> Operating schedules and special events</li>
          <li>• <strong>Wait Times:</strong> Live attraction wait times for real-time planning</li>
          <li>• All data sources integrate seamlessly with your trip planning tools</li>
        </ul>
      </div>
    </div>
  );
}