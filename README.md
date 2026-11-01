# aurex

## Contact form setup

The contact form stores submissions in Supabase PostgreSQL through a Supabase Edge Function. The service-role key is used only by the function and must never be added to client-side HTML or CSS.

1. Create a Supabase project and run [`supabase/contact_messages.sql`](./supabase/contact_messages.sql) in its SQL Editor.
2. Install and authenticate the Supabase CLI, then link this repository to the project:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Configure the Edge Function with the server-only service-role key and the absolute URL of this site's contact page:

   ```sh
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY AUREX_RETURN_URL=https://YOUR_SITE_URL/touch.html
   ```

4. Deploy the function:

   ```sh
   supabase functions deploy contact
   ```

5. In [`touch.html`](./touch.html), replace `YOUR_PROJECT_REF` in the form's `action` with the Supabase project reference.

The function validates submissions on the server and inserts them into `public.contact_messages`. Direct access to the table is not granted to anonymous or authenticated browser clients. Until a Supabase project is configured, the form endpoint is a placeholder and submissions cannot be stored.