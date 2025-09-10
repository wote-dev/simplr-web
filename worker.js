import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

const spa = async (event) => {
  try {
    return await getAssetFromKV(event, {
      mapRequestToAsset: (req) => {
        const url = new URL(req.url);
        // if it's a file, serve it
        if (url.pathname.split('/').pop().includes('.')) {
          return req;
        }
        // otherwise, serve index.html
        return new Request(new URL('/index.html', req.url), req);
      },
    });
  } catch (e) {
    // if the asset is not found, serve index.html
    try {
      let notFoundResponse = await getAssetFromKV(event, {
        mapRequestToAsset: (req) => new Request(new URL('/index.html', req.url), req),
      });

      return new Response(notFoundResponse.body, { ...notFoundResponse, status: 200 });
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  }
};

export default {
  async fetch(request, env, ctx) {
    const event = {
      request,
      waitUntil: (promise) => ctx.waitUntil(promise),
    };
    self.ASSET_NAMESPACE = env.__STATIC_CONTENT;
    self.ASSET_MANIFEST = __STATIC_CONTENT_MANIFEST;
    return spa(event);
  },
};
