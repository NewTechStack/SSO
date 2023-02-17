/**
 * Encodes a password using SHA-512 hashing.
 *
 * @param {string} password - The password to be encoded.
 *
 * @returns {Promise<Object>} A promise that resolves to an object containing
 *   the encoded password, using SHA-512 hashing twice, in base64 format:
 *   { "1time": <base64 string>, "2time": <base64 string> }.
 *
 * @example
 * // Example usage:
 * var passwords = await encode_password_sha512('test');
 * console.log(passwords);
 *
 * @example
 * // Test cases:
 * console.assert(JSON.stringify(await encode_password_sha512('test')) == '{"1time":"7iaw3Ur350mqGo7jwQrpkj9hiYB3Lkc/iBml1JQODbJ6wYX4oOHV+E+IvIh/1nsUNzLDBMxfqa2Ob1f1ACio/w==","2time":"+q3K9gr9Nd/NtenqDQoFMfYzjGIYfP83oe/hHx1Bo0h5cxvJ20nfda7PXVgq0Jtcbe0thr0fB8Eb11XR/MyB/g=="}');
 */
function encode_password_sha512(password) {
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

/**
 * Generates a random 16-byte salt and returns it as a base64-encoded string.
 *
 * @returns {string} The randomly generated salt in base64 format.
 */
function generate_salt() {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(crypto.getRandomValues(new Uint8Array(16)))))
}

/*
  //test
  var salt = generate_salt();
  console.log(salt);
*/

/**
 * Generates an AES key from a password and salt using the PBKDF2 key derivation
 * function with 100,000 iterations and the SHA-512 hashing algorithm, and
 * returns the key in base64 format.
 *
 * @param {string} password - The password to use for key generation.
 * @param {string} salt - The salt to use for key generation, in base64 format.
 *
 * @returns {Promise<string>} A promise that resolves to the generated AES key in base64 format.
 */
function generate_aes_key(password, salt) {
  const crypto = window.crypto || window.msCrypto;
  salt = Uint8Array.from(atob(salt), c => c.charCodeAt(0))
  const key = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
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
  return key;
}

/*
  //test
  var password = await encode_password_sha512('test');
  var salt = generate_salt();
  var aes_key = await generate_aes_key(password["1time"], salt);
  console.log(aes_key);
*/

/**
 * Encrypts a message using an AES key in CBC mode with a random initialization vector (IV),
 * and returns the encrypted message and IV in base64 format, separated by a colon (":").
 *
 * @param {string} message - The message to encrypt.
 * @param {string} key - The AES key to use for encryption, in base64 format.
 *
 * @returns {Promise<string>} A promise that resolves to the encrypted message and IV in base64 format, separated by a colon.
 */
function encrypt_using_aes(message, key) {
  const crypto = window.crypto || window.msCrypto;
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const key_promise = crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(key), c => c.charCodeAt(0)),
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt']
  );
  const encrypted_promise = key_promise.then(key => {
    return crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      encoder.encode(message)
    );
  });
  return Promise.all([encrypted_promise, key_promise]).then(([encrypted, key]) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(iv))) + ':' + btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted)));
  });
}

/*
  //test
  var password = await encode_password_sha512('test');
  var salt = generate_salt();
  var aes_key = await generate_aes_key(password["1time"], salt);
  var message = "test";
  var encrypted_message = await encrypt_using_aes(message, aes_key);
  console.log(encrypted_message);
*/


/**
 * Decrypts a message using an AES key and returns the original message.
 *
 * @param {string} encrypted_message - The encrypted message in format "iv:encrypted_text".
 * @param {string} key - The AES key in base64 format.
 *
 * @returns {Promise<string>} A promise that resolves with the original message.
 */
function decrypt_using_aes(encrypted_message, key) {
  const crypto = window.crypto || window.msCrypto;
  const encrypted_message_tab = encrypted_message.split(':');
  const iv = Uint8Array.from(atob(encrypted_message_tab[0]), c => c.charCodeAt(0));
  const encrypted_text = Uint8Array.from(atob(encrypted_message_tab[1]), c => c.charCodeAt(0));
  const decoder = new TextDecoder();
  const key_promise = crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(key), c => c.charCodeAt(0)),
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt']
  );
  const decrypted_promise = key_promise.then(key => {
    return crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      encrypted_text
    );
  });
  return Promise.all([decrypted_promise, key_promise]).then(([decrypted, key]) => {
    return decoder.decode(decrypted);
  });
}

/*
  //test
  var password = await encode_password_sha512('test');
  var salt = generate_salt();
  var aes_key = await generate_aes_key(password["1time"], salt);
  var message = "test";
  var encrypted_message = await encrypt_using_aes(message, aes_key);
  var decrypted_message = await decrypt_using_aes(encrypted_message, aes_key);
  console.log("clear == decrypted:", message == decrypted_message);
*/

/**
 * Generates a private/public RSA key pair.
 *
 * @param {number} modulus_length - The desired length of the RSA modulus, in bits.
 *
 * @returns {Promise<{public_key: string, private_key: string}>} A promise that resolves with an object containing the base64-encoded public and private keys.
 */
function generate_rsa_key_pair(modulus_length= 2048) {
  const key_pair = window.crypto.subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: modulus_length,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  }, true, ["encrypt", "decrypt"]);
  return key_pair.then((keys) => {
    const export_public = window.crypto.subtle.exportKey("jwk", keys.publicKey);
    const export_private = window.crypto.subtle.exportKey("jwk", keys.privateKey);
    return Promise.all([export_public, export_private]);
  }).then((exports) => {
    return {
      public_key: btoa(JSON.stringify(exports[0])),
      private_key: btoa(JSON.stringify(exports[1]))
    };
  });
}

/*
  //test
  var rsa_keys = await generate_rsa_key_pair();
*/

/**
 * Encrypts the given message with the given base64 public key.
 *
 * @param {string} message - The message to encrypt.
 * @param {string} public_key_b64 - The base64-encoded public key in JWK format.
 *
 * @returns {Promise<string>} A promise that resolves with the encrypted message in base64 format.
 */
function encrypt_using_rsa(message, public_key_b64) {
  const public_key = JSON.parse(atob(public_key_b64));
  const message_array = new TextEncoder().encode(message);
  return window.crypto.subtle.importKey(
    "jwk",
    public_key,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  ).then((public_key) => {
    return window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      public_key,
      message_array
    );
  }).then((encrypted_array) => {
    return btoa(String.fromCharCode(...new Uint8Array(encrypted_array)));;
  });
}

/*
  //test
  var rsa_keys = await generate_rsa_key_pair();
  var message = "test";
  var encrypted_message = await encrypt_using_rsa(message, rsa_keys.public_key);
  console.log(encrypted_message);
*/

/**
 * Decrypts the given base64 message with the given base64 private key and returns the original message.
 *
 * @param {string} encrypted_message - The base64-encoded encrypted message.
 * @param {string} private_key_b64 - The base64-encoded RSA private key.
 *
 * @returns {Promise<string>} A promise that resolves with the original message.
 */
function decrypt_using_rsa(encrypted_message, private_key_b64) {
  const private_key = JSON.parse(atob(private_key_b64));
  const encrypted_buffer = new Uint8Array(atob(encrypted_message).split('').map(c => c.charCodeAt(0))).buffer;;
  return window.crypto.subtle.importKey(
    "jwk",
    private_key,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  ).then((private_key) => {
    return window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      private_key,
      encrypted_buffer
    );
  }).then((decrypted_buffer) => {
      const decrypted_text = new TextDecoder().decode(decrypted_buffer);
      return decrypted_text;
  });
}

/*
  //test
  var rsa_keys = await generate_rsa_key_pair();
  var message = "test";
  var encrypted_message = await encrypt_using_rsa(message, rsa_keys.public_key);
  var decrypted_message = await decrypt_using_rsa(encrypted_message, rsa_keys.private_key)
  console.log("clear == decrypted:", message == decrypted_message);
*/


/**
 * Generates an ECDSA key pair and returns them in base64 format.
 *
 * @returns {Object} An object containing the public and private key in base64 format.
 */
async function generate_ecdsa_key_pair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-384",
    },
    true,
    ["sign", "verify"]
  );
  const publicKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey
  );
  const privateKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey
  );
  return {
    public_key: btoa(JSON.stringify(publicKey)),
    private_key: btoa(JSON.stringify(privateKey)),
  };
}

/**
 * Signs a message with an ECDSA private key and returns the message in base64 format.
 *
 * @param {string} private_key_base64 - The private key in base64 format.
 * @param {string} message - The message to sign.
 *
 * @returns {string} The signed message in base64 format.
*/
async function sign_using_ecdsa(private_key_b64, message) {
  const private_key = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(atob(private_key_b64)),
    {
      name: "ECDSA",
      namedCurve: "P-384",
    },
    true,
    ["sign"]
  );
  const signature = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    private_key,
    new TextEncoder().encode(message)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verifies a message with an ECDSA public key and returns whether or not the message is valid.
 *
 * @param {string} public_key_base64 - The public key in base64 format.
 * @param {string} message - The message to verify.
 * @param {string} signature_base64 - The signature in base64 format.
 *
 * @returns {boolean} Whether or not the message is valid.
 */
async function verify_using_ecdsa(public_key_b64, message, signature_b64) {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(atob(public_key_b64)),
    {
      name: "ECDSA",
      namedCurve: "P-384",
    },
    true,
    ["verify"]
  );
  const isValid = await window.crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    publicKey,
    new Uint8Array(atob(signature_b64).split("").map((c) => c.charCodeAt(0))),
    new TextEncoder().encode(message)
  );
  return isValid;
}


async function tests(){
  const message = "test";
  var password = await encode_password_sha512('test');
  console.log("SHA-512", message == decrypted_message);
  var salt = generate_salt();
  var aes_key = await generate_aes_key(password["1time"], salt);
  var encrypted_message = await encrypt_using_aes(message, aes_key);
  var decrypted_message = await decrypt_using_aes(encrypted_message, aes_key);
  console.log("AES", message == decrypted_message);
  var rsa_keys = await generate_rsa_key_pair();
  var encrypted_message = await encrypt_using_rsa(message, rsa_keys.public_key);
  var decrypted_message = await decrypt_using_rsa(encrypted_message, rsa_keys.private_key)
  console.log("RSA", message == decrypted_message);
  const ecdsa_keys = await generate_ecdsa_key_pair();
  const signature = await sign_using_ecdsa(ecdsa_keys.private_key, message);
  const isVerified = await verify_using_ecdsa(ecdsa_keys.public_key, message, signature);
  console.log("ECDSA", isVerified);
}
