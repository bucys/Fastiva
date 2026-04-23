# Fastiva

Minimal intermittent fasting tracker built with Expo React Native.

## Overview

Fastiva is a mobile-first fasting tracker focused on clean UX and clear product logic.

The app allows users to track fasting sessions, manage goals, view history, and analyze progress through intuitive charts.

## Features

- Start and end fasting sessions
- Daily fasting goal tracking
- Optional fasting plans (12/12, 14/10, 16/8, 18/6, 20/4)
- Smart goal handling during active fasts
- Calendar-based history view
- Weekly, monthly, and yearly stats
- Interactive charts (tap to inspect values)
- Local notifications (goal reached, fasting start)
- CSV data export
- Local-only data storage (no account required)

## Key Product Decisions

### Daily Goal vs Fasting Plan

- Daily Goal controls progress and completion
- Fasting Plan is optional and used for scheduling

### Active Fast Behavior

When changing the goal during an active fast:

- Apply to current fast
- Apply to next fast
- Cancel

### History Logic

- Calendar shows only the longest fast per day
- Recent Sessions shows real session history
- List view shows all sessions

## Tech Stack

- Expo
- React Native
- TypeScript
- Zustand
- AsyncStorage
- Expo Router

## Screens

- Home — timer, progress, metrics
- History — calendar + list
- Stats — week/month/year charts
- Settings — goals, plan, export, privacy

## Privacy

All data is stored locally on the device.  
No tracking, no accounts, no backend.

## Status

This project is a polished MVP built as a mobile portfolio app.

## Future Improvements

- Health integrations (Apple Health / Google Fit)
- Cloud sync
- Widgets
- Advanced analytics
