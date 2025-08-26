export function getRole() {
  const value = `; ${document.cookie}`;

  return value
    .split(";")
    .find((value) => value.includes("preRole"))
    ?.split("=")
    .at(1);
}
