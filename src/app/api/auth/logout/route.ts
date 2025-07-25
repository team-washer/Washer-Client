import { apiClient } from '@/shared/lib/api-request';
import axios from 'axios';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;

  try {
    await apiClient.post('/auth/logout', {
      headers: {
        'Content-Type': 'application/json',
        'Refresh-Token': `Bearer ${refreshToken}`,
      },
    });
    await axios.post('/api/auth/logout/delete-cookie', {});
    
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
