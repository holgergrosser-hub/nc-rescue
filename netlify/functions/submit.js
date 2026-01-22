export default async (request, context) => {
  try {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST' },
      });
    }

    const appsScriptUrl =
      process.env.APPS_SCRIPT_URL ||
      process.env.VITE_SCRIPT_URL ||
      process.env.SCRIPT_URL;

    if (!appsScriptUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Missing APPS_SCRIPT_URL (or VITE_SCRIPT_URL) environment variable.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = await request.json();

    const upstream = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }
    );
  }
};
