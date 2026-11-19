import { NextRequest } from 'next/server';
import { handlePostSwipe } from '@/server/http/handlers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handlePostSwipe(request);
}
