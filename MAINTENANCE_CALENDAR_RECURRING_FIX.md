# Maintenance Calendar Recurring Events Fix

## Summary
Fixed the maintenance calendar to properly display recurring maintenance schedules from contracts while keeping the list view showing only actual scheduled visits.

## Changes Made

### 1. Frontend - Maintenance.tsx
- **Added calendar events state**: Separated `calendarEvents` from `visits` to handle recurring events
- **Added month tracking**: Added `currentMonth` state to track which month is being viewed
- **New `fetchCalendarEvents` function**: Fetches events from the `/maintenance/calendar` endpoint which generates recurring events based on contracts
- **Updated event click handler**: Now handles both actual visits (number IDs) and recurring contract events (string IDs)
- **Added month change handler**: Triggers calendar event refresh when user navigates between months
- **Calendar view**: Now uses `calendarEvents` which includes both actual visits and recurring contract schedules
- **List view**: Still uses `visits` which only shows actual scheduled visits (not recurring)

### 2. Frontend - Calendar.tsx
- **Updated CalendarProps**: Changed `id` type from `number` to `number | string` to support recurring event IDs
- **Updated onEventClick**: Now accepts `number | string` for event IDs
- **Added onMonthChange callback**: Notifies parent component when month changes
- **Visual distinction for recurring events**: 
  - Recurring events show with dashed border and reduced opacity
  - Added a circular arrow icon (↻) to indicate recurring events
  - Hover tooltip shows "(Recurring)" label

### 3. Backend - MaintenanceController.php
The `calendar()` method was already implemented and properly:
- Generates recurring events based on contract frequency (weekly, monthly, quarterly, etc.)
- Respects contract start and end dates
- Avoids duplicating events where actual visits already exist
- Returns both actual visits and generated recurring events

## How It Works

### Calendar View
1. When user views the calendar, it fetches events for the current month
2. Backend generates recurring events from active contracts using their frequency settings
3. Calendar displays:
   - **Actual visits**: Solid appearance, clickable to view details
   - **Recurring schedules**: Dashed border, reduced opacity, with ↻ icon
4. When user navigates to different months, new events are fetched for that month range

### List View
- Shows only actual scheduled visits from the database
- Does not show recurring contract schedules
- Each visit appears once in the list

### User Experience
- **Calendar**: See all maintenance schedules including recurring patterns
- **List**: See only actual scheduled visits for detailed management
- **Recurring events**: Clicking shows a toast suggesting to create an actual visit
- **Actual visits**: Clicking opens the detail modal

## Example
If a contract has weekly maintenance:
- **Calendar view**: Shows an event every week for the visible month
- **List view**: Shows only the weeks where an actual visit has been scheduled

This gives users visibility into the maintenance schedule while keeping the list manageable.
