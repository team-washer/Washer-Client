import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { machineId: string } }
) {
  const { machineId } = params;
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.post(
      `/reservation/${machineId}`,
      {},
      {
        headers,
      }
    );

    if (response.data && response.data.success) {
      return new Response(response.data.message, { status: 200 });
    } else {
      return new Response(response.data.message, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 사용자 제한 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}
