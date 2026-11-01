# aurex

## Contact form setup

The contact form stores submissions in Supabase PostgreSQL through a Supabase Edge Function. The service-role key is provided to Edge Functions by Supabase and must never be added to client-side HTML or CSS.

1. Create a Supabase project and run [`supabase/contact_messages.sql`](./supabase/contact_messages.sql) in its SQL Editor.
2. Install and authenticate the Supabase CLI, then link this repository to the project:

   ```sh
   supabase login
   supabase link --project-ref aouxrrndtvhnifedqhwm
   ```

3. Add the absolute URL of this site's contact page as an Edge Function secret:

   ```sh
   supabase secrets set AUREX_RETURN_URL=https://YOUR_SITE_URL/touch.html
   ```

4. Deploy the function:

   ```sh
   supabase functions deploy contact
   ```

The form in [`touch.html`](./touch.html) now posts to this project's `contact` Edge Function. The function validates submissions on the server and inserts them into `public.contact_messages`. Direct access to the table is not granted to anonymous or authenticated browser clients.

Supabase reserves secret names beginning with `SUPABASE_` and injects its project keys into Edge Functions automatically, including `SUPABASE_SERVICE_ROLE_KEY`. Do not add a separate `SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` secret. The form will not store messages until the SQL is run, `AUREX_RETURN_URL` is configured, and the Edge Function is deployed. Keep the service-role key and database password private; never put them in the website files or share them in chat.