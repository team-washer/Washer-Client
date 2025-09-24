import { apiClient } from '@/shared/lib/api-request';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const formattedBody = {
    email: String(body.email || ''),
    password: String(body.password || ''),
    name: String(body.name || ''),
    schoolNumber: String(body.schoolNumber || ''),
    gender: String(body.gender || ''),
    room: String(body.room || ''),
  };

  try {
    const response = await apiClient.post('/auth/signup', formattedBody);

    if (response.data && response.data.success) {
      return NextResponse.json(response.data, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.error?.message },
      { status: error?.status }
    );
  }
}
