import RoleEncryption from '@/shared/lib/role-encryption';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!accessToken) {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reissue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Refresh-Token': `Bearer ${refreshToken}`,
          },
        }
      );

      const data = await response.json();

      if (data && data.success && data.data) {
        const {
          accessToken: newAccessToken,
          accessTokenExpiredAt,
          refreshToken: newRefreshToken,
          refreshTokenExpiredAt,
          role,
        } = data.data;

        const accessTokenExpires = new Date(`${accessTokenExpiredAt}+09:00`);
        const refreshTokenExpires = new Date(`${refreshTokenExpiredAt}+09:00`);

        const nextResponse = NextResponse.next();

        nextResponse.cookies.set('accessToken', newAccessToken, {
          httpOnly: true,
          secure: !!process.env.NODE_ENV,
          expires: accessTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        nextResponse.cookies.set('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: !!process.env.NODE_ENV,
          expires: refreshTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        nextResponse.cookies.set('role', await RoleEncryption({ role }), {
          httpOnly: false,
          secure: !!process.env.NODE_ENV,
          expires: accessTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        nextResponse.cookies.set('preRole', role, {
          httpOnly: false,
          secure: !!process.env.NODE_ENV,
          expires: accessTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        return nextResponse;
      }
    }
  } catch (err) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('role');
    response.cookies.delete('preRole');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|login|register|forgot-password|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
  
};
