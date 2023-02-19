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
    async login(event) {
      this.load = true;
      encoded = await encode_password_sha512(this.password);
      const self = this;
      try {
        const response = await axios.post('/api/login', {
          pseudo: this.pseudo,
          password: encoded["2time"]
        }).then(function(res) {
          var token = res.data.data.usrtoken;
          axios.get('/api/user/encrypt', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(function(res) {
            encrypt = res.data.data;
            self.store_encrypt(encrypt, encoded["1time"]);
            localStorage.setItem('usrtoken', token);
          }).catch((error) => {
            console.log(error);
          });
        });
      } catch (error) {
        this.$refs.notification.new(error.response.data.data, true);
        this.load = false;
      }
    },
    async store_encrypt(encrypt, password) {
      aes_key = await generate_aes_key(password, encrypt.salt.data);
      encrypt_trim = {
        "ecdsa": {
          "private": encrypt.ecdsa.data.private_encrypted.data,
          "public": encrypt.ecdsa.data.public.data
        },
        "rsa_contact": {
          "private": await decrypt_using_aes(encrypt.rsa_contact.data.private_encrypted.data, aes_key),
          "public": encrypt.rsa_contact.data.public.data.split(":")
        },
        "rsa_owner": {
          "private": await decrypt_using_aes(encrypt.rsa_owner.data.private_encrypted.data, aes_key),
          "public": encrypt.rsa_owner.data.public.data.split(":")
        }
      }
      encrypt_trim["rsa_contact"]["public_sign"] = encrypt_trim["rsa_contact"]["public"][1]
      encrypt_trim["rsa_contact"]["public"] = encrypt_trim["rsa_contact"]["public"][0]
      encrypt_trim["rsa_owner"]["public_sign"] = encrypt_trim["rsa_owner"]["public"][1]
      encrypt_trim["rsa_owner"]["public"] = encrypt_trim["rsa_owner"]["public"][0];
      localStorage.setItem('encrypt', JSON.stringify(encrypt_trim));
      window.location.replace("/user/")
    },
    password_switch(){
      this.password.visibility = (this.password.visibility == 'visible' ? 'invisible' : 'visible');
      this.password.type = (this.password.visibility == 'visible' ? 'text' : 'password');
    }
  }
});
