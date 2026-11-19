import { handleGetFeed } from '@/server/http/handlers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleGetFeed();
}
