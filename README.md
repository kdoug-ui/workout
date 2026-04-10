# iPhone Workout App

This is a small mobile-first web app for workout logging.

## What it does

- quick exercise entry on phone
- one saved entry per exercise
- session view for today
- history view
- latest progress per exercise
- CSV export for Excel
- local storage in the browser

## Files

- `index.html` - app shell and styles
- `app.js` - workout logic and local storage
- `manifest.webmanifest` - install metadata for Home Screen use
- `sw.js` - basic offline caching

## Best way to use on iPhone

This should be hosted online, then opened in Safari.

Recommended simple hosting options:

- GitHub Pages
- Netlify Drop
- Cloudflare Pages

### GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repo root.
3. In GitHub, open `Settings` > `Pages`.
4. Under `Build and deployment`, choose:
   Source: `Deploy from a branch`
5. Select:
   Branch: `main`
   Folder: `/ (root)`
6. Save.
7. Wait for GitHub Pages to publish the site.

After hosting:

1. Open the hosted URL in Safari on iPhone.
2. Tap Share.
3. Tap `Add to Home Screen`.
4. Use it like an app.

## Current limitation

Data is stored in the browser on that device only.

For the next version, the best upgrade is adding cloud storage with Supabase or Firebase so workout history is synced and backed up.
