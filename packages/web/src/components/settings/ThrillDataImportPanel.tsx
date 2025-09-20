import { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, Clock, Database } from 'lucide-react';
import { thrillDataImporter, type ImportProgress, type ImportResult } from '@waylight/shared';

export default function ThrillDataImportPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<any>(null);

  const handleImport2025 = async () => {
    setIsImporting(true);
    setProgress(null);
    setLastResult(null);

    try {
      setProgress({
        currentPark: 'Initializing...',
        parksCompleted: 0,
        totalParks: 4,
        recordsImported: 0,
        status: 'starting'
      });

      // Call the Vercel API endpoint
      const response = await fetch('/api/import-thrill-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setLastResult(result);

      if (result.success) {
        setProgress({
          currentPark: 'Completed',
          parksCompleted: 4,
          totalParks: 4,
          recordsImported: result.recordsImported,
          status: 'completed'
        });

        // Refresh stats after import
        await refreshStats();
      } else {
        setProgress({
          currentPark: 'Failed',
          parksCompleted: 0,
          totalParks: 4,
          recordsImported: 0,
          status: 'error',
          error: result.errors[0] || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Import failed:', error);
      setLastResult({
        success: false,
        recordsImported: 0,
        parksProcessed: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        dateRange: { start: '', end: '' }
      });
      setProgress({
        currentPark: 'Failed',
        parksCompleted: 0,
        totalParks: 4,
        recordsImported: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const refreshStats = async () => {
    try {
      const importStats = await thrillDataImporter.getImportStats();
      setStats(importStats);
    } catch (error) {
      console.error('Failed to get stats:', error);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    refreshStats();
  }, []);


  const getStatusIcon = () => {
    if (progress?.status === 'completed' || lastResult?.success) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (progress?.status === 'error' || (lastResult && !lastResult.success)) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    if (isImporting) {
      return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    return <Database className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isImporting && progress) {
      if (progress.status === 'starting') {
        return 'Initializing import...';
      }
      if (progress.status === 'in_progress') {
        return `Processing ${progress.currentPark} (${progress.parksCompleted}/${progress.totalParks})`;
      }
    }
    if (progress?.status === 'completed' || lastResult?.success) {
      return 'Import completed successfully!';
    }
    if (progress?.status === 'error' || (lastResult && !lastResult.success)) {
      return 'Import failed';
    }
    return 'Ready to import';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-ink mb-2">2025 Demo Crowd Predictions</h3>
        <p className="text-sm text-ink-light mb-4">
          Generate realistic demo crowd level predictions for all Disney World parks.
          This populates the database with test data for trip planning features.
        </p>
      </div>

      {/* Import Status */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="text-sm font-medium text-ink">
            {getStatusText()}
          </div>
          {isImporting && progress && (
            <div className="text-xs text-ink-light mt-1">
              {progress.recordsImported} records imported
            </div>
          )}
        </div>
        {isImporting && progress && (
          <div className="text-xs text-ink-light">
            {Math.round((progress.parksCompleted / progress.totalParks) * 100)}%
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isImporting && progress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.parksCompleted / progress.totalParks) * 100}%` }}
          />
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImport2025}
        disabled={isImporting}
        className={`btn-primary flex items-center justify-center w-full ${
          isImporting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Download className="w-4 h-4 mr-2" />
{isImporting ? 'Generating Data...' : 'Generate Demo Data'}
      </button>

      {/* Last Result */}
      {lastResult && (
        <div className={`p-3 rounded-lg border ${
          lastResult.success
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="text-sm">
            {lastResult.success ? (
              <div className="space-y-1">
                <div className="font-medium text-green-800">
                  ✅ Successfully imported {lastResult.recordsImported} predictions
                </div>
                <div className="text-green-700">
                  Parks: {lastResult.parksProcessed.join(', ')}
                </div>
                {lastResult.dateRange.start && (
                  <div className="text-green-700">
                    Date range: {lastResult.dateRange.start} to {lastResult.dateRange.end}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="font-medium text-red-800">
                  ❌ Import failed
                </div>
                {lastResult.errors.map((error, index) => (
                  <div key={index} className="text-red-700 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Stats */}
      {stats && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-ink mb-3">Current Database Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-ink-light">Total Predictions</div>
              <div className="font-medium text-ink">{stats.totalPredictions.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-ink-light">Average Crowd Level</div>
              <div className="font-medium text-ink">{stats.avgCrowdLevel}/10</div>
            </div>
            {stats.dateRange.earliest && (
              <div>
                <div className="text-ink-light">Date Range</div>
                <div className="font-medium text-ink">
                  {stats.dateRange.earliest} to {stats.dateRange.latest}
                </div>
              </div>
            )}
            {stats.lastSyncTime && (
              <div>
                <div className="text-ink-light">Last Update</div>
                <div className="font-medium text-ink">
                  {new Date(stats.lastSyncTime).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Per-park stats */}
          {stats.parkCounts && Object.keys(stats.parkCounts).length > 0 && (
            <div className="mt-4">
              <div className="text-ink-light text-xs mb-2">Records per park:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(stats.parkCounts).map(([park, count]) => (
                  <div key={park} className="flex justify-between">
                    <span className="text-ink-light capitalize">{park.replace('-', ' ')}</span>
                    <span className="text-ink font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Information */}
      <div className="text-xs text-ink-light bg-blue-50 p-3 rounded-lg">
        <div className="font-medium text-blue-800 mb-1">ℹ️ About Demo Data Import</div>
        <ul className="space-y-1 text-blue-700">
          <li>• Generates realistic demo crowd predictions for 2025</li>
          <li>• Covers all 4 Disney World parks with 180 days of data</li>
          <li>• Higher crowds on weekends, lower on weekdays</li>
          <li>• Populates database for testing trip planning features</li>
        </ul>
      </div>
    </div>
  );
}