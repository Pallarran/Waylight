// Data exports
export * from './parks';
export * from './attractions';

// Content validation and loading
export interface ContentManifest {
  version: string;
  lastUpdated: string;
  parks: number;
  attractions: number;
  tips: number;
}

export const getContentManifest = (): ContentManifest => {
  const parks = 4; // Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom
  const attractions = 65; // Total attractions (rides, shows, dining, entertainment)
  const tips = attractions * 3; // Each attraction has ~3 tips
  
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    parks,
    attractions,
    tips,
  };
};

export const validateContent = async (): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const { getParks } = await import('./parks');
    const { getAttractions } = await import('./attractions');
    
    const parks = getParks();
    const attractions = getAttractions();
    
    // Validate parks
    if (parks.length === 0) {
      errors.push('No parks found in database');
    }
    
    // Validate attractions
    if (attractions.length === 0) {
      errors.push('No attractions found in database');
    }
    
    // Check for orphaned attractions (attractions without valid park)
    const parkIds = new Set(parks.map(p => p.id));
    const orphanedAttractions = attractions.filter(a => !parkIds.has(a.parkId));
    if (orphanedAttractions.length > 0) {
      errors.push(`${orphanedAttractions.length} attractions reference non-existent parks`);
    }
    
    // Check for duplicate attraction IDs
    const attractionIds = attractions.map(a => a.id);
    const duplicates = attractionIds.filter((id, index) => attractionIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate attraction IDs found: ${duplicates.join(', ')}`);
    }
    
    // Validate attraction data quality
    attractions.forEach(attraction => {
      if (!attraction.name || attraction.name.trim().length === 0) {
        errors.push(`Attraction ${attraction.id} has empty name`);
      }
      
      if (!attraction.description || attraction.description.length < 10) {
        warnings.push(`Attraction ${attraction.id} has very short description`);
      }
      
      if (attraction.duration <= 0) {
        errors.push(`Attraction ${attraction.id} has invalid duration`);
      }
      
      if (attraction.tips.length === 0) {
        warnings.push(`Attraction ${attraction.id} has no tips`);
      }
      
      if (attraction.tags.length === 0) {
        warnings.push(`Attraction ${attraction.id} has no tags`);
      }
    });
    
    // Validation completed successfully
    
  } catch (error) {
    errors.push(`Failed to load content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};