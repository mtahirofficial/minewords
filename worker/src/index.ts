export interface Env {
  MY_BUCKET: R2Bucket;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith('/files/')) {
      return handleFileRequest(request, url, env);
    }

    if (url.pathname !== '/upload') {
      return json(
        { error: 'Not found. Use POST /upload, GET /files/:key, or DELETE /files/:key.' },
        404,
      );
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed. Use POST.' }, 405);
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const folderInput = formData.get('folder');

      if (!(file instanceof File)) {
        return json({ error: 'Missing file field.' }, 400);
      }

      const folder = sanitizeFolder(
        typeof folderInput === 'string' ? folderInput : 'profiles',
      );
      const extension = getExtension(file.name, file.type);
      const objectKey = `${folder}/${crypto.randomUUID()}${extension}`;

      await env.MY_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
        },
      });

      const publicUrl = buildPublicUrl(url, objectKey);
      return json({ publicUrl }, 200);
    } catch (error) {
      return json(
        {
          error:
            error instanceof Error ? error.message : 'Unexpected upload error.',
        },
        500,
      );
    }
  },
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function sanitizeFolder(input: string) {
  return (
    input
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '') || 'profiles'
  );
}

function getExtension(fileName: string, mimeType: string) {
  const cleanedName = fileName.trim();
  const dotIndex = cleanedName.lastIndexOf('.');
  if (dotIndex >= 0) {
    return cleanedName.slice(dotIndex);
  }

  if (mimeType === 'image/jpeg') {
    return '.jpg';
  }
  if (mimeType === 'image/png') {
    return '.png';
  }
  if (mimeType === 'image/webp') {
    return '.webp';
  }
  if (mimeType === 'audio/mp4') {
    return '.m4a';
  }
  if (mimeType === 'audio/aac') {
    return '.aac';
  }
  if (mimeType === 'audio/mpeg') {
    return '.mp3';
  }
  if (mimeType === 'audio/wav') {
    return '.wav';
  }
  if (mimeType === 'audio/ogg') {
    return '.ogg';
  }
  if (mimeType === 'audio/webm') {
    return '.webm';
  }
  if (mimeType === 'audio/x-caf') {
    return '.caf';
  }

  return '';
}

async function handleFileRequest(request: Request, url: URL, env: Env) {
  if (!url.pathname.startsWith('/files/')) {
    return json({ error: 'Not found.' }, 404);
  }

  const objectKey = decodeURIComponent(
    url.pathname.replace(/^\/files\/+/, ''),
  ).replace(/^\/+/, '');

  if (!objectKey) {
    return json({ error: 'Missing file key.' }, 400);
  }

  if (request.method === 'DELETE') {
    await env.MY_BUCKET.delete(objectKey);
    return json({ deleted: true }, 200);
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json(
      { error: 'Method not allowed. Use GET, HEAD, or DELETE.' },
      405,
    );
  }

  const object = await env.MY_BUCKET.get(objectKey);

  if (!object) {
    return json({ error: 'File not found.' }, 404);
  }

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(request.method === 'HEAD' ? null : object.body, {
    headers,
  });
}

function buildPublicUrl(requestUrl: URL, objectKey: string) {
  const normalizedKey = objectKey
    .replace(/^\/+/, '')
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return `${requestUrl.origin}/files/${normalizedKey}`;
}
