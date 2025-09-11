import { Info, X } from 'lucide-react';
import { ATTRACTION_ICONS } from '../../utils/waypointIcons';

interface AttractionIconLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaypointIconLegend({ isOpen, onClose }: AttractionIconLegendProps) {
  if (!isOpen) return null;

  // Separate icons by tier
  const tier1Icons = Object.entries(ATTRACTION_ICONS).filter(([, icon]) => icon.tier === 1);
  const tier2IconsRaw = Object.entries(ATTRACTION_ICONS).filter(([, icon]) => icon.tier === 2);
  
  // Sort tier 2 icons to prioritize Lightning Lane icons (Single Pass first, then Multi Pass)
  const lightningLaneOrder = ['hasIndividualLL', 'hasLightningLane'];
  const tier2Icons = tier2IconsRaw.sort(([keyA], [keyB]) => {
    const indexA = lightningLaneOrder.indexOf(keyA);
    const indexB = lightningLaneOrder.indexOf(keyB);
    
    // If both are Lightning Lane icons, use the specified order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is a Lightning Lane icon, it comes first
    if (indexA !== -1) return -1;
    // If only B is a Lightning Lane icon, it comes first
    if (indexB !== -1) return 1;
    // Neither are Lightning Lane icons, maintain original order
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark/20">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-glow mr-2" />
            <h2 className="text-xl font-semibold text-ink">Attraction Icon Legend</h2>
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
          <p className="text-ink-light mb-4">
            Icons help you quickly identify key features and characteristics of each attraction.
          </p>

          {/* Tier 1: Essential Icons */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <span className="w-2 h-2 bg-glow rounded-full mr-2"></span>
              Essential Information
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tier1Icons.map(([key, icon]) => (
                <div key={key} className="flex items-start space-x-2 p-3 rounded-lg bg-surface">
                  <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-ink">{icon.label}</h4>
                    <p className="text-sm text-ink-light">{icon.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2: Enhanced Icons */}
          <div>
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Additional Details
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tier2Icons.map(([key, icon]) => (
                <div key={key} className="flex items-start space-x-2 p-3 rounded-lg bg-blue-50">
                  <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-blue-900">{icon.label}</h4>
                    <p className="text-sm text-blue-700">{icon.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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