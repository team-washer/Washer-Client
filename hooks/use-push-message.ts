import React from 'react';

interface Props {
  token: string;
}

async function UsePushMessage({ token }: Props) {
  const accessToken = localStorage.getItem('authToken');

  try {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token, platform: 'WEB' }),
    })
      .then((res) => console.log(res.json))
      .catch((err) => console.log(err));
  } catch (err) {
    console.log(err);
  }
}

export default UsePushMessage;
