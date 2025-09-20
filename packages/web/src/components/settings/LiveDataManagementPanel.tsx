import { useState } from 'react';
import { Download, CheckCircle, XCircle, Clock, Database, CloudRain, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@waylight/shared';

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

  // Helper function for API calls with retry logic (same as header button)
  const fetchWithRetry = async (url: string, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
        if (response.status === 429 || response.status === 503) {
          // Rate limited or service unavailable - wait longer
          if (attempt <= maxRetries) {
            console.log(`Rate limited, waiting ${attempt * 3} seconds before retry ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 3000));
            continue;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt <= maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying in ${attempt * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
        throw error;
      }
    }
    return null;
  };

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

      // Disney park IDs for ThemeParks.wiki API (same as header button)
      const parkIds = {
        'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
        'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
        'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
        'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
      };

      let successCount = 0;
      const errors: string[] = [];
      let totalEventsImported = 0;

      // Fetch schedule data for each park (same logic as header button)
      for (const [parkName, parkId] of Object.entries(parkIds)) {
        try {
          console.log(`Fetching schedule data for ${parkName}...`);

          // Add delay between requests to avoid rate limiting
          if (successCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Get schedule data for next 3 months using monthly endpoints (same as header)
          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();

          const monthsToFetch = [];
          for (let i = 0; i < 3; i++) {
            const month = ((currentMonth - 1 + i) % 12) + 1;
            const year = currentYear + Math.floor((currentMonth - 1 + i) / 12);
            monthsToFetch.push({ year, month: month.toString().padStart(2, '0') });
          }

          let allScheduleData = [];
          for (const { year, month } of monthsToFetch) {
            try {
              await new Promise(resolve => setTimeout(resolve, 500));
              const monthlyResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule/${year}/${month}`);
              if (monthlyResponse) {
                const monthlyData = await monthlyResponse.json();
                if (monthlyData.schedule && Array.isArray(monthlyData.schedule)) {
                  allScheduleData.push(...monthlyData.schedule);
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch schedule for ${parkName} ${year}/${month}:`, error);
            }
          }

          console.log(`✅ Successfully fetched ${allScheduleData.length} schedule entries for ${parkName}`);

          // Process events from schedule data (same logic as header button)
          const targetDates = [];
          for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            targetDates.push(date.toISOString().split('T')[0]);
          }

          let eventsCount = 0;
          for (const targetDate of targetDates) {
            const daySchedule = allScheduleData.filter((s: any) => s.date === targetDate) || [];

            // Find special events (same filtering as header button)
            const specialEvents = daySchedule.filter((s: any) =>
              s.type === 'TICKETED_EVENT' &&
              s.description &&
              !s.description.toLowerCase().includes('early') &&
              !s.description.toLowerCase().includes('extended')
            );

            for (const event of specialEvents) {
              try {
                const eventData = {
                  park_id: parkName,
                  event_date: targetDate,
                  event_type: 'special_event',
                  event_name: event.description,
                  event_open: event.openingTime || null,
                  event_close: event.closingTime || null,
                  description: event.description,
                  data_source: 'themeparks_api',
                  synced_at: new Date().toISOString()
                };

                const { error: eventError } = await supabase.from('live_park_events').upsert(eventData, {
                  onConflict: 'park_id,event_date,event_type,event_name'
                });

                if (!eventError) {
                  eventsCount++;
                  totalEventsImported++;
                }
              } catch (error) {
                console.warn(`Failed to import event for ${parkName}:`, error);
              }
            }
          }

          console.log(`✅ Imported ${eventsCount} events for ${parkName}`);
          successCount++;

        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ Failed to import park hours for ${parkName}:`, error);
          errors.push(errorMsg);
        }
      }

      setLastResult({
        success: successCount > 0,
        recordsImported: totalEventsImported,
        parksProcessed: Object.keys(parkIds).slice(0, successCount),
        message: successCount === Object.keys(parkIds).length
          ? `Successfully imported park hours and events for all ${successCount} parks`
          : successCount > 0
          ? `Partial success: Imported hours for ${successCount}/${Object.keys(parkIds).length} parks`
          : 'Failed to import park hours for any parks',
        errors: errors.length > 0 ? errors : undefined
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
      console.log('Importing live wait times using working header button logic...');

      // Disney park IDs for ThemeParks.wiki API (same as header button)
      const parkIds = {
        'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
        'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
        'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
        'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
      };

      let successCount = 0;
      const errors: string[] = [];
      let totalAttractionsImported = 0;
      let totalEntertainmentImported = 0;

      // Fetch live data for each park (same logic as header button)
      for (const [parkName, parkId] of Object.entries(parkIds)) {
        try {
          console.log(`Fetching live data for ${parkName}...`);

          // Add delay between requests to avoid rate limiting
          if (successCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          const liveResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
          if (!liveResponse) {
            throw new Error(`Failed to fetch live data for ${parkName} after retries`);
          }
          const liveData = await liveResponse.json();

          // Categorize live data (same as header button)
          const attractionsData = liveData.liveData?.filter((item: any) => item.entityType === 'ATTRACTION') || [];
          const entertainmentData = liveData.liveData?.filter((item: any) => item.entityType === 'SHOW') || [];

          console.log(`Processing ${attractionsData.length} attractions and ${entertainmentData.length} entertainment for ${parkName}`);

          // Update attractions in database (same logic as header button)
          let attractionUpdateCount = 0;
          for (const attraction of attractionsData) {
            try {
              // Map status from API to database format
              let dbStatus: 'operating' | 'down' | 'delayed' | 'temporary_closure' = 'operating';
              if (attraction.status === 'DOWN' || attraction.status === 'CLOSED') {
                dbStatus = 'down';
              } else if (attraction.status === 'DELAYED') {
                dbStatus = 'delayed';
              } else if (attraction.status === 'TEMPORARY_CLOSURE') {
                dbStatus = 'temporary_closure';
              }

              const { error: attractionError } = await supabase.from('live_attractions').upsert({
                park_id: parkName,
                external_id: attraction.id,
                name: attraction.name,
                wait_time: attraction.queue?.STANDBY?.waitTime || -1,
                status: dbStatus,
                lightning_lane_available: !!attraction.queue?.LIGHTNING_LANE?.waitTime,
                lightning_lane_return_time: attraction.queue?.LIGHTNING_LANE?.returnTime || null,
                single_rider_available: !!attraction.queue?.SINGLE_RIDER?.waitTime,
                single_rider_wait_time: attraction.queue?.SINGLE_RIDER?.waitTime || null,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'park_id,external_id'
              });

              if (!attractionError) {
                attractionUpdateCount++;
                totalAttractionsImported++;
              }
            } catch (error) {
              console.warn(`Failed to update attraction ${attraction.name}:`, error);
            }
          }

          // Update entertainment in database (same logic as header button)
          let entertainmentUpdateCount = 0;
          for (const entertainment of entertainmentData) {
            try {
              // Map status from API to database format
              let dbStatus: 'operating' | 'cancelled' | 'delayed' = 'operating';
              if (entertainment.status === 'DOWN' || entertainment.status === 'CLOSED' || entertainment.status === 'REFURBISHMENT') {
                dbStatus = 'cancelled';
              } else if (entertainment.status === 'DELAYED') {
                dbStatus = 'delayed';
              }

              // Extract show times and find next show
              const showTimes = entertainment.showtimes?.map((show: any) => show.startTime) || [];
              const nextShow = showTimes.find((time: string) => {
                const showTime = new Date(time);
                return showTime > new Date();
              });

              const { error: entertainmentError } = await supabase.from('live_entertainment').upsert({
                park_id: parkName,
                external_id: entertainment.id,
                name: entertainment.name,
                show_times: showTimes,
                status: dbStatus,
                next_show_time: nextShow || null,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'park_id,external_id'
              });

              if (!entertainmentError) {
                entertainmentUpdateCount++;
                totalEntertainmentImported++;
              }
            } catch (error) {
              console.warn(`Failed to update entertainment ${entertainment.name}:`, error);
            }
          }

          console.log(`✅ Updated ${attractionUpdateCount} attractions and ${entertainmentUpdateCount} entertainment for ${parkName}`);
          successCount++;

        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ Failed to import wait times for ${parkName}:`, error);
          errors.push(errorMsg);
        }
      }

      setLastResult({
        success: successCount > 0,
        recordsImported: totalAttractionsImported + totalEntertainmentImported,
        parksProcessed: Object.keys(parkIds).slice(0, successCount),
        message: successCount === Object.keys(parkIds).length
          ? `Successfully imported wait times for all ${successCount} parks (${totalAttractionsImported} attractions, ${totalEntertainmentImported} shows)`
          : successCount > 0
          ? `Partial success: Imported wait times for ${successCount}/${Object.keys(parkIds).length} parks`
          : 'Failed to import wait times for any parks',
        errors: errors.length > 0 ? errors : undefined
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