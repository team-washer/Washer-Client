import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  const { reservationId } = params;
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.post(
      `/reservation/${reservationId}/confirm`,
      {},
      { headers }
    );

    if (response.data && response.data.success) {
      return new Response(response.data.message, { status: 200 });
    } else {
      return new Response(response.data.message, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
