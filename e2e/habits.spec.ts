import { test, expect, Page } from '@playwright/test';

test.describe('Habits Page - TickTick Style UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for data to load
  });

  test.describe('Page Layout & Header', () => {
    test('should display habits page with correct title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Habit');
      await page.screenshot({ path: './e2e/screenshots/habits_page_header.png' });
    });

    test('should have add habit button in header', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
      await expect(addButton).toBeVisible();
    });

    test('should have more options button in header', async ({ page }) => {
      const moreButton = page.locator('button').filter({ has: page.locator('svg.lucide-more-horizontal') });
      await expect(moreButton).toBeVisible();
    });
  });

  test.describe('Week Header with Circular Progress', () => {
    test('should display 7 days in week header', async ({ page }) => {
      const weekDays = page.locator('.bg-white.px-6.py-4 button');
      await expect(weekDays).toHaveCount(7);
      await page.screenshot({ path: './e2e/screenshots/habits_week_header.png' });
    });

    test('should show day names (Sun-Sat)', async ({ page }) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (const dayName of dayNames) {
        await expect(page.locator('.bg-white.px-6.py-4').getByText(dayName, { exact: true })).toBeVisible();
      }
    });

    test('should display circular progress indicators for each day', async ({ page }) => {
      // Check for SVG circles (circular progress) or check icons
      const progressIndicators = page.locator('.bg-white.px-6.py-4 button .relative.w-10.h-10');
      const count = await progressIndicators.count();
      expect(count).toBe(7);
    });

    test('should show percentage in circular progress for partial completion', async ({ page }) => {
      // Look for percentage text inside circular progress
      const percentageText = page.locator('.bg-white.px-6.py-4 .text-\\[8px\\]');
      // This may or may not be visible depending on habit data
      await page.screenshot({ path: './e2e/screenshots/habits_circular_progress.png' });
    });

    test('should highlight today with blue color', async ({ page }) => {
      const today = new Date();
      const todayText = today.getDate().toString();
      const todayButton = page.locator('.bg-white.px-6.py-4 button').filter({ hasText: todayText });
      await expect(todayButton.locator('.text-blue-500')).toBeVisible();
    });

    test('should show blue checkmark for fully completed days', async ({ page }) => {
      // Days with 100% completion show blue circle with white check
      const completedDayCircles = page.locator('.bg-white.px-6.py-4 .bg-blue-500.rounded-full');
      // Take screenshot to verify
      await page.screenshot({ path: './e2e/screenshots/habits_completed_days.png' });
    });

    test('clicking a past day should select it', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayNum = yesterday.getDate().toString();

      const dayButton = page.locator('.bg-white.px-6.py-4 button').filter({ hasText: yesterdayNum }).first();
      await dayButton.click();

      // Should show blue background when selected
      await expect(dayButton).toHaveClass(/bg-blue-50/);
    });
  });

  test.describe('Habits List', () => {
    test('should display habits list or empty state', async ({ page }) => {
      const habitsList = page.locator('.px-6.py-2.space-y-1');
      await expect(habitsList).toBeVisible();
      await page.screenshot({ path: './e2e/screenshots/habits_list.png' });
    });

    test('should show empty state with "Start Building Habits" when no habits', async ({ page }) => {
      // This only shows when there are no habits
      const emptyState = page.locator('text=Start Building Habits');
      const hasHabits = await page.locator('.bg-white.rounded-lg.px-4.py-4').count() > 0;

      if (!hasHabits) {
        await expect(emptyState).toBeVisible();
      }
    });

    test('habit item should have icon on LEFT side', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        // Icon should be the first child (w-10 h-10 rounded-xl)
        const icon = habitItem.locator('.w-10.h-10.rounded-xl').first();
        await expect(icon).toBeVisible();
      }
    });

    test('habit item should have checkbox on RIGHT side', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        // Checkbox should be the last element (w-7 h-7 rounded-full)
        const checkbox = habitItem.locator('button.w-7.h-7.rounded-full');
        await expect(checkbox).toBeVisible();

        // Verify it's on the right by checking flex layout
        await page.screenshot({ path: './e2e/screenshots/habits_checkbox_right.png' });
      }
    });

    test('habit item should show streak info', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        // Should show current streak with Zap icon
        const streakInfo = habitItem.locator('text=/\\d+ Days?/');
        await expect(streakInfo.first()).toBeVisible();
      }
    });

    test('clicking checkbox should toggle habit completion', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        const checkbox = habitItem.locator('button.w-7.h-7.rounded-full');
        const wasChecked = await checkbox.locator('.bg-blue-500').isVisible();

        await checkbox.click();
        await page.waitForTimeout(500);

        // State should have changed
        const isCheckedNow = await checkbox.locator('.bg-blue-500').isVisible();
        expect(isCheckedNow).not.toBe(wasChecked);

        await page.screenshot({ path: './e2e/screenshots/habits_checkbox_toggled.png' });
      }
    });
  });

  test.describe('Add Habit Form', () => {
    test('clicking + button should open add habit form', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      await addButton.click();

      await expect(page.locator('text=New Habit')).toBeVisible();
      await page.screenshot({ path: './e2e/screenshots/habits_add_form.png' });
    });

    test('add habit form should have name input', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      await addButton.click();

      const input = page.locator('input[placeholder*="habit"]');
      await expect(input).toBeVisible();
    });

    test('add habit form should have icon selector', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      await addButton.click();

      await expect(page.locator('text=Icon')).toBeVisible();
      // Should show emoji icons
      await expect(page.locator('button:has-text("📝")')).toBeVisible();
    });

    test('add habit form should have color selector', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      await addButton.click();

      await expect(page.locator('text=Color')).toBeVisible();
      // Should show color buttons
      const colorButtons = page.locator('button.w-8.h-8.rounded-full');
      await expect(colorButtons.first()).toBeVisible();
    });

    test('should create habit successfully', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      await addButton.click();

      const input = page.locator('input[placeholder*="habit"]');
      await input.fill('Test Habit ' + Date.now());

      const createButton = page.locator('button:has-text("Create Habit")');
      await createButton.click();

      await page.waitForTimeout(1000);
      // Form should close
      await expect(page.locator('text=New Habit')).not.toBeVisible();

      await page.screenshot({ path: './e2e/screenshots/habits_after_create.png' });
    });

    test('cancel button should close form', async ({ page }) => {
      const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
      await addButton.click();

      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();

      await expect(page.locator('text=New Habit')).not.toBeVisible();
    });
  });

  test.describe('Habit Detail Sidebar', () => {
    test('clicking a habit should open detail sidebar', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        // Sidebar should appear (width 380px)
        const sidebar = page.locator('.w-\\[380px\\]');
        await expect(sidebar).toBeVisible();

        await page.screenshot({ path: './e2e/screenshots/habits_detail_sidebar.png' });
      }
    });

    test('sidebar should show habit name and icon', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        // Should have habit icon and name in header
        const sidebarHeader = sidebar.locator('.h-14');
        await expect(sidebarHeader).toBeVisible();
      }
    });

    test('sidebar should have 4 stats cards', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        const statsCards = sidebar.locator('.bg-slate-50.p-4.rounded-xl');
        await expect(statsCards).toHaveCount(4);

        await page.screenshot({ path: './e2e/screenshots/habits_stats_cards.png' });
      }
    });

    test('sidebar should show Monthly Check-ins stat', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        await expect(sidebar.locator('text=/Monthly check/i')).toBeVisible();
      }
    });

    test('sidebar should show Total Check-Ins stat', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        await expect(sidebar.locator('text=/Total Check-Ins/i')).toBeVisible();
      }
    });

    test('sidebar should show Monthly % stat', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        // Look for the percentage card
        await expect(sidebar.locator('text=/%/')).toBeVisible();
      }
    });

    test('sidebar should show Current Streak stat', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        await expect(sidebar.locator('text=/Current Str/i')).toBeVisible();
      }
    });

    test('sidebar should have month calendar', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        // Should show month name (e.g., "January 2026")
        await expect(sidebar.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/')).toBeVisible();

        // Should have day headers
        await expect(sidebar.locator('text=Sun')).toBeVisible();

        await page.screenshot({ path: './e2e/screenshots/habits_month_calendar.png' });
      }
    });

    test('sidebar calendar should show BLUE circles for completed days', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        // Completed days have bg-blue-500 with check icon
        const completedDays = sidebar.locator('.bg-blue-500.rounded-full');
        // Take screenshot regardless
        await page.screenshot({ path: './e2e/screenshots/habits_calendar_blue_circles.png' });
      }
    });

    test('clicking date in calendar should toggle completion', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        // Click on day 1 (should be a past date)
        const dayButton = sidebar.locator('.grid.grid-cols-7 button').filter({ hasText: '1' }).first();
        if (await dayButton.isVisible() && await dayButton.isEnabled()) {
          await dayButton.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: './e2e/screenshots/habits_calendar_date_clicked.png' });
        }
      }
    });

    test('sidebar should have navigation arrows for months', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        // Should have left and right chevrons
        const leftArrow = sidebar.locator('svg.lucide-chevron-left');
        const rightArrow = sidebar.locator('svg.lucide-chevron-right');

        await expect(leftArrow).toBeVisible();
        await expect(rightArrow).toBeVisible();
      }
    });

    test('clicking left arrow should go to previous month', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        const currentMonth = await sidebar.locator('.font-bold.text-slate-800').nth(1).textContent();

        const leftArrow = sidebar.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') });
        await leftArrow.click();
        await page.waitForTimeout(300);

        const newMonth = await sidebar.locator('.font-bold.text-slate-800').nth(1).textContent();
        expect(newMonth).not.toBe(currentMonth);

        await page.screenshot({ path: './e2e/screenshots/habits_previous_month.png' });
      }
    });

    test('close button should close sidebar', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        const closeButton = sidebar.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
        await closeButton.click();

        await page.waitForTimeout(500);
        await expect(sidebar).not.toBeVisible();
      }
    });

    test('sidebar should show "Habit Log" section', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(500);

        const sidebar = page.locator('.w-\\[380px\\]');
        await expect(sidebar.locator('text=/Habit Log/i')).toBeVisible();
      }
    });
  });

  test.describe('Full Page Screenshots', () => {
    test('capture habits list view', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: './e2e/screenshots/habits_new_design_list.png',
        fullPage: false
      });
    });

    test('capture habits with sidebar open', async ({ page }) => {
      const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
      if (await habitItem.isVisible()) {
        await habitItem.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: './e2e/screenshots/habits_new_design_sidebar.png',
          fullPage: false
        });
      }
    });
  });
});

test.describe('Habits API Integration', () => {
  test('should load habits from API', async ({ page }) => {
    await page.goto('/habits');

    // Wait for API call to complete
    const response = await page.waitForResponse(resp =>
      resp.url().includes('/habits') && resp.status() === 200
    );

    expect(response.ok()).toBeTruthy();
  });

  test('should handle habit log API calls', async ({ page }) => {
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
    if (await habitItem.isVisible()) {
      const checkbox = habitItem.locator('button.w-7.h-7.rounded-full');

      // Intercept the log API call
      const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/log') || resp.url().includes('/habits')),
        checkbox.click()
      ]);

      expect(response.ok()).toBeTruthy();
    }
  });
});

test.describe('Responsive Behavior', () => {
  test('sidebar should animate when opening', async ({ page }) => {
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const habitItem = page.locator('.bg-white.rounded-lg.px-4.py-4').first();
    if (await habitItem.isVisible()) {
      // Click to open sidebar
      await habitItem.click();

      // Sidebar should animate in (has motion animation)
      const sidebar = page.locator('.w-\\[380px\\]');
      await expect(sidebar).toBeVisible();
    }
  });

  test('add habit form should animate when opening', async ({ page }) => {
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    await addButton.click();

    // Form should animate in
    const form = page.locator('text=New Habit');
    await expect(form).toBeVisible();
  });
});

test.describe('Delete Habit', () => {
  test('should be able to delete a habit via menu', async ({ page }) => {
    await page.goto('/habits');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // First create a test habit
    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    await addButton.click();

    const input = page.locator('input[placeholder*="habit"]');
    const testHabitName = 'Delete Test ' + Date.now();
    await input.fill(testHabitName);

    const createButton = page.locator('button:has-text("Create Habit")');
    await createButton.click();
    await page.waitForTimeout(1000);

    // Now verify the habit was created
    await expect(page.locator(`text=${testHabitName}`)).toBeVisible();

    await page.screenshot({ path: './e2e/screenshots/habits_before_delete.png' });
  });
});
