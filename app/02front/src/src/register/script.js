var app = new Vue({
  el: '#app',
  data: {
    pseudo: '',
    load: false,
    appDisplay: "block",
    warning: {
      pseudo: {
        status: false,
        text: ''
      },
      password: {
        status: false,
        text: ''
      }
    },
    password: {
      visibility: "invisible",
      type: "password",
      value: ''
    }
  },
  mounted: function() {
    token = localStorage.getItem('usrtoken');
    if (token == void 0){
      return;
    }
    var now = Math.floor(Date.now() / 1000);
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    payload = JSON.parse(jsonPayload);
    if (payload.exp > now && payload.nbf < now){
      window.location.replace("/user/");
    }
  },
  components: { notifications },
  methods: {
    async register(event) {
      this.load = true;
      sha256_passwords = await encode_password_sha512(this.password);
      rsa_owner = await generate_rsa_key_pair();
      rsa_contact = await generate_rsa_key_pair();
      ecdsa = await generate_ecdsa_key_pair();
      salt = await generate_salt();
      aes = await generate_aes_key(sha256_passwords["1time"], salt);
      rsa_owner_public_signed = await sign_using_ecdsa(ecdsa.private_key, rsa_owner.public_key)
      rsa_contact_public_signed = await sign_using_ecdsa(ecdsa.private_key, rsa_contact.public_key)
      rsa_owner_private_encrypted = await encrypt_using_aes(rsa_owner.private_key, aes);
      rsa_contact_private_encrypted = await encrypt_using_aes(rsa_contact.private_key, aes);
      ecdsa_private_encrypted = await encrypt_using_aes(ecdsa.private_key, aes);
      try {
        const response = await axios.post('/api/register', {
          pseudo: this.pseudo,
          password: sha256_passwords["2time"],
          salt: salt,
          rsa_owner_pub: rsa_owner.public_key + ":" + rsa_owner_public_signed,
          rsa_owner_private_encrypted: rsa_owner_private_encrypted,
          rsa_contact_pub: rsa_contact.public_key + ":" + rsa_contact_public_signed,
          rsa_contact_private_encrypted: rsa_contact_private_encrypted,
          ecdsa: ecdsa.public_key,
          ecdsa_private_encrypted: ecdsa_private_encrypted
        }).then(function(res) {
          localStorage.setItem('usrtoken', res.data.data.usrtoken);
          window.location.replace("/user/");
        });
      } catch (error) {
        this.$refs.notification.new(error.response.data.data, true);
        this.load = false;
      }
    },
    password_switch(){
      this.password.visibility = (this.password.visibility == 'visible' ? 'invisible' : 'visible');
      this.password.type = (this.password.visibility == 'visible' ? 'text' : 'password');
    }
  }
});
