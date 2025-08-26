import { privateDecrypt } from "crypto";
import { UserRole } from "./auth-utils";

interface Props {
  role: string;
}

export default async function RoleDecryption({ role }: Props) {
  return privateDecrypt(
    process.env.ROLE_PRIVATE_KEY ?? "",
    Buffer.from(role, "base64")
  ).toString() as UserRole;
}
