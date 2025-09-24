import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.post(
      `/user/admin/${userId}/unrestrict`,
      {},
      {
        headers,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
