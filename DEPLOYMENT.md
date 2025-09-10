# Deployment Guide

## Cloudflare Pages Deployment

This project is configured to deploy to Cloudflare Pages with optimized settings to handle rate limiting and improve performance.

### Quick Deploy

```bash
# Using the retry script (recommended)
./deploy.sh

# Or manual deployment
npx wrangler deploy
```

### Rate Limiting Issues

If you encounter rate limiting errors (code: 10429), this is a temporary Cloudflare API limitation. The deployment will automatically retry with exponential backoff.

**Solutions:**
1. **Wait and retry** - Rate limits reset after a few minutes
2. **Use the deployment script** - `./deploy.sh` includes automatic retry logic
3. **Manual retry** - Wait 30-60 seconds between attempts

### Build Optimizations

The project includes several optimizations to reduce deployment time and bundle size:

- **Code splitting** - Vendor libraries are separated into chunks
- **Tree shaking** - Unused code is removed
- **Minification** - Console logs and debug code are stripped
- **Asset optimization** - Images and static files are optimized

### Configuration Files

- `wrangler.jsonc` - Cloudflare deployment configuration
- `vite.config.ts` - Build optimization settings
- `.github/workflows/deploy.yml` - Automated CI/CD pipeline

### Environment Variables

For GitHub Actions deployment, set these secrets:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Troubleshooting

#### Bundle Size Warnings
The build may show warnings about large chunks (>500KB). This is normal for React applications. The configuration includes:
- Manual chunking for better caching
- Increased warning limit to 1000KB
- Terser minification for smaller bundles

#### Deployment Failures
1. **Rate limiting** - Use the retry script or wait before retrying
2. **Build errors** - Check the build logs in the terminal
3. **API errors** - Verify your Cloudflare credentials

#### Performance Tips
- Use the deployment script for automatic retry handling
- Deploy during off-peak hours to avoid rate limits
- Monitor bundle size and optimize imports as needed

### Manual Deployment Steps

1. **Build the application:**
   ```bash
   cd simplr-front-end/simplr-react
   npm install
   npm run build
   ```

2. **Deploy to Cloudflare:**
   ```bash
   cd ../../
   npx wrangler deploy
   ```

3. **If rate limited, wait and retry:**
   ```bash
   # Wait 30-60 seconds
   npx wrangler deploy
   ```

### Automated Deployment

Push to the `main` branch triggers automatic deployment via GitHub Actions with built-in retry logic for handling rate limiting issues.