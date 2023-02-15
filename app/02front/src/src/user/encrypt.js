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

function generate_salt() {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(crypto.getRandomValues(new Uint8Array(16)))))
}

// Fonction pour générer une clé AES à partir d'un mot de passe
function genererCleAES(motDePasse, salt) {
  const crypto = window.crypto || window.msCrypto;
  salt = Uint8Array.from(atob(salt), c => c.charCodeAt(0))
  const cle = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(motDePasse),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  ).then(key => {
    return crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      key,
      256
    );
  }).then(bits => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(bits)));
  });
  return cle;
}

// Fonction pour encrypter un message à l'aide d'une clé AES
function encrypterAvecAES(message, cle) {
  const crypto = window.crypto || window.msCrypto;
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const clePromise = crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(cle), c => c.charCodeAt(0)),
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt']
  );
  const encryptedPromise = clePromise.then(key => {
    return crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      encoder.encode(message)
    );
  });
  return Promise.all([encryptedPromise, clePromise]).then(([encrypted, cle]) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(iv))) + ':' + btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted)));
  });
}

// Fonction pour déchiffrer un message à l'aide d'une clé AES
function decrypterAvecAES(messageChiffre, cle) {
  const crypto = window.crypto || window.msCrypto;
  const messageChiffreTab = messageChiffre.split(':');
  const iv = Uint8Array.from(atob(messageChiffreTab[0]), c => c.charCodeAt(0));
  const encryptedText = Uint8Array.from(atob(messageChiffreTab[1]), c => c.charCodeAt(0));
  const decoder = new TextDecoder();
  const clePromise = crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(cle), c => c.charCodeAt(0)),
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt']
  );
  const decryptedPromise = clePromise.then(key => {
    return crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      encryptedText
    );
  });
  return Promise.all([decryptedPromise, clePromise]).then(([decrypted, cle]) => {
    return decoder.decode(decrypted);
  });
}
