var app = new Vue({
  el: "#app",
  vuetify: new Vuetify(),

  data: {
    username: "",
    passwd: "",
    snackbar: false,
    text: "",
    loading: false,
    timeout: 1500,
    postData: null,
    auth: false,
    tab: null,
    verpagina: false,
    characters: false,
 
    stats: false,
    loginpage: true,
    users: false,
    usuaris: [],

  },

  methods: {


    enterpage: function () {
      this.characters = false;
      this.settings = false;
      this.stats = false;
      this.users = false;
      if (this.auth == true) {
        this.verpagina = true;
      } else if (this.auth == false) {
        this.loginpage = true;
      }


    },
    usersclick: function () {
      this.characters = false;
      this.settings = false;
      this.stats = false;
      this.loginpage = false;
      this.verpagina = false;
      this.users = true;

    },

    charactersclick: function () {
      this.characters = true;
      this.settings = false;
      this.stats = false;
      this.loginpage = false;
      this.verpagina = false;

    },
    settingsclick: function () {
      console.log("Users click", this.users);
      this.characters = false;
      this.settings = true;
      this.stats = false;
      this.loginpage = false;
      this.verpagina = false;

    },
    statsclick: function () {
      this.characters = false;
      this.settings = false;
      this.stats = true;
      this.loginpage = false;
      this.verpagina = false;

    },

    deletePost: function (nomUsuari, rol) {
      let callback = () => {

        console.log("Ha entrat a delete post");

        this.usersPost();
        this.characters = false;
        this.settings = false;
        this.stats = false;
        this.verpagina = false;
        this.users = true
        this.snackbar = true;
        this.loginpage = false;

        this.usuaris = this.postData;

        console.log("usuaris del post data dins userpost", this.postData);

        console.log("usuaris dins userpost", this.username);
        window.dataUser = this;

        this.loading = false;
      };

      console.log("Rol: ", rol);

      if (rol != "admin") {

        console.log("Ha entrat al if");
        this.doFetchPost(
          "http://localhost:3000/deletePost",
          { userid: nomUsuari },
          callback
        );
      }


    },

    updateSettings: function () {

      console.log("Ha entrat a update settings client");
      let callback = () => {
        this.zombiedialog=false;
        this.characters = true;
        this.settings = false;
        this.stats = false;
        this.loginpage = false;
        this.verpagina = false;
               
        this.loading = false;


        this.zombiedamage=this.postData.zombieDamage;
        console.log("Zomb dmg: ",this.zombiedamage);
        this.zombiehealth=this.postData.zombieMaxHealth;
        this.zombiespeed=this.postData.zombieSpeed;

        this.playerFireRate=this.postData.playerFireRate;
        this.playerhealth=this.postData.playerMaxHealth;
        this.playerspeed=this.postData.playerSpeed;

      };

      this.doFetchPost(
        "http://localhost:3000/updateSettingsPost",
        {zombieSpeed:this.zombiespeed,zombieDamage:this.zombiedamage,zombieHealth:this.zombiehealth,
          playerSpeed:this.playerspeed,playerFireRate:this.playerFireRate,playerHealth:this.playerhealth },
        callback
      );
    },

    loadSettings: function () {
      let callback = () => {
        this.characters = true;
        this.settings = false;
        this.stats = false;
        this.loginpage = false;
        this.verpagina = false;
               
        this.loading = false;


        this.zombiedamage=this.postData.zombieDamage;
        console.log("Zomb dmg: ",this.zombiedamage);
        this.zombiehealth=this.postData.zombieMaxHealth;
        this.zombiespeed=this.postData.zombieSpeed;

        this.playerFireRate=this.postData.playerFireRate;
        this.playerhealth=this.postData.playerMaxHealth;
        this.playerspeed=this.postData.playerSpeed;

      };

      this.doFetchPost(
        "http://localhost:3000/getSettingsPost",
        { },
        callback
      );
    },

    usersPost: function () {
      let callback = () => {
        this.characters = false;
        this.settings = false;
        this.stats = false;
        this.verpagina = false;
        this.users = true
        this.snackbar = true;
        this.loginpage = false;

        this.usuaris = this.postData;

        console.log("usuaris del post data dins userpost", this.postData);

        console.log("usuaris dins userpost", this.username);
        window.dataUser = this;


        this.loading = false;
      };

      this.doFetchPost(
        "http://localhost:3000/usersPost",
        { userid: this.username, passwdid: this.passwd },
        callback
      );
    },


    getAuthPost: function () {

      console.log("Ha entrat a get auth");
      let callback = () => {
        this.snackbar = true;

        console.log("Is auth dins client"+this.postData.isAuth);

        if (this.postData.isAuth) {
          
          this.text = "Autoritzat. Roles => " + this.postData.roles;
          this.auth = true;
          this.verpagina = true;
          console.log('dins get auth post auth this.aut= ', this.auth);
        } else {
          this.text = "No autoritzat";
        }
        this.loading = false;
      };

      this.doFetchPost(
        "http://localhost:3000/authPost",
        { name: this.username, password: this.passwd },
        callback
      );
    },
    getLogOutPost: function () {
      var callback = () => {
        this.snackbar = true;
        this.text = this.postData.text;
        this.loading = false;
        this.auth = false;
        this.loginpage = true;
      };
      this.doFetchPost("http://localhost:3000/logOutPost", {}, callback);
    },
    register: function () {
      var callback = () => {
        this.snackbar = true;
        this.text = this.postData.text;
        this.loading = false;
        this.auth = false;
        this.loginpage = true;
      };
      this.doFetchPost("http://localhost:3000/register", { name: this.username, password: this.passwd }, callback);
    },






    doFetchPost: function (url, data, callback) {
      this.loading = true;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        mode: "cors",
        cache: "default",
      })
        .then((response) => {
          console.log(response);
          return response.json();
        })
        .then((data) => {
          this.postData = data;
          setTimeout(callback, this.timeout);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
});
















const sideMenu = document.querySelector("aside");
const menubtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const tema = document.querySelector(".tema");

menubtn.addEventListener("click", () => {
  sideMenu.style.display = "block";
});

closeBtn.addEventListener("click", () => {
  sideMenu.style.display = "none";
});

tema.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme-variables");

  tema.querySelector('span:nth-child(1)').classList.toggle('active');
  tema.querySelector('span:nth-child(2)').classList.toggle('active');
});

