# Summary Styles Context

This document summarizes the Summary Styles context used within the app.

## Context API
- `styles`: array of available summary styles
- `loading`: indicates whether styles are being loaded
- `error`: error message from hydration
- `hydrate()`: load styles from storage and seed defaults if none exist
- `list()`: return styles sorted by last update time
- `create(style)`: add a new custom style
- `update(id, updates)`: modify an existing style
- `remove(id)`: delete a style
- `on(event, listener)`: register a change listener
- `off(event, listener)`: remove a change listener

## Events
- **Type**: `"summaryStyles/changed"`
- **Reasons**: `seed`, `create`, `update`, `remove`

## Storage
- **Key**: `"summaryStyles:v1"`

## Default Seeding
When no styles are found in storage, the context seeds the following built-in styles:
- Quick Summary
- Detailed Summary
- Bullet Points
- Action Items
- Key Takeaways
- Meeting Minutes
