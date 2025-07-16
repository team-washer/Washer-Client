import { UserRole } from './auth-utils';
import { base32Decode } from './base32';
import { getRole } from './getRole';

export function RoleDecryption() {
  try {
    let role = getRole();
    
    role = base32Decode(role);

    for (let i = 0; i < 5; i++) {
      role = atob(role);
    }

    role = base32Decode(role);

    for (let i = 0; i < 5; i++) {
      role = atob(role);
    }

    return role as UserRole;
  } catch (error) {
    console.error('❌ Failed to decode role:', error);
    return null;
  }
}
