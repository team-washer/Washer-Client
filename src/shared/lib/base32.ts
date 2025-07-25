// Base32 인코딩/디코딩 함수
export const base32Encode = (str: string): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < str.length; i++) {
    value = (value << 8) | str.charCodeAt(i)
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  return output
}

export const base32Decode = (str: string): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < str?.length; i++) {
    const char = str[i].toUpperCase()
    const index = alphabet.indexOf(char)
    if (index === -1) continue

    value = (value << 5) | index
    bits += 5

    while (bits >= 8) {
      output += String.fromCharCode((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return output
}