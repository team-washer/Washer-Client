import { privateDecrypt } from "crypto";
import { UserRole } from "./auth-utils";
import { getRole } from "./getRole";

export default async function RoleDecryption(encryptedRole: string) {
  return privateDecrypt(
    process.env.ROLE_PRIVATE_KEY ?? "",
    Buffer.from(encryptedRole, "base64")
  ).toString() as UserRole;
}
