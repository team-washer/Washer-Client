export default async function GetKey() {
  const textEncoder = new TextEncoder();

  const raw = textEncoder.encode(process.env.ROLE_KEY!);

  const hashed = await crypto.subtle.digest('SHA-256', raw);

  return crypto.subtle.importKey(
    'raw',
    hashed,
    {
      name: 'AES-CBC',
    },
    false,
    ['encrypt', 'decrypt']
  );
}
