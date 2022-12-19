from cryptography.hazmat.primitives import serialization as crypto_serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend as crypto_default_backend

from barrel import Commons, Error, DB, DictObject, StrObject

import datetime
import jwt

class RSAKey(DB):
    def __init__(self):
        self.model = DictObject("system", {
            "private": StrObject("system"),
            "public": StrObject("system"),
        })
        super().__init__(id = "000")
        if not self._exist():
            self.new()
            self.create()
        self.checkout()

    def new(self):
        key = rsa.generate_private_key(
            backend=crypto_default_backend(),
            public_exponent=65537,
            key_size=2048
        )

        private_key = key.private_bytes(
            crypto_serialization.Encoding.PEM,
            crypto_serialization.PrivateFormat.PKCS8,
            crypto_serialization.NoEncryption()
        ).decode("utf-8")

        public_key = key.public_key().public_bytes(
            crypto_serialization.Encoding.OpenSSH,
            crypto_serialization.PublicFormat.OpenSSH
        ).decode("utf-8")

        self.model.change_data(['private'], private_key)
        self.model.change_data(['public'], public_key)
        self.data = self.model.formating()

    def private(self):
        return self.data['data']['private']['data']

    def public(self):
        print(f"using private key {self.data['id']}")
        return self.data['data']['public']['data']

class Token():
    def __init__(self, user):
        self.user = user

    def issue(self):
        key = RSAKey().private()
        now = datetime.datetime.utcnow()
        exp = now + datetime.timedelta(hours=2)
        issuer = "sso:back"
        audience = "sso:back"
        data = {
            'iat': now,
            'nbf': now,
            'exp': exp,
            'iss': issuer,
            'aud': audience,
            'payload': {
                'id': self.user.id
            },
        }
        token = jwt.encode(data, key, algorithm='RS256')
        return {'exp': str(exp), "usrtoken": token}

    def verify(self, token):
        key = RSAKey().public()
        if len(token) > 7 and token[0:7] == "Bearer ":
            token = token[7:]
        try:
            payload = jwt.decode(
                token,
                key,
                leeway=0,
                issuer="sso:back",
                audience="sso:back",
                algorithms=['RS256']
            )
            self.user.id = str(payload["payload"]["id"])
        except jwt.ExpiredSignatureError:
            raise Error.Forbidden('Expired Signature')
        except jwt.InvalidSignatureError:
            raise Error.Forbidden('Invalid Signature')
        except jwt.InvalidIssuedAtError:
            raise Error.Forbidden('Invalid issue time')
        except jwt.InvalidIssuerError:
            raise Error.Forbidden('Invalid Issuer')
        except jwt.InvalidAudienceError:
            raise Error.Forbidden('Invalid Audience')
        except jwt.ImmatureSignatureError:
            raise Error.Forbidden('Invalid issue time')
        except jwt.DecodeError:
            raise Error.InvalidArgument('Authorization', 'HEADER', 'Bearer <jwt>')
        return self.user
