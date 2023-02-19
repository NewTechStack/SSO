var app = new Vue({
  el: '#app',
  data: {
    user_data: void 0,
    encrypt: void 0,
    create_wallet: {
      address: "0x0000000000000000000000000000000000000000",
      mnemonic: [],
      private_key: "",
      step: 0,
      mnemonic_text: "Click the words in the correct order",
      mnemonic_shuffle: [],
      try: 0,
      mnemonic_try: []
    },
    load: true,
    test: "not ok",
    appDisplay: "block",
  },
  mounted: function() {
    this.load_user();
  },
  components: { notifications },
  filters: {
    clear(value){
      setTimeout( async function () {
          const propNames = value.split('.');
          const parent = propNames.slice(0, -1).reduce((acc, prop) => acc[prop], this.app);
          const propName = propNames[propNames.length - 1];
          if (parent[propName][parent[propName].length - 1] != '\0') {
            parent[propName] = await decrypt_using_rsa(parent[propName], this.app.encrypt.rsa_owner.private) + '\0';
          }
      }.bind(this, value), 0);
      return value;
    },
    clear_check(value){
      if (value[value.length - 1] != '\0') {
        return
      }
      return value.slice(0, -1);
    },
    address_filter(value){
      if (value == void 0) {
        return
      }
      return value.slice(0, 5) + "..." + value.slice(-4)
    }
  },
  methods: {
    generate_wallet(){
      this.create_wallet.step = 0
      this.create_wallet.address = "0x0000000000000000000000000000000000000000"
      const wallet = ethers.Wallet.createRandom()
      this.create_wallet.mnemonic = wallet.mnemonic.phrase.split(" ")
      this.create_wallet.mnemonic_shuffle = wallet.mnemonic.phrase.split(" ");
      let similarities = true;
      while (similarities == true){
        this.create_wallet.mnemonic_shuffle.sort((a, b) => 0.5 - Math.random());
        similarities = !this.create_wallet.mnemonic.every((element, index) => element != this.create_wallet.mnemonic_shuffle[index]);
      }
      this.create_wallet.private_key = wallet.privateKey;
      this.create_wallet.address = wallet.address;
      this.create_wallet.step = 1;
    },
    mnemonic_add_word(word) {
      if (this.create_wallet.mnemonic_try.includes(word)){
        return;
      }
      this.create_wallet.mnemonic_try.push(word);
      let length = this.create_wallet.mnemonic_try.length;
      let ok = true;
      for (let i = 0; i < length; i++) {
        if (this.create_wallet.mnemonic_try[i] != this.create_wallet.mnemonic[i]){
          ok = false;
          break;
        }
      }
      if (!ok) {
        this.create_wallet.mnemonic_try = [];
        this.create_wallet.mnemonic_text = "Wrong order start again"
        return;
      }
      this.create_wallet.mnemonic_text = "Click the words in the correct order"
      if (length == this.create_wallet.mnemonic.length){
        this.store_wallet()
      }
    },
    async store_wallet(){
      this.create_wallet.step = 5;
      const self = this;
      let address = await encrypt_using_rsa(this.create_wallet.address, this.encrypt.rsa_owner.public)
      let private_key = await encrypt_using_rsa(this.create_wallet.private_key, this.encrypt.rsa_owner.public)
      token = this.get_token()
      try {
        const response = await axios.put('/api/user/crypto', {
            address: address,
            private_key: private_key
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        ).then(function(res) {
            self.load_user()
          }
        );
      } catch (error) {
        this.$refs.notification.new(error.response.data.data, true);
        this.load = false;
      }
      return 0
    },
    get_token(){
      token = localStorage.getItem('usrtoken');
      if (token == void 0){
        window.location.replace("/login/");
      }
      var now = Math.floor(Date.now() / 1000);
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      payload = JSON.parse(jsonPayload);
      if (payload.exp < now || payload.nbf > now){
        window.location.replace("/login/");
      }
      return token
    },
    load_user(){
      var self = this;
      this.encrypt = JSON.parse(localStorage.getItem('encrypt'))
      token = this.get_token()
      axios.get('/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(function(res) {
        self.user_data = res.data.data;
        self.load = false;
        if (res.data.data.data.crypto.data.address.data == "None") {
          setTimeout( function ()  {
            this.app.generate_wallet();
          }.bind(this), 0);
        }
      }).catch((error) => {
        self.disconnect();
      });
    },
    disconnect(){
      token = localStorage.removeItem('usrtoken');
      window.location.replace("/login/");
    },
    copy_to_clipboard(text_to_copy) {
      var temp_textarea = document.createElement("textarea");
      temp_textarea.value = text_to_copy;
      document.body.appendChild(temp_textarea);
      temp_textarea.select();
      document.execCommand("copy");
      document.body.removeChild(temp_textarea);
    },
    message(name_1, status_1, name_2 = void 0, status_2 = void 0){
      if (name_2 == undefined) {
        return {
          "public": "Everyone can see your " + name_1,
          "protected": "Your contacts can see your " + name_1,
          "private": "You are the only one to see your " + name_1
        }[status_1]
      } else {
        return {
          "publicpublic": "Everyone can see your " + name_1 + " and your " + name_2,
          "publicprotected": "Everyone can see your " + name_1 + ", your contacts can see your" + name_2,
          "publicprivate": "Everyone can see your " + name_1 + ", you are the only one to see your" + name_2,
          "protectedpublic": "Everyone can see your " + name_2 + ", your contacts can see your" + name_1,
          "protectedprotected": "Your contacts can see your " + name_1 + " and your " + name_2,
          "protectedprivate": "Your contacts can see your " + name_1 + ", you are the only one to see your" + name_2,
          "privatepublic": "Everyone can see your " + name_2 + ", you are the only one to see your" + name_1,
          "privateprotected": "Your contacts can see your " + name_2 + ", you are the only one to see your" + name_1,
          "privateprivate": "You are the only one to see your " + name_1 + " and your " + name_2,
        }[status_1 + status_2]
      }
      return void 0;
    }
  }
});
