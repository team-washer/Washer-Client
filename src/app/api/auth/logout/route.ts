import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;

  try {
    const response = await apiClient.post(
      '/auth/logout',
      {},
      {
        headers: {
          'Refresh-Token': `Bearer ${refreshToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json(error);
  }
}
