import { handlePostResetDemo } from '@/server/http/handlers';

export const dynamic = 'force-dynamic';

export async function POST() {
  return handlePostResetDemo();
}
