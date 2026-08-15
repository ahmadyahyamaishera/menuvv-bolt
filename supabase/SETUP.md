# Menuvv Supabase setup

The app already reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Replit environment variables.

## 1. Create the private rate-card table

Open the Supabase SQL Editor and run:

```text
supabase/migrations/001_menuvv_rate_cards.sql
```

The migration creates the table, an index, and Row Level Security policies so signed-in users can only access their own cards.

## 2. Enable email sign-in

In **Authentication → Providers → Email**:

- Enable Email.
- Keep email confirmation enabled for production.
- Add the app’s development and published URLs under **Authentication → URL Configuration → Redirect URLs**.

The app returns to the current site origin and opens the dashboard route after OAuth.

## 3. Enable Google sign-in

In Google Cloud Console, create an OAuth web client. Add this Supabase callback URL to the Google client’s authorized redirect URIs:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Then in **Authentication → Providers → Google**:

- Enable Google.
- Paste the Google Client ID and Client Secret.
- Save the provider.

Also add the app’s development and published origins to Supabase’s Redirect URLs list. Do not commit OAuth credentials to the repository; keep them in Supabase’s provider configuration.

## 4. Verify

After signing in:

1. Open **Saved cards**.
2. Create or edit a card.
3. Refresh or open the app on another device.
4. Confirm the card appears only for the signed-in account.

If the table has not been created yet, the app keeps the current browser-local cards and displays a setup notice instead of silently discarding them.