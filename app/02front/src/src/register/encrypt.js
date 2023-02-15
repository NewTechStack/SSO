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

//p = await encode_password_sha256('test')

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
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-512' },
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


// Génère une paire de clés RSA privée/publique
function generateRSAKeyPair() {
  const keyPair = window.crypto.subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  }, true, ["encrypt", "decrypt"]);
  return keyPair.then((keys) => {
    const exportPublic = window.crypto.subtle.exportKey("jwk", keys.publicKey);
    const exportPrivate = window.crypto.subtle.exportKey("jwk", keys.privateKey);
    return Promise.all([exportPublic, exportPrivate]);
  }).then((exports) => {
    return {
      publicKey: btoa(JSON.stringify(exports[0])),
      privateKey: btoa(JSON.stringify(exports[1]))
    };
  });
}

// Chiffre le message donné avec la clé publique en base64 donnée
function encryptMessage(message, publicKeyBase64) {
  const publicKey = JSON.parse(atob(publicKeyBase64));
  const messageArray = new TextEncoder().encode(message);
  return window.crypto.subtle.importKey(
    "jwk",
    publicKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  ).then((publicKey) => {
    return window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      messageArray
    );
  }).then((encryptedArray) => {
    return btoa(String.fromCharCode(...new Uint8Array(encryptedArray)));;
  });
}

// Déchiffre le message en base64 donné avec la clé privée en base64 donnée
function decryptMessage(encrypted_message, privateKeyBase64) {
  const privateKey = JSON.parse(atob(privateKeyBase64));
  const encryptedBuffer = new Uint8Array(atob(encrypted_message).split('').map(c => c.charCodeAt(0))).buffer;;
  return window.crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  ).then((privateKey) => {
    return window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedBuffer
    );
  }).then((decryptedBuffer) => {
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      return decryptedText;
  });
}

// Fonction utilitaire pour convertir un ArrayBuffer en base64 URL
function arrayBufferToBase64Url(buffer) {
  const base64 = btoa(String.fromCharCode.apply(null, buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Fonction utilitaire pour convertir une chaîne de caractères base64 URL en ArrayBuffer
function base64UrlToArrayBuffer(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const binaryString = atob(base64);
  const buffer = new ArrayBuffer(binaryString.length);
  const uint8 = new Uint8Array(buffer);
  for (let i = 0; i < binaryString.length; i++) {
    uint8[i] = binaryString.charCodeAt(i);
  }
  return buffer;
}

// d = await generateRSAKeyPair(); e = await encryptMessage("test", d.publicKey); await decryptMessage(e, d.privateKey)
