import axios from 'axios';

interface Props {
  token: string;
}

async function usePushMessage({ token }: Props) {
  try {
    await axios.post('/api/fcm-token', { token, platform: 'WEB' });
  } catch (err) {
    console.log(err);
  }
}

export default usePushMessage;
