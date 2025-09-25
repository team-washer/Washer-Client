import { UserRole } from "./auth-utils";
import GetKey from "./get-key";

interface Props {
  role: UserRole;
}

export default async function RoleEncryption({ role }: Props) {
  const key = await GetKey();
  const textEncoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encodeRole = textEncoder.encode(role);
  const cipher = await crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv
    },
    key,
    encodeRole
  );

  return Buffer.from(iv).toString("base64") + "." + Buffer.from(new Uint8Array(cipher)).toString("base64");
}
