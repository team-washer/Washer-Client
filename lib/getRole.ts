export function getRole() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; role=`);

  return parts[1];
}
