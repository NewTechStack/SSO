// Function to encode a password using SHA-256
function encode_password_sha256(password) {
  const crypto = window.crypto || window.msCrypto;
  const encoder = new TextEncoder();
  const password_digest = crypto.subtle.digest('SHA-512', encoder.encode(password));
  return Promise.all([password_digest, password_digest.then(digest => crypto.subtle.digest('SHA-512', digest))])
    .then(([digest1, digest2]) => {
      const encoded_password = {
        "1time": btoa(String.fromCharCode.apply(null, new Uint8Array(digest1))),
        "2time": btoa(String.fromCharCode.apply(null, new Uint8Array(digest2)))};
      return encoded_password;
    });
}
