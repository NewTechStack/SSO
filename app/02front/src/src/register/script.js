var app = new Vue({
  el: '#app',
  data: {
    pseudo: '',
    password: '',
    load: false,
    appDisplay: "block",
    notifs: [],
    notifs_temp: [],
    notif_global: "",
    i: 0
  },
  mounted: function() {
      this.initialize();
    },
  methods: {
    initialize(){},

    async register(event) {
      // Envoi de la requête HTTP POST à l'URL /api/login en utilisant Axios
      this.load = true;
      try {
        const response = await axios.post('/api/register', {
          pseudo: this.pseudo,
          password: this.password
        });
        console.log(response);
        this.load = false;
      } catch (error) {
        this.i += 1
        this.notifs.push([this.i, ["life-cycle-0"], error.response.data.data]);
        setTimeout(function () { this.life_cycle(index=this.i, step=1) }.bind(this), 100);
        this.load = false;
      }
      // this.load = false;
    },

    life_cycle(index, step){
      var i = 0;
      var t = void 0;
      while ( i < this.notifs.length){
        if (this.notifs[i][0] == index){
          var j = 0;
          while ( j < this.notifs.length){
            t = this.notifs[j][1].indexOf("transition-0")
            if (t > 0) {
              this.notifs[j][1].splice(t, 1);
            }
            j += 1;
          }
          if (step == 1) {
            this.notifs[i][1].push("life-cycle-1");
            setTimeout(function () { this.life_cycle(index=index, step=2) }.bind(this), 500);
          }
          else if (step == 2) {
            this.notifs[i][1].push("life-cycle-2");
            setTimeout(function () { this.life_cycle(index=index, step=3) }.bind(this), 500);
          }
          else if (step == 3) {
            this.notifs[i][1].push("life-cycle-3");
            setTimeout(function () { this.life_cycle(index=index, step=4) }.bind(this), 3000);
          }
          else if (step == 4) {
            this.notifs[i][1].splice(this.notifs[i][1].indexOf("life-cycle-3"), 1);
            setTimeout(function () { this.life_cycle(index=index, step=5) }.bind(this), 150);
          }
          else if (step == 5) {
            this.notifs[i][1].splice(this.notifs[i][1].indexOf("life-cycle-2"), 1);
            setTimeout(function () { this.life_cycle(index=index, step=6) }.bind(this), 500);
          }
          else if (step == 6) {
            this.notifs[i][1].splice(this.notifs[i][1].indexOf("life-cycle-1"), 1);
            setTimeout(function () { this.life_cycle(index=index, step=7) }.bind(this), 800);
          }
          else if (step == 7) {
            var j = 0;
            while ( j < this.notifs.length){
              this.notifs[j][1].push("transition-0");
              j += 1;
            }
            this.notifs.splice(i, 1);
          }
          break;
        }
        i++;
      }
    }
  }
});
