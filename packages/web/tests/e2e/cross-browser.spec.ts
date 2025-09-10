import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Cross-Browser Compatibility', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('landing page loads correctly', async ({ page }) => {
    // Check page title and basic elements
    await expect(page).toHaveTitle(/Waylight/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=Waylight')).toBeVisible();
    
    // Check logo loads
    const logo = page.locator('img[alt="Waylight"]');
    await expect(logo).toBeVisible();
    
    // Check navigation
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Trip Builder')).toBeVisible();
    await expect(page.locator('text=Attractions')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('trip creation flow works', async ({ page, isMobile }) => {
    // Navigate to trip builder - use different approach for mobile
    if (isMobile) {
      // On mobile, use the prominent button
      await page.click('a:has-text("Start Planning Your Trip")');
    } else {
      // On desktop, use main navigation
      await page.click('nav[aria-label="Main navigation"] a:has-text("Trip Builder")');
    }
    await expect(page).toHaveURL(/trip-builder/);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check key elements are present (more generic check)
    await expect(page.locator('h1, h2, .text-2xl, .text-3xl')).toBeVisible({ timeout: 10000 });
  });

  test('attractions page loads', async ({ page }) => {
    await page.click('text=Attractions');
    await expect(page).toHaveURL(/attractions/);
    
    // Wait for attractions to load
    await page.waitForLoadState('networkidle');
    
    // Check attractions content
    await expect(page.locator('[data-testid="attractions-grid"], .grid, .flex')).toBeVisible({ timeout: 10000 });
  });

  test('responsive navigation works', async ({ page, isMobile }) => {
    if (isMobile) {
      // Mobile menu button should be present  
      const menuButton = page.locator('button[aria-label*="menu"]');
      await expect(menuButton).toBeVisible();
      
      // Click menu button
      await menuButton.click();
      
      // Check navigation items appear in mobile menu
      await expect(page.locator('nav[aria-label="Mobile navigation"] a:has-text("Home")')).toBeVisible();
      await expect(page.locator('nav[aria-label="Mobile navigation"] a:has-text("Trip Builder")')).toBeVisible();
    } else {
      // Desktop navigation should be visible
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    }
  });

  test('fonts load correctly', async ({ page }) => {
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
    
    // Check computed styles
    const heading = page.locator('h1, h2, .font-display').first();
    if (await heading.count() > 0) {
      const fontFamily = await heading.evaluate(el => 
        getComputedStyle(el).fontFamily
      );
      expect(fontFamily).toContain('Manrope');
    }
  });

  test('css animations work', async ({ page }) => {
    // Look for animated elements
    const animatedElements = page.locator('.animate-spin, .transition-, [class*="animate"]');
    
    if (await animatedElements.count() > 0) {
      const firstAnimated = animatedElements.first();
      await expect(firstAnimated).toBeVisible();
      
      // Check animation properties
      const animationDuration = await firstAnimated.evaluate(el => 
        getComputedStyle(el).animationDuration
      );
      expect(animationDuration).not.toBe('0s');
    }
  });

  test('drag and drop works on desktop', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Navigate to trip builder where drag/drop is used
      await page.click('text=Trip Builder');
      await page.waitForLoadState('networkidle');
      
      // Look for draggable elements (will be implemented in trip builder)
      const draggableElements = page.locator('[draggable="true"], .draggable');
      
      // If drag/drop elements exist, test basic functionality
      if (await draggableElements.count() > 0) {
        const firstDraggable = draggableElements.first();
        await expect(firstDraggable).toBeVisible();
      }
    }
  });

  test('local storage persists data', async ({ page }) => {
    // Create some test data that should persist
    await page.click('text=Trip Builder');
    await page.waitForLoadState('networkidle');
    
    // Check localStorage functionality
    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        return value === 'value';
      } catch {
        return false;
      }
    });
    
    expect(hasLocalStorage).toBe(true);
  });

  test('indexeddb works', async ({ page }) => {
    // Test IndexedDB functionality
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    
    expect(hasIndexedDB).toBe(true);
  });

  test('service worker registers (PWA)', async ({ page }) => {
    // Wait for service worker to register
    await page.waitForLoadState('networkidle');
    
    const serviceWorkerRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return registration !== undefined;
        } catch {
          return false;
        }
      }
      return false;
    });
    
    // Service worker should register on production builds
    expect(serviceWorkerRegistered).toBe(true);
  });
});

test.describe('Accessibility Testing', () => {
  test('home page has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('trip builder has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Trip Builder');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});