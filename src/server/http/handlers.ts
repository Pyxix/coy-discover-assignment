import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DiscoverService, NotFoundError, ConflictError } from '../services/discoverService';

const swipeSchema = z.object({
  profileId: z.string({ required_error: 'profileId is required' }).min(1, 'profileId cannot be empty'),
  action: z.enum(['like', 'pass'], {
    errorMap: () => ({ message: "action must be either 'like' or 'pass'" }),
  }),
});

function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

export async function handleGetFeed(service = new DiscoverService()): Promise<NextResponse> {
  try {
    const feed = service.getFeed();
    return jsonResponse(feed);
  } catch (error) {
    console.error('Error in handleGetFeed:', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
}

export async function handlePostSwipe(
  request: NextRequest,
  service = new DiscoverService()
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const parsed = swipeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      {
        error: 'Validation Error',
        details: parsed.error.issues.map(i => i.message),
      },
      400
    );
  }

  try {
    const result = service.swipe(parsed.data.profileId, parsed.data.action);
    return jsonResponse(result, 200);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }
    if (error instanceof ConflictError) {
      return jsonResponse({ error: error.message }, 409);
    }
    console.error('Error in handlePostSwipe:', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
}

export async function handleGetMatches(service = new DiscoverService()): Promise<NextResponse> {
  try {
    const matches = service.getMatches();
    return jsonResponse(matches);
  } catch (error) {
    console.error('Error in handleGetMatches:', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
}

export async function handlePostResetDemo(service = new DiscoverService()): Promise<NextResponse> {
  try {
    const result = service.resetDemo();
    return jsonResponse(result, 200);
  } catch (error) {
    console.error('Error in handlePostResetDemo:', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
}
