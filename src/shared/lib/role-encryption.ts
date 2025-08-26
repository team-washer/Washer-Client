import { UserRole } from "./auth-utils";
import { publicEncrypt } from "crypto";

interface Props {
  role: UserRole;
}

export default function RoleEncryption({ role }: Props) {
  return publicEncrypt(
    process.env.ROLE_PUBLIC_KEY ?? "",
    Buffer.from(role)
  ).toString("base64");
}
