let notification = {
  data() {
    return {
      classList: [
        "notification-0"
      ]
    }
  },
  mounted() {
    this.classList.push((this.warning == true) ? "alert" : "info");
    this.lifeCycle(0)
  },
  props: {text: {}, warning: {default: false}},
  methods: {
    lifeCycle: function(lifespan) {
      time = [false, 200, 300, 500, 300000, 100, 300, 200]
      indexClass = this.classList.indexOf("notification-" + lifespan);
      lifespan += 1;
      if (indexClass != -1){
        this.classList.splice(indexClass, 1);
      }
      if (lifespan > 8) {
        this.$emit('end', this.$vnode.key);
        return
      }
      this.classList.push("notification-" + lifespan);
      setTimeout(function () { this.lifeCycle(lifespan) }.bind(this), time[lifespan]);

    }
  },
  template: `
    <div :class="classList" >
      <div>
        {{ text }}
      </div>
    </div>
  `

}


let notifications = {
  data() {
    return {
      arr: []
    }
  },
  components: { notification },
  template: `
      <div id="notifications">
        <notification
          v-for="notification in arr"
          :text="notification.text"
          :warning="notification.warning"
          :key="notification.id"
          class="notification"
          @end="end">
        </notification>
      </div>
  `,
  methods: {
    new(title, warning = false){
      id = Math.floor(Math.random() * 100000);
      this.arr.push({
        "text": title,
        "warning": warning,
        "id": id
      });
    },
    end: function(id){
      var i = 0;
      while ( i < this.arr.length ) {
        if (this.arr[i].id == id){
          this.arr.splice(i, 1);
        }
        i += 1;
      }
    }
  }
}
