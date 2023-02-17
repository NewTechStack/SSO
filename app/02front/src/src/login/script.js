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
      try {
        const response = await axios.post('/api/login', {
          pseudo: this.pseudo,
          password: encoded["2time"]
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
