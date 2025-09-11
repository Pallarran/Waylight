// Data exports
export * from './parks';
export * from './hotels';
export * from './do';
export * from './eat';

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
    const { getAllDoItems } = await import('./do');
    const { getAllEatItems } = await import('./eat');
    
    const parks = getParks();
    const doItems = getAllDoItems();
    const eatItems = getAllEatItems();
    const allItems = [...doItems, ...eatItems];
    
    // Validate parks
    if (parks.length === 0) {
      errors.push('No parks found in database');
    }
    
    // Validate items
    if (allItems.length === 0) {
      errors.push('No items found in database');
    }
    
    // Check for orphaned items (items without valid park)
    const parkIds = new Set(parks.map(p => p.id));
    const orphanedItems = allItems.filter(item => item.parkId && !parkIds.has(item.parkId));
    if (orphanedItems.length > 0) {
      errors.push(`${orphanedItems.length} items reference non-existent parks`);
    }
    
    // Check for duplicate item IDs
    const itemIds = allItems.map(item => item.id);
    const duplicates = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate item IDs found: ${duplicates.join(', ')}`);
    }
    
    // Validate item data quality
    allItems.forEach(item => {
      if (!item.name || item.name.trim().length === 0) {
        errors.push(`Item ${item.id} has empty name`);
      }
      
      if (!item.description || item.description.length < 10) {
        warnings.push(`Item ${item.id} has very short description`);
      }
      
      if (item.tips && item.tips.length === 0) {
        warnings.push(`Item ${item.id} has no tips`);
      }
      
      if (item.tags && item.tags.length === 0) {
        warnings.push(`Item ${item.id} has no tags`);
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

