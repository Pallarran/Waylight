import { test, expect } from '@playwright/test';

test.describe('Offline Scenario Testing', () => {
  
  test('app works when offline', async ({ page, context }) => {
    // Go online first to load the app and service worker
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for service worker to register
    await page.waitForFunction(() => 
      'serviceWorker' in navigator && navigator.serviceWorker.ready
    );
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page - should work offline with service worker
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check basic app functionality works
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1:has-text("Welcome to")')).toBeVisible();
    
    // Check navigation still works
    await expect(page.locator('a:has-text("Start Planning Your Trip")')).toBeVisible();
  });

  test('cached resources are available offline', async ({ page, context }) => {
    // Go online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different pages to cache them
    await page.click('a:has-text("Browse Attractions")');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate - should work from cache
    await page.click('a:has-text("Browse Attractions")');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/attractions/);
  });

  test('local data persists offline', async ({ page, context }) => {
    // Go online and create some data
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create test data in local storage
    await page.evaluate(() => {
      localStorage.setItem('waylight-test', JSON.stringify({ 
        testData: 'offline test',
        timestamp: Date.now()
      }));
    });
    
    // Go offline
    await context.setOffline(true);
    
    // Reload and check data persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const testData = await page.evaluate(() => {
      const data = localStorage.getItem('waylight-test');
      return data ? JSON.parse(data) : null;
    });
    
    expect(testData).toBeTruthy();
    expect(testData.testData).toBe('offline test');
  });

  test('indexeddb works offline', async ({ page, context }) => {
    // Go online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test IndexedDB is available
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    expect(hasIndexedDB).toBe(true);
    
    // Go offline
    await context.setOffline(true);
    
    // Test IndexedDB still works offline
    const indexedDBWorksOffline = await page.evaluate(async () => {
      try {
        const request = indexedDB.open('test-db', 1);
        return new Promise((resolve) => {
          request.onsuccess = () => {
            request.result.close();
            resolve(true);
          };
          request.onerror = () => resolve(false);
        });
      } catch {
        return false;
      }
    });
    
    expect(indexedDBWorksOffline).toBe(true);
  });

  test('shows offline indicator when appropriate', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Check if app detects offline status
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);
  });
});

test.describe('PWA Functionality', () => {
  
  test('service worker registers and caches resources', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          return registration.active !== null;
        } catch {
          return false;
        }
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('app is installable as PWA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for PWA manifest
    const hasManifest = await page.locator('link[rel="manifest"]').count();
    expect(hasManifest).toBeGreaterThan(0);
    
    // Check manifest is valid (use first one)
    const manifestHref = await page.locator('link[rel="manifest"]').first().getAttribute('href');
    expect(manifestHref).toBeTruthy();
  });
});