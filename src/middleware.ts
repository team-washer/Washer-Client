import RoleEncryption from '@/shared/lib/role-encryption';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!accessToken) {
    try {
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

        const accessTokenExpires = new Date(accessTokenExpiredAt);
        const refreshTokenExpires = new Date(refreshTokenExpiredAt);

        if (
          isNaN(accessTokenExpires.getTime()) ||
          isNaN(refreshTokenExpires.getTime())
        ) {
          console.warn(
            'Invalid expiration dates, continuing with existing session'
          );
          return NextResponse.next();
        }

        const nextResponse = NextResponse.next();

        nextResponse.cookies.set('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          expires: accessTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        nextResponse.cookies.set('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          expires: refreshTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        nextResponse.cookies.set('role', RoleEncryption({ role }), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          expires: accessTokenExpires,
          sameSite: 'strict',
          path: '/',
        });

        return nextResponse;
      } else if (!data.success) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        response.cookies.delete('role');

        return response;
      }
    } catch (err) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      response.cookies.delete('role');

      return response;
      console.log('Token refresh error, continuing with existing session');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|login|register|forgot-password|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
