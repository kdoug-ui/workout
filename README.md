# iPhone Workout App

This is a small mobile-first web app for workout logging.

## What it does

- quick exercise entry on phone
- add your own exercises with the `Add Exercise` button
- delete custom exercises from the app
- one saved entry per exercise
- session view for today
- history view
- latest progress per exercise
- CSV export for Excel
- local storage in the browser
- optional Supabase cloud sync across devices

## Files

- `index.html` - app shell and styles
- `app.js` - workout logic, local storage, and optional cloud sync
- `manifest.webmanifest` - install metadata for Home Screen use
- `sw.js` - basic offline caching
- `supabase-schema.sql` - database tables and security policies

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

## Cloud sync setup

This version can stay local-only, or you can connect it to Supabase so Safari on iPhone and Chrome on desktop share the same workout data.

### In Supabase

1. Create a new Supabase project.
2. Open `SQL Editor`.
3. Run the SQL in `supabase-schema.sql`.
4. In `Authentication`, enable email sign-in.
5. Copy:
   - Project URL
   - anon public key

### In the app

1. Open the hosted app.
2. Paste your Supabase URL and anon key into the `Cloud Sync` section.
3. Enter your email.
4. Tap `Save Cloud Setup`.
5. Tap `Email Sign-In Link`.
6. Open the sign-in link from your email on each device you want synced.
7. Tap `Sync Now`.

After that:

- workout history syncs across devices
- custom exercises sync across devices
- local CSV export still works

## Current limitation

Without Supabase configured, data still stays on that device/browser only.
