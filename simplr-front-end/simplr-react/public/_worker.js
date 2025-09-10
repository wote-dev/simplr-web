// Cloudflare Workers SPA routing for React Router
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Check if the request is for a static asset
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.map'];
    const isStaticAsset = staticExtensions.some(ext => url.pathname.endsWith(ext));
    
    // If it's a static asset, serve it from the assets
    if (isStaticAsset && url.pathname !== '/_worker.js') {
      return env.ASSETS.fetch(request);
    }
    
    // For all other routes, serve the main index.html
    // This allows React Router to handle client-side routing
    const indexRequest = new Request(new URL('/index.html', request.url), request);
    return env.ASSETS.fetch(indexRequest);
  }
};