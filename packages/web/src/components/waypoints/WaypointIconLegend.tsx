import { Info, X } from 'lucide-react';
import { ATTRACTION_ICONS, DO_ICONS, EAT_ICONS, STAY_ICONS } from '../../utils/waypointIcons';
import { WaypointCategory } from '../../types';

interface AttractionIconLegendProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory?: WaypointCategory | 'all';
}

export default function WaypointIconLegend({ isOpen, onClose, activeCategory = 'all' }: AttractionIconLegendProps) {
  if (!isOpen) return null;

  // Get icons based on active category
  const getIconsForCategory = () => {
    switch (activeCategory) {
      case WaypointCategory.DO:
        return {
          icons: DO_ICONS,
          title: 'DO Section Icons',
          description: 'Icons help you identify ride features, Lightning Lane options, and important notes.',
          categories: [
            { name: 'Skip Lines & Services', color: 'green', features: ['Multi Pass', 'Single Pass', 'Single Rider', 'Rider Switch', 'Mobile Check-in', 'PhotoPass'] },
            { name: 'What to Expect', color: 'blue', features: ['Dark Ride', 'Gets Wet', 'Spinning Motion', 'Loud Sounds', 'Strobe Effects', 'Interactive Elements', 'Character Meet', 'Live Performance', 'Air Conditioning', 'Outdoor Experience', 'Scary', 'Big Drops', 'Launch/Speed'] },
            { name: 'Important Notes', color: 'red', features: ['Height Requirement', 'Motion Sensitivity', 'Pregnancy Advisory', 'Wheelchair Accessible', 'Transfer Required', 'Rain Safe'] }
          ]
        };
      case WaypointCategory.EAT:
        return {
          icons: EAT_ICONS,
          title: 'EAT Section Icons',
          description: 'Icons help you identify dining service types, features, and special options.',
          categories: [
            { name: 'Service & Ordering', color: 'green', features: ['Mobile Order', 'ADR Required', 'Walk-up Available', 'Counter Service', 'Table Service', 'Self-Service', 'Reservations Recommended'] },
            { name: 'Dining Experience', color: 'blue', features: ['Character Dining', 'Entertainment', 'Scenic Views', 'Themed Atmosphere', 'Outdoor Seating', 'Bar/Lounge', 'Family Style', 'Fine Dining'] },
            { name: 'Dietary & Accessibility', color: 'purple', features: ['Vegetarian Options', 'Vegan Options', 'Gluten-Free Options', 'Alcohol Served', 'Kid Friendly', 'Allergy Friendly', 'Healthy Options', 'Large Portions'] }
          ]
        };
      case WaypointCategory.STAY:
        return {
          icons: STAY_ICONS,
          title: 'STAY Section Icons',
          description: 'Icons help you identify hotel amenities, transportation options, and accommodation types.',
          categories: [
            { name: 'Transportation', color: 'green', features: ['Monorail', 'Skyliner', 'Boat Transport', 'Bus Transport', 'Walking Distance'] },
            { name: 'Recreation & Wellness', color: 'blue', features: ['Pool', 'Water Features', 'Spa', 'Fitness Center', 'Golf', 'Beach', 'Marina'] },
            { name: 'Dining & Services', color: 'purple', features: ['Dining', 'Quick Service', 'Entertainment', 'Concierge', 'Business Center', 'Kids Club', 'Parking', 'WiFi'] },
            { name: 'Accommodations', color: 'orange', features: ['Suites', 'Villas', 'Disney Vacation Club', 'Themed Rooms', 'Family Accommodations'] }
          ]
        };
      default:
        // All categories overview with beautiful grouped structure
        return {
          icons: { ...DO_ICONS, ...EAT_ICONS, ...STAY_ICONS },
          title: 'All Waypoint Icons',
          description: 'Complete guide to all icons used across DO, EAT, and STAY sections.',
          categories: [
            // DO Category Groups
            { name: 'DO: Skip Lines & Services', color: 'blue', features: ['Multi Pass', 'Single Pass', 'Single Rider', 'Rider Switch', 'Mobile Check-in', 'PhotoPass'] },
            { name: 'DO: What to Expect', color: 'blue', features: ['Dark Ride', 'Gets Wet', 'Spinning Motion', 'Loud Sounds', 'Strobe Effects', 'Interactive Elements', 'Character Meet', 'Live Performance', 'Air Conditioning', 'Outdoor Experience', 'Scary', 'Big Drops', 'Launch/Speed'] },
            { name: 'DO: Important Notes', color: 'red', features: ['Height Requirement', 'Motion Sensitivity', 'Pregnancy Advisory', 'Wheelchair Accessible', 'Transfer Required', 'Rain Safe'] },
            
            // EAT Category Groups  
            { name: 'EAT: Service & Ordering', color: 'green', features: ['Mobile Order', 'ADR Required', 'Walk-up Available', 'Counter Service', 'Table Service', 'Self-Service', 'Reservations Recommended'] },
            { name: 'EAT: Dining Experience', color: 'green', features: ['Character Dining', 'Entertainment', 'Scenic Views', 'Themed Atmosphere', 'Outdoor Seating', 'Bar/Lounge', 'Family Style', 'Fine Dining'] },
            { name: 'EAT: Dietary & Accessibility', color: 'orange', features: ['Vegetarian Options', 'Vegan Options', 'Gluten-Free Options', 'Alcohol Served', 'Kid Friendly', 'Allergy Friendly', 'Healthy Options', 'Large Portions'] },
            
            // STAY Category Groups
            { name: 'STAY: Transportation', color: 'purple', features: ['Monorail', 'Skyliner', 'Boat Transport', 'Bus Transport', 'Walking Distance'] },
            { name: 'STAY: Recreation & Wellness', color: 'purple', features: ['Pool', 'Water Features', 'Spa', 'Fitness Center', 'Golf', 'Beach', 'Marina'] },
            { name: 'STAY: Dining & Services', color: 'indigo', features: ['Dining', 'Quick Service', 'Entertainment', 'Concierge', 'Business Center', 'Kids Club', 'Parking', 'WiFi'] },
            { name: 'STAY: Accommodations', color: 'pink', features: ['Suites', 'Villas', 'Disney Vacation Club', 'Themed Rooms', 'Family Accommodations'] }
          ]
        };
    }
  };

  const { icons, title, description, categories } = getIconsForCategory();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark/20">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-dark/10 transition-colors"
          >
            <X className="w-5 h-5 text-ink-light" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(95vh-140px)]">
          <p className="text-ink-light mb-6">
            {description}
          </p>

          {/* Dynamic Categories */}
          {categories.map((category, categoryIndex) => {
            const categoryIcons = category.features.map(feature => [feature, icons[feature]]).filter(([, icon]) => icon);
            
            if (categoryIcons.length === 0) return null;

            const getColorClasses = (color: string) => {
              switch (color) {
                case 'green': return { bg: 'bg-green-50', text: 'text-green-900', subtext: 'text-green-700', dot: 'bg-green-500' };
                case 'blue': return { bg: 'bg-blue-50', text: 'text-blue-900', subtext: 'text-blue-700', dot: 'bg-blue-500' };
                case 'red': return { bg: 'bg-red-50', text: 'text-red-900', subtext: 'text-red-700', dot: 'bg-red-500' };
                case 'purple': return { bg: 'bg-purple-50', text: 'text-purple-900', subtext: 'text-purple-700', dot: 'bg-purple-500' };
                case 'orange': return { bg: 'bg-orange-50', text: 'text-orange-900', subtext: 'text-orange-700', dot: 'bg-orange-500' };
                case 'indigo': return { bg: 'bg-indigo-50', text: 'text-indigo-900', subtext: 'text-indigo-700', dot: 'bg-indigo-500' };
                case 'pink': return { bg: 'bg-pink-50', text: 'text-pink-900', subtext: 'text-pink-700', dot: 'bg-pink-500' };
                default: return { bg: 'bg-surface', text: 'text-ink', subtext: 'text-ink-light', dot: 'bg-glow' };
              }
            };

            const colorClasses = getColorClasses(category.color);

            return (
              <div key={categoryIndex} className={categoryIndex < categories.length - 1 ? 'mb-8' : ''}>
                <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
                  <span className={`w-2 h-2 ${colorClasses.dot} rounded-full mr-2`}></span>
                  {category.name}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {categoryIcons.map(([key, icon]) => (
                    <div key={key} className={`flex items-start space-x-2 p-3 rounded-lg ${colorClasses.bg}`}>
                      <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${colorClasses.text}`}>{icon.label}</h4>
                        <p className={`text-sm ${colorClasses.subtext}`}>{icon.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-surface-dark/20">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}