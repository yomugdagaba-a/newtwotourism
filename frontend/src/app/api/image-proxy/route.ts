import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

// Agent that ignores self-signed certs (safe for local dev; in prod backend has real cert)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const httpAgent = new http.Agent();

function fetchImage(url: string): Promise<{ ok: boolean; status: number; contentType: string; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const agent = isHttps ? httpsAgent : httpAgent;
    const lib = isHttps ? https : http;

    const req = lib.get(url, { agent } as any, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 500,
          contentType: (res.headers['content-type'] as string) || 'image/jpeg',
          buffer: Buffer.concat(chunks),
        });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imagePath = searchParams.get('path');

  if (!imagePath) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  // Only allow /uploads/ paths to prevent open proxy abuse
  if (!imagePath.startsWith('/uploads/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://localhost:9001/api').replace('/api', '');
  const imageUrl = `${backendBase}${imagePath}`;

  try {
    const result = await fetchImage(imageUrl);

    if (!result.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    return new NextResponse(result.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        // Cache aggressively — UUID filenames never change content
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[image-proxy] Failed to fetch:', imageUrl, err);
    return new NextResponse('Failed to load image', { status: 502 });
  }
}
