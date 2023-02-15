var app = new Vue({
  el: '#app',
  data: {
    user_data: void 0,
    load: true,
    appDisplay: "block",
  },
  mounted: function() {
    var self = this;
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
        self.load = false;
      });
    } catch (error) {
      this.$refs.notification.new(error.response.data.data, true);
    }
  },
  components: { notifications },
  methods: {
    message(name_1, status_1, name_2 = void 0, status_2 = void 0){
      if (name_2 == undefined) {
        return {
          "public": "Everyone can see your " + name_1,
          "protected": "Your contacts can see your" + name_1,
          "private": "You are the only one to see your" + name_1
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
