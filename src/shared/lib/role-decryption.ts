import { privateDecrypt } from "crypto";
import { UserRole } from "./auth-utils";
import GetKey from "./get-key";

interface Props {
  role: string;
}

export default async function RoleDecryption({ role }: Props) {
  const [iv, cipher] = role.split(".");
  const key = await GetKey();
  const textDecoder = new TextDecoder();

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: Uint8Array.from(Buffer.from(iv, "base64"))
    },
    key,
    Uint8Array.from(Buffer.from(cipher, "base64"))
  );
  return textDecoder.decode(decrypted) as UserRole;
}
