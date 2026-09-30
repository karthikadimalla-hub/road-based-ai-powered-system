import React from 'react';
import {
  AlertTriangle,
  Flame,
  Lightbulb,
  Droplets,
  Construction,
  GitCommit,
  Milestone,
  Trees,
  CircleDot,
  HelpCircle,
} from 'lucide-react';
import { HazardCategory } from '../types';
import { translations, SupportedLanguage } from '../translations';

interface CategoryIconProps {
  category: HazardCategory | string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  className = 'w-5 h-5',
  size,
}) => {
  switch (category) {
    case 'pothole':
      return <CircleDot className={className} size={size} />;
    case 'damaged_road':
      return <Construction className={className} size={size} />;
    case 'traffic_signal':
      return <Flame className={className} size={size} />;
    case 'streetlight':
      return <Lightbulb className={className} size={size} />;
    case 'open_manhole':
      return <AlertTriangle className={className} size={size} />;
    case 'waterlogging':
      return <Droplets className={className} size={size} />;
    case 'road_obstruction':
      return <Trees className={className} size={size} />;
    case 'unsafe_intersection':
      return <GitCommit className={className} size={size} />;
    case 'damaged_sign':
      return <Milestone className={className} size={size} />;
    default:
      return <HelpCircle className={className} size={size} />;
  }
};

export function getCategoryLabel(category: HazardCategory | string, lang?: SupportedLanguage): string {
  const currentLang: SupportedLanguage =
    lang ||
    (typeof window !== 'undefined'
      ? (localStorage.getItem('roadsafe_preferred_language') as SupportedLanguage)
      : 'en') ||
    'en';

  const dict = translations[currentLang] || translations.en;
  const key = `category.${category}`;
  if (dict && dict[key]) {
    return dict[key];
  }

  // Fallback
  switch (category) {
    case 'pothole':
      return 'Pothole';
    case 'damaged_road':
      return 'Damaged Road';
    case 'traffic_signal':
      return 'Broken Traffic Signal';
    case 'streetlight':
      return 'Non-working Streetlight';
    case 'open_manhole':
      return 'Open Manhole';
    case 'waterlogging':
      return 'Waterlogging';
    case 'road_obstruction':
      return 'Road Obstruction';
    case 'unsafe_intersection':
      return 'Unsafe Intersection';
    case 'damaged_sign':
      return 'Damaged Sign';
    default:
      return 'Other Road Hazard';
  }
}
