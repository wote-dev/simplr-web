export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle static assets
    if (url.pathname.includes('.')) {
      return env.ASSETS.fetch(request);
    }
    
    // For all other routes, serve index.html for SPA routing
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  }
};