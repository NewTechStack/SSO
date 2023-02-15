var app = new Vue({
  el: '#app',
  data: {
    user_data: {},
    load: false,
    appDisplay: "block",
  },
  mounted: function() {
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
    try {
      const response = axios.get('/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(function(res) {
        self.user_data = res.data.data;
        console.log(self.user_data)
      });
    } catch (error) {
      this.$refs.notification.new(error.response.data.data, true);
    }
  },
  components: { notifications },
  methods: {}
});
