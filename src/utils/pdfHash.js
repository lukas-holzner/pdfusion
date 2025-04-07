export async function calculateHash(buffer) {
  if (!buffer || buffer.byteLength === 0) {
    return null;
  }
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Error calculating hash:", error);
    return null;
  }
}
