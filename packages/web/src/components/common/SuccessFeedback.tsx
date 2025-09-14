import { useState, useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface SuccessFeedbackProps {
  message?: string;
  show?: boolean;
  onHide?: () => void;
  variant?: 'sparkle' | 'check' | 'glow';
  duration?: number;
}

export default function SuccessFeedback({ 
  message = "Plan updated — you're glowing.", 
  show = false,
  onHide,
  variant = 'sparkle',
  duration = 3000
}: SuccessFeedbackProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, duration, onHide]);

  if (!visible) return null;

  const variants = {
    sparkle: {
      icon: <Sparkles className="w-5 h-5 text-glow animate-sparkle" />,
      bgClass: 'bg-glow/10 border-glow/20'
    },
    check: {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bgClass: 'bg-green-50 border-green-200'
    },
    glow: {
      icon: <div className="w-3 h-3 bg-glow rounded-full animate-pulse-soft"></div>,
      bgClass: 'bg-glow/10 border-glow/20'
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={`
      fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border
      ${currentVariant.bgClass} backdrop-blur-sm shadow-medium
      animate-slide-down
    `}>
      {currentVariant.icon}
      <span className="text-ink font-medium text-sm">
        {message}
      </span>
    </div>
  );
}