// Cloudflare Workers SPA routing for React Router
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Check if the request is for a static asset
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    const isStaticAsset = staticExtensions.some(ext => url.pathname.endsWith(ext));
    
    // If it's a static asset or API route, let it through
    if (isStaticAsset || url.pathname.startsWith('/api/')) {
      return fetch(request);
    }
    
    // For all other routes, serve the main index.html
    // This allows React Router to handle client-side routing
    const indexUrl = new URL('/index.html', request.url);
    return fetch(indexUrl);
  }
};