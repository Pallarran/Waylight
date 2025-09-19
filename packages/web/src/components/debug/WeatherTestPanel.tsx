import { useState } from 'react';
import { Cloud, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const WeatherTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    edgeFunction?: { success: boolean; message: string; data?: any };
    weatherData?: { success: boolean; message: string; data?: any };
    recommendations?: { success: boolean; message: string; data?: any };
  }>({});

  const testWeatherSystem = async () => {
    setTesting(true);
    setResults({});

    try {
      // Test 1: Call the Edge Function
      console.log('Testing Edge Function...');
      const edgeFunctionResponse = await fetch('/api/test-weather-function', {
        method: 'POST',
      });

      const edgeFunctionResult = await edgeFunctionResponse.json();
      setResults(prev => ({
        ...prev,
        edgeFunction: {
          success: edgeFunctionResponse.ok,
          message: edgeFunctionResult.message || 'Edge function test completed',
          data: edgeFunctionResult
        }
      }));

      // Test 2: Check for weather data in database
      console.log('Checking weather data...');
      const weatherResponse = await fetch('/api/test-weather-data');
      const weatherResult = await weatherResponse.json();

      setResults(prev => ({
        ...prev,
        weatherData: {
          success: weatherResponse.ok && weatherResult.hasData,
          message: weatherResult.message || 'Weather data check completed',
          data: weatherResult
        }
      }));

      // Test 3: Test recommendations
      console.log('Testing recommendations...');
      const recsResponse = await fetch('/api/test-weather-recommendations');
      const recsResult = await recsResponse.json();

      setResults(prev => ({
        ...prev,
        recommendations: {
          success: recsResponse.ok,
          message: recsResult.message || 'Recommendations test completed',
          data: recsResult
        }
      }));

    } catch (error) {
      console.error('Weather test error:', error);
      setResults(prev => ({
        ...prev,
        edgeFunction: {
          success: false,
          message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTesting(false);
    }
  };

  const StatusIcon = ({ success }: { success?: boolean }) => {
    if (success === undefined) return <div className="w-5 h-5" />;
    return success ?
      <CheckCircle className="w-5 h-5 text-green-600" /> :
      <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Cloud className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Weather System Test</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Edge Function</h3>
            <p className="text-sm text-gray-600">Test OpenWeatherMap API and data storage</p>
          </div>
          <StatusIcon success={results.edgeFunction?.success} />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Weather Data</h3>
            <p className="text-sm text-gray-600">Check for forecast data in database</p>
          </div>
          <StatusIcon success={results.weatherData?.success} />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Recommendations</h3>
            <p className="text-sm text-gray-600">Test weather-based suggestions</p>
          </div>
          <StatusIcon success={results.recommendations?.success} />
        </div>
      </div>

      <button
        onClick={testWeatherSystem}
        disabled={testing}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Testing...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Run Weather System Test</span>
          </>
        )}
      </button>

      {/* Results Display */}
      {Object.keys(results).length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-medium text-gray-900">Test Results:</h3>

          {Object.entries(results).map(([key, result]) => (
            <div key={key} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <StatusIcon success={result.success} />
              </div>
              <p className="text-sm text-gray-600 mb-2">{result.message}</p>
              {result.data && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                    View Details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• If Edge Function fails: Check OpenWeatherMap API key in Supabase dashboard</li>
          <li>• If Weather Data fails: Run the Edge Function manually first</li>
          <li>• If Recommendations fail: Check database migration was applied</li>
        </ul>
      </div>
    </div>
  );
};

export default WeatherTestPanel;