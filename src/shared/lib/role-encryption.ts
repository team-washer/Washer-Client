import React from 'react';
import { UserRole } from './auth-utils';
import { base32Encode } from './base32';

interface Props {
  role: UserRole;
}

export function RoleEncryption({ role }: Props) {
  let encodedRole = role as string;

  // base64 5회
  for (let i = 0; i < 5; i++) {
    encodedRole = btoa(encodedRole);
  }

  // base32 1회
  encodedRole = base32Encode(encodedRole);

  // base64 5회
  for (let i = 0; i < 5; i++) {
    encodedRole = btoa(encodedRole);
  }

  // base32 1회
  encodedRole = base32Encode(encodedRole);

  return encodedRole;
}

export default RoleEncryption;
