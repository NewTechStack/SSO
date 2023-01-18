import os
import base64
from hashlib import scrypt
from eth_keys import keys
from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from bottle import Bottle, request, response

app = Bottle()

@app.post("/generate_key")
def generate_key():
    # Get user ID and password from the request
    user_id = request.json.get("user_id")
    password = request.json.get("password")

    # Generate random salt
    salt = os.urandom(16)

    # Combine user ID and password
    user_input = user_id + password

    # Generate private key from user ID, password, and salt
    kdf = Scrypt(salt=salt, length=32, n=2**14, r=8, p=1, backend=default_backend())
    private_key = kdf.derive(password)

    # Generate public key and Ethereum address
    private_key_bytes = private_key
    key = keys.PrivateKey(private_key_bytes)
    public_key = key.public_key.to_hex()
    address = key.public_key.to_address()

    # Encryption key
    password_encryption = os.urandom(16)
    kdf = Scrypt(salt=password_encryption, length=32, n=2**14, r=8, p=1, backend=default_backend())
    key_encryption = kdf.derive(password_encryption)
    cipher_suite = Fernet(key_encryption)

    # Encrypt the private key
    cipher_text = cipher_suite.encrypt(private_key)

    # Create the response
    res = {
        'private_key': cipher_text.decode(),
        'encryption_password': password_encryption.hex(),
        'salt': salt.hex(),
        'public_key': public_key,
        'address': address
    }

    response.content_type = 'application/json'
    return json.dumps(res)

@app.post("/get_key")
def get_key():
    # Get user ID, password, salt, and encryption password from the request
    user_id = request.json.get("user_id")
    password = request.json.get("password")
    salt = bytes.fromhex(request.json.get("salt"))
    encryption_password = bytes.fromhex(request.json.get("encryption_password"))

    # Combine user ID and password
    user_input = user_id + password

    # Derive the private key from user ID, password and salt
    kdf = Scrypt(salt=salt, length=32, n=2**14, r=8, p=1, backend=default_backend())
    private_key = kdf.derive(password)

    # Generate public key and Ethereum address
    private_key_bytes = private_key
    key = keys.PrivateKey(private_key_bytes)
    public_key = key.public_key.to_hex()
    address = key.public_key.to_address()

    # Decrypt the private key
    cipher_suite = Fernet(encryption_password)
    private_key = cipher_suite.decrypt(cipher_text)

    # Create the response
    res = {
        'private_key': private_key.decode(),
        'salt': salt.hex(),
        'public_key': public_key,
        'address': address
    }

    response.content_type = 'application/json'
    return json.dumps(res)

app.run(host='0.0.0.0', port=8000)
