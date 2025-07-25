import axios from 'axios';
import React from 'react';

interface Props {
  token: string;
}

async function UsePushMessage({ token }: Props) {
  try {
    axios.post('/api/push-message', { token, platform: 'web' });
  } catch (err) {
    console.log(err);
  }
}

export default UsePushMessage;
