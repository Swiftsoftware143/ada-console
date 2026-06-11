# Deploy to Netlify

## Quick Deploy

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub → Select `funnelswift` repo
   - Build settings auto-detected from `netlify.toml`

3. **Environment Variables**
   Add these in Netlify Dashboard → Site settings → Environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_MINTBIRD_URL=https://mintbird.com/checkout
   NEXT_PUBLIC_APP_URL=https://funnelswift.netlify.app
   ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify builds automatically on every push

## Manual Deploy (CLI)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to site
netlify link

# Deploy
netlify deploy --prod
```

## Post-Deploy Setup

1. **Supabase Setup**
   - Run SQL from `/database/schema.sql`
   - Run SQL from `/database/seo-schema.sql`
   - Set up Row Level Security policies

2. **MintBird Integration**
   - Create products in MintBird for each plan
   - Set return URL to `https://your-site.netlify.app/signup/success`

3. **SEO Settings**
   - Visit `/admin/seo`
   - Configure site name, description, social links
   - Upload OG image (1200x630px)

4. **Custom Domain (Optional)**
   - Netlify Dashboard → Domain settings
   - Add custom domain
   - Configure DNS

## Troubleshooting

**Build fails?**
- Check Node version (should be 20)
- Verify environment variables are set
- Check build logs in Netlify dashboard

**API routes not working?**
- Ensure `@netlify/plugin-nextjs` is installed
- Check redirects in `netlify.toml`

**Images not loading?**
- Check image domains in `next.config.js`
- Verify images are in `/public` folder
