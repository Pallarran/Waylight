import { format } from 'date-fns';
import { Printer, Download, X } from 'lucide-react';
import { extractCheatSheetData, formatTime, generateMorningRopeDropPlan } from '../../utils/cheatSheet';
import { getParkName } from '../../data/parks';
import type { TripDay } from '../../types';

interface CheatSheetViewProps {
  tripDay: TripDay;
  onClose: () => void;
}

export default function CheatSheetView({ tripDay, onClose }: CheatSheetViewProps) {
  const cheatSheetData = extractCheatSheetData(tripDay);
  const parkName = tripDay.parkId ? getParkName(tripDay.parkId) : 'Disney World';
  const dateFormatted = format(new Date(tripDay.date + 'T00:00:00'), 'EEE, MMM d, yyyy');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For now, just trigger print - can be enhanced with proper PDF generation
    window.print();
  };

  const ropeDropPlan = generateMorningRopeDropPlan(tripDay.items || []);

  return (
    <div className="fixed inset-0 bg-surface/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        {/* Header Controls - Hidden in print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h2 className="text-xl font-semibold text-ink">Daily Cheat Sheet</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="btn-secondary btn-sm flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary btn-sm flex items-center"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </button>
            <button
              onClick={onClose}
              className="btn-secondary btn-sm flex items-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cheat Sheet Content - Optimized for Print */}
        <div className="bg-white text-gray-900 max-w-4xl mx-auto p-8 print:p-6 print:max-w-none print:mx-0 rounded-lg print:rounded-none shadow-lg print:shadow-none">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-600">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✨</span>
              <h1 className="text-2xl font-bold text-blue-600">Walt Disney World — Park Day Cheat Sheet</h1>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium print:hidden">
              Print / Save as PDF
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">Fill this out the night before. Keep it to one page and bring it to the park.</p>

          {/* Top Info Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs font-medium text-gray-500 mb-1">PARK</div>
              <div className="text-sm font-medium">{parkName}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs font-medium text-gray-500 mb-1">DATE</div>
              <div className="text-sm font-medium">{dateFormatted}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs font-medium text-gray-500 mb-1">PARK HOURS</div>
              <div className="text-sm font-medium">EE 7:30 | 8-10</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs font-medium text-gray-500 mb-1">WEATHER</div>
              <div className="text-sm font-medium">75°/86°, 20% rain</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Arrival Plan */}
              <div className="bg-blue-50 p-4 rounded">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">🚗</span>
                  <h3 className="font-semibold text-gray-800">Arrival Plan & Transport (from {tripDay.arrivalPlan?.transportMethod || 'Hotel'})</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-600">Leave room by</div>
                    <div className="font-medium">{tripDay.arrivalPlan?.departureTime || '6:45 am'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">At security by</div>
                    <div className="font-medium">{tripDay.arrivalPlan?.securityTime || '7:10 am'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    🚶 Walk to TTC
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    🚝 Monorail
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    🚤 Boat
                  </label>
                  <label className="flex items-center text-xs">
                    <input type="checkbox" className="mr-1" />
                    🚌 Bus
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Tap in by</div>
                    <div className="font-medium">{tripDay.arrivalPlan?.tapInTime || '7:25 am (EE)'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">First showtime/parade to catch</div>
                    <div className="font-medium">Festival of Fantasy 3:00 pm</div>
                  </div>
                </div>
              </div>

              {/* Rope Drop Plan */}
              <div className="bg-orange-50 p-4 rounded">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">🌅</span>
                  <h3 className="font-semibold text-gray-800">Rope Drop → Late Morning (hit these fast)</h3>
                </div>
                <div className="space-y-2">
                  {ropeDropPlan.length > 0 ? ropeDropPlan.map((plan, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="font-medium">{plan.split(':')[0]}:{plan.split(':')[1].split(' ')[0]}</div>
                      <div className="flex-1 ml-4">{plan.split(' - ')[1] || plan.split(' ')[2]}</div>
                    </div>
                  )) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">EE/8:00</div>
                        <div className="flex-1 ml-4">Headliner in open area</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">8:30</div>
                        <div className="flex-1 ml-4">Second priority nearby</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">9:00</div>
                        <div className="flex-1 ml-4">Third priority / snack</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">9:30</div>
                        <div className="flex-1 ml-4">Switch to LL window #1</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">10:00</div>
                        <div className="flex-1 ml-4">Frequent short waits / characters</div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">10:30</div>
                        <div className="flex-1 ml-4">Mobile order placed for lunch?</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Lightning Lane Plan */}
              <div className="bg-yellow-50 p-4 rounded">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">⚡</span>
                  <h3 className="font-semibold text-gray-800">Lightning Lane Plan</h3>
                </div>
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-1">Multi Pass — Pre-selected 3 (with target windows)</div>
                  <div className="space-y-1">
                    {tripDay.lightningLanePlan?.multiPassSelections?.length ? 
                      tripDay.lightningLanePlan.multiPassSelections.map((selection, index) => (
                        <div key={index} className="bg-white px-2 py-1 rounded text-sm">{selection}</div>
                      )) : 
                      <>
                        <div className="bg-white px-2 py-1 rounded text-sm">#1 e.g., Peter Pan 9:00</div>
                        <div className="bg-white px-2 py-1 rounded text-sm">#2 e.g., Big Thunder 10</div>
                        <div className="bg-white px-2 py-1 rounded text-sm">#3 e.g., Pirates 11:30—</div>
                      </>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-600">Refill strategy (after tap-in)</div>
                    <div className="bg-white px-2 py-1 rounded text-sm">
                      {tripDay.lightningLanePlan?.refillStrategy || 'Prioritize family must-dos nearby'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Single Pass (if any)</div>
                    <div className="bg-white px-2 py-1 rounded text-sm">
                      {tripDay.lightningLanePlan?.singlePassTargets?.join(', ') || 'Attraction + desired time'}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="bg-white px-2 py-1 rounded">Notes</div>
                  <div className="mt-1 text-xs">
                    {tripDay.lightningLanePlan?.notes || 'Stack PM windows if taking midday break'}
                  </div>
                </div>
              </div>

              {/* Family Priorities */}
              <div className="bg-purple-50 p-4 rounded">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">📝</span>
                  <h3 className="font-semibold text-gray-800">Top Family Priorities ({tripDay.familyPriorities?.filter(p => p.type === 'must-do').length || 0} must-dos, {tripDay.familyPriorities?.filter(p => p.type === 'nice-to-have').length || 0} nice-to-haves)</h3>
                </div>
                <div className="space-y-2">
                  {tripDay.familyPriorities?.length ? 
                    tripDay.familyPriorities.slice(0, 5).map((priority, index) => (
                      <div key={priority.id} className="flex">
                        <div className="font-medium mr-3">{index + 1}.</div>
                        <div className="bg-white px-2 py-1 rounded text-sm flex-1">
                          {priority.name}
                        </div>
                      </div>
                    )) :
                    <>
                      <div className="flex">
                        <div className="font-medium mr-3">1.</div>
                        <div className="bg-white px-2 py-1 rounded text-sm flex-1">Must-do #1</div>
                      </div>
                      <div className="flex">
                        <div className="font-medium mr-3">2.</div>
                        <div className="bg-white px-2 py-1 rounded text-sm flex-1">Must-do #2</div>
                      </div>
                      <div className="flex">
                        <div className="font-medium mr-3">3.</div>
                        <div className="bg-white px-2 py-1 rounded text-sm flex-1">Must-do #3</div>
                      </div>
                      <div className="flex">
                        <div className="font-medium mr-3">4.</div>
                        <div className="bg-white px-2 py-1 rounded text-sm flex-1">Nice-to-have #4</div>
                      </div>
                      <div className="flex">
                        <div className="font-medium mr-3">5.</div>
                        <div className="bg-white px-2 py-1 rounded text-sm flex-1">Nice-to-have #5</div>
                      </div>
                    </>
                  }
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Tip: Balance thrills and gentler rides; alternate queues and shows.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* ADRs & Meals */}
            <div className="bg-orange-50 p-4 rounded">
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">🍽️</span>
                <h3 className="font-semibold text-gray-800">ADRs & Meals</h3>
              </div>
              
              {cheatSheetData.diningReservations.length > 0 ? (
                <div className="space-y-3">
                  {cheatSheetData.diningReservations.map((dining) => (
                    <div key={dining.id}>
                      <div className="text-xs text-gray-600">{dining.startTime ? formatTime(dining.startTime) : 'TBD'}</div>
                      <div className="text-sm font-medium">{dining.name}</div>
                      {dining.confirmationNumber && (
                        <div className="text-xs text-gray-500">#{dining.confirmationNumber}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600">Breakfast time</div>
                    <div className="bg-white px-2 py-1 rounded text-sm">e.g., 8:45 am</div>
                    <div className="text-xs text-gray-500">#######</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Lunch time</div>
                    <div className="bg-white px-2 py-1 rounded text-sm">Name (or quick service)</div>
                    <div className="text-xs text-gray-500">#######</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Dinner time</div>
                    <div className="bg-white px-2 py-1 rounded text-sm">Name (or quick service)</div>
                    <div className="text-xs text-gray-500">#######</div>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="text-xs text-gray-600">Snacks to target</div>
                <div className="bg-white px-2 py-1 rounded text-sm">Dole Whip, Lunch Box Tart...</div>
                <div className="text-xs text-gray-600 mt-2">Allergies / Notes</div>
                <div className="bg-white px-2 py-1 rounded text-sm">Nut-free for Naomi, etc.</div>
              </div>
            </div>

            {/* Entertainment & Characters */}
            <div className="bg-blue-50 p-4 rounded">
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">🎭</span>
                <h3 className="font-semibold text-gray-800">Entertainment & Characters</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600">Parade/Show time</div>
                  <div className="text-sm font-medium">HH 10:30 • 12:00</div>
                  <div className="text-xs text-gray-600 mt-2">Nighttime spectacular</div>
                  <div className="text-sm font-medium">Happily Ever After 8:30</div>
                </div>
                
                <div className="pt-2 border-t border-blue-200">
                  <div className="text-xs text-gray-600">Character targets (place + time window)</div>
                  <div className="space-y-1">
                    {cheatSheetData.characterMeets.length > 0 ? 
                      cheatSheetData.characterMeets.map((meet) => (
                        <div key={meet.id} className="text-sm">
                          {meet.characters?.join(', ') || meet.name} at {meet.location || 'TBD'} {meet.startTime ? formatTime(meet.startTime) : ''}
                        </div>
                      )) :
                      <>
                        <div className="text-sm">Mickey at Town Square Theater, morning</div>
                        <div className="text-sm">Princess Fairytale Hall after lunch</div>
                        <div className="text-sm">Buzz Lightyear near Star Command</div>
                      </>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-purpose Column */}
            <div className="space-y-4">
              
              {/* Midday Break */}
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-sm mr-1">🏨</span>
                  <h4 className="font-semibold text-gray-800 text-sm">Midday Break</h4>
                </div>
                <div className="text-xs">
                  <div>Return to Poly by 1:00 pm</div>
                  <div>Back in park by 4:00 pm</div>
                </div>
              </div>

              {/* Backup Plan */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-sm mr-1">☂️</span>
                  <h4 className="font-semibold text-gray-800 text-sm">Backup Plan</h4>
                </div>
                <div className="text-xs">
                  <div>If heavy rain → indoor shows near us</div>
                  <div>If high waits → PhotoPass & snacks</div>
                </div>
              </div>

              {/* Photos & Magic Shots */}
              <div className="bg-yellow-50 p-3 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-sm mr-1">📸</span>
                  <h4 className="font-semibold text-gray-800 text-sm">Photos & Magic Shots</h4>
                </div>
                <div className="text-xs">
                  <div>Hub grass family photo before fireworks</div>
                  <div>Special Magic Shot location</div>
                </div>
              </div>

              {/* Kids & Safety */}
              <div className="bg-red-50 p-3 rounded">
                <div className="flex items-center mb-2">
                  <span className="text-sm mr-1">🧒</span>
                  <h4 className="font-semibold text-gray-800 text-sm">Kids & Safety</h4>
                </div>
                <div className="text-xs space-y-1">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-1" />
                    Height checked today
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-1" />
                    ID bracelets on
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-1" />
                    Stroller tag / locker #
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-1" />
                    Sunscreen reapplied times
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6 bg-gray-50 p-4 rounded">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">📝</span>
              <h3 className="font-semibold text-gray-800">Notes</h3>
            </div>
            <div className="bg-white p-3 rounded min-h-[60px] text-sm">
              {tripDay.notes || 'Parking reminders, shopping list, rider swap plan, etc.'}
            </div>
          </div>

          {/* Footer Icons */}
          <div className="flex justify-center space-x-6 mt-6 text-xs text-gray-500">
            <span>🚗 Arrival</span>
            <span>⚡ Lightning Lane</span>
            <span>🌅 Morning plan</span>
            <span>🍽️ ADR/Meals</span>
            <span>🎭 Entertainment</span>
            <span>🏨 Break</span>
            <span>☂️ Backup</span>
            <span>📸 Photos</span>
            <span>🧒 Kids & Safety</span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </div>
  );
}