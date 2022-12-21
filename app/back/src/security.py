import datetime
import jwt

# Import necessary modules from the cryptography library
from cryptography.hazmat.primitives import serialization as crypto_serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend as crypto_default_backend

# Import necessary modules from the barrel library
from barrel import Commons, Error, DB, DictObject, StrObject

class RSAKey(DB):
    """
    Class to generate and store RSA keys.
    """

    def __init__(self):
        # Define the model for storing the keys
        self.model = DictObject("system", {
            "private": StrObject("system"),
            "public": StrObject("system"),
        })
        super().__init__(id="000")
        # If the keys do not already exist in the database, generate and store new keys
        if not self._exist():
            self.new()
            self.create()
        self.checkout()

    def new(self):
        """
        Generate and store new RSA keys.
        """
        # Generate a new RSA key
        key = rsa.generate_private_key(
            backend=crypto_default_backend(),
            public_exponent=65537,
            key_size=2048
        )
        # Convert the private key to a PEM-formatted string
        private_key = key.private_bytes(
            crypto_serialization.Encoding.PEM,
            crypto_serialization.PrivateFormat.PKCS8,
            crypto_serialization.NoEncryption()
        ).decode("utf-8")
        # Convert the public key to an OpenSSH-formatted string
        public_key = key.public_key().public_bytes(
            crypto_serialization.Encoding.OpenSSH,
            crypto_serialization.PublicFormat.OpenSSH
        ).decode("utf-8")
        # Store the keys in the database
        self.model.change_data(['private'], private_key)
        self.model.change_data(['public'], public_key)
        self.data = self.model.formating()

    def private(self):
        """
        Return the private key.
        """
        return self.data['data']['private']['data']

    def public(self):
        """
        Return the public key.
        """
        return self.data['data']['public']['data']

class Token:
    """
    Class to issue and verify JSON web tokens (JWTs).
    """

    def __init__(self, user):
        self.user = user

    def issue(self):
        """
        Issue a new JWT for the user.
        """
        # Set the current time and the expiration time for the JWT
        now = datetime.datetime.utcnow()
        exp = now + datetime.timedelta(hours=2)
        # Set the issuer and audience for the JWT
        issuer = "sso:back"
        audience = "sso:back"
        # Set the data to be included in the JWT
        data = {
            'iat': now,  # Issued At
            'nbf': now,  # Not Before
            'exp': exp,  # Expiration
            'iss': issuer,  # Issuer
            'aud': audience,  # Audience
            'payload': {
                'id': self.user.id
            },
        }
        # Encode the data into a JWT using the RSA256 algorithm and the private key
        token = self._encode_jwt(data)
        return {'exp': str(exp), "usrtoken": token}

    def verify(self, token):
        """
        Verify the given JWT.
        """
        # If the token is prefixed with "Bearer ", remove the prefix
        token = self._remove_bearer_prefix(token)
        # Decode the JWT and set the user's ID to the ID in the payload
        self._decode_and_set_id(token)

    def _encode_jwt(self, data):
        """
        Encode the given data into a JWT using the RSA256 algorithm and the private key.
        """
        return jwt.encode(data, RSAKey().private(), algorithm='RS256')

    def _remove_bearer_prefix(self, token):
        """
        If the token is prefixed with "Bearer ", remove the prefix.
        """
        if len(token) > 7 and token[0:7] == "Bearer ":
            return token[7:]
        return token

    def _decode_and_set_id(self, token):
        """
        Decode the given JWT using the public key and set the user's ID to the ID in the payload.
        """
        try:
            # Decode the JWT using the public key
            payload = jwt.decode(
                token,
                RSAKey().public(),
                leeway=0,
                issuer="sso:back",
                audience="sso:back",
                algorithms=['RS256']
            )
            # Set the user's ID to the ID in the payload of the JWT
            self.user.id = str(payload["payload"]["id"])
        except jwt.ExpiredSignature
