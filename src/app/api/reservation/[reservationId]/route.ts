import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const floor = searchParams.get('floor');
  const { reservationId } = params;
  const accessToken = request.cookies.get('accessToken')?.value;
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  try {
    const response = await apiClient.delete(
      `/reservation/${reservationId}`,
      { headers, params: { type, floor } }
    );
    console.log('예약 취소 응답:', response.data);
    if (response.data && response.data.success) {
      return new Response(response.data.message, { status: 200 });
    } else {
      return new Response(response.data.message, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: '서버에서 사용자 제한 해제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
