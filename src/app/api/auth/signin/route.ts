import { AuthResponse } from '@/shared/lib/api-client';
import { apiClient } from '@/shared/lib/api-request';
import RoleEncryption from '@/shared/lib/role-encryption';
import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    const response: AuthResponse = await apiClient.post('/auth/signin', body);
    console.log(response.data.data);

    if (response.data && response.data.success && response.data.data) {
      const {
        accessToken,
        accessTokenExpiredAt,
        refreshToken,
        refreshTokenExpiredAt,
        role,
      } = response.data.data;

      const accessTokenExpires = new Date(`${accessTokenExpiredAt}+09:00`);
      const refreshTokenExpires = new Date(`${refreshTokenExpiredAt}+09:00`);

      const res = NextResponse.json(response.data.data);

      res.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: accessTokenExpires,
        sameSite: 'strict',
      });

      res.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: refreshTokenExpires,
        sameSite: 'strict',
      });

      res.cookies.set('role', RoleEncryption({role}), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        expires: accessTokenExpires,
        sameSite: 'strict',
      });

      return res;
    }
  } catch (err) {
    return NextResponse.json(
      { error: '서버에서 토큰 정보를 받아오지 못 했습니다.' },
      { status: 500 }
    );
  }
}
