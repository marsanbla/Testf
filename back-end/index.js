const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const app = express();
const http = require("http");
const { Socket } = require("dgram");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const playersCollection = require("../models/playerSchema");
const adminUsers = require("../database/adMongoDBplayers");
const connexio = require("../database/adPoolMongoDB");
const adminZombies = require("../database/mongoDBzombie");
const adminSettings = require("../database/adMongoDBSettings");

const PORT = 3000;
app.use(bodyParser.json());
var users = [];

let nomUsuari = "";

app.use(
  session({
    secret: "2002",
    resave: true,
    saveUninitialized: true,
    user: { isAuth: false, roles: [] },
    users: [],
  })
);

async function getSalt(saltRounds) {
  let salt = await bcrypt.genSalt(saltRounds);
  return salt;
}

//passwd Hash
async function hashPassword(passwd, salt) {
  let hash = await bcrypt.hash(passwd, salt);
  return hash;
}

//Middleware necessari per parsejar el body i colocar-ho dintre del req.body.
app.use(express.json());

//Configuració del mòdul de cors.
//Per cada petició es crida aquest middleware (app.use)
//rep dos parametres el mòdul cors. El primer és l'origen, i el segon és una funció
//de callback que ens permet controlar si acceptem la petició o no.
app.use(
  cors({
    origin: function (origin, callback) {
      console.log(origin);
      return callback(null, true);
    },
  })
);

app.post("/register", async (req, res) => {
  console.log("Ha entrat a register");

  connexio.iniciar();

  let nom = req.body.name;

  let passwd = req.body.password;
  const saltRounds = 10;
  let salt;

  let player = {
    name: nom,
    email: "",
    pwd: "",
    salt: "",
    rol: "user",
    /*Player Stats*/
    investedMinutes: 0,
    mSesions: 0,
    zKilled: 0,
    deads: 0,
  };

  let existingPlayer = await adminUsers.findPlayerAsync(nom);

  console.log("existingPlayer: ", existingPlayer);

  if (existingPlayer) {
    res.status(400).send({ success: false, message: "Email already in use" });
  } else {
    console.log("Ha entrat al else");

    try {
      salt = await getSalt(saltRounds);
      encryptedPass = await hashPassword(passwd, salt);
    } catch (error) {
      console.log(error);
    }

    player.salt = salt;
    player.pwd = encryptedPass;

    adminUsers.newPlayerAsync(player);
    console.log("usuari guardat");

    res.status(200).send({ success: true });
  }
});

//Ruta a /auth amb dos parametres que s'envien per "param"
app.post("/authPost", async (req, res) => {
  connexio.iniciar();

  let name = req.body.name;
  let passwd = req.body.password;

  ret = await checkUserFromJson(name, passwd);

  console.log("Ret dins authpost", ret.isAuth);

  if (ret.isAuth) {
    res.status(200).send(JSON.stringify(ret));
    nomUsuari = ret.name;
  } else {
    res.status(400).send(JSON.stringify(ret));
  }

  session.user = ret;
});

//Ruta a /logOutPost amb dos parametres que s'envien per "param"
app.get("/getGameVariables", async (req, res) => {
  let zombieSpeed = 1;
  let playerSpeed = 1;

  res.send(JSON.stringify(zombieSpeed));
});

//comprimir assets
app.get("/packAssets", async (req, res) => {
  var archiver = require("archiver");
  var archive = archiver.create("zip", {});
  var output = fs.createWriteStream(__dirname + "/assets.zip");
  archive.pipe(output);

  archive.directory(__dirname + "/assets").finalize();

  archive
    .bulk([
      {
        expand: true,
        cwd: "./assets/",
        src: ["**/*"],
      },
    ])
    .finalize();
});

//Ruta a /logOutPost amb dos parametres que s'envien per "param"
app.post("/logOutPost", async (req, res) => {
  var ret = {
    text: "No hi ha cap sessió que eliminar",
  };
  if (session.user && session.user.isAuth) {
    session.user = { isAuth: false, roles: [] };
    var ret = {
      text: "sessió eliminada correctament",
    };
  }

  console.log(ret);
  res.send(JSON.stringify(ret));
});

app.listen(PORT, () => {
  console.log("Server Running [" + PORT + "]");
});

async function checkUserFromJson(name, passwd) {
  let query = "";
  let nom = "";

  let contrasenyaBase = "";
  let contrasenyaAComprovar = "";
  let ret = {
    isAuth: false,
    roles: [],
    name: "",
  };

  console.log("Nom passat: " + name);

  var prom = await new Promise(async (resolve, reject) => {
    //llegim l'array de clients

    try {
      query = await adminUsers.findPlayerAsync(name);

      console.log("Query: ", query);
    } catch (err) {
      console.log(err);
    }

    if (query != null) {
      try {
        contrasenyaAComprovar = await hashPassword(passwd, query.salt);
      } catch (err) {
        console.log(err);
      }

      ret.name = query.name;
      contrasenyaBase = query.pwd;
      ret.roles = ["user"];

      if (
        name == query.name &&
        contrasenyaAComprovar == contrasenyaBase &&
        contrasenyaAComprovar != "" &&
        name != ""
      ) {
        ret.isAuth = true;
      }
    }

    console.log("Ret: " + ret.isAuth);

    resolve(ret);
  });

  console.log("promesa: " + prom);

  return prom;
}

async function retornaUsers() {
  let usuaris = [];

  try {
    query = await adminUsers.getPlayersAsync();
  } catch (err) {
    console.log(err);
  }

  usuaris = query;

  return usuaris;
}

app.post("/saveStats", (req, res) => {
  let playerNewStats = {
    investedSeconds: req.body.investedSeconds / 1000,
    rounds: req.body.rounds,
    deads: req.body.deads,
  };

  adminUsers.updatePlayerAsync(nomUsuari, playerNewStats);
});

app.post("/usersPost", async (req, res) => {
  let users = await adminUsers.getPlayersAsync();

  session.users = users;

  res.send(JSON.stringify(users));
});

app.post("/deletePost", async (req, res) => {
  connexio.iniciar();

  console.log("Ha entrat a delete post server");
  let username = req.body.userid;

  await adminUsers.deletePlayerAsync(username);

  let users = await retornaUsers();

  session.users = users;

  res.send(JSON.stringify(users));
});

function afegirSettings() {
  console.log("Ha afegit settings");

  connexio.iniciar();

  newSettings = {
    identificacio: 1,
    zombieMaxHealth: 100,
    zombieDamage: 10,
    zombieSpeed: 1,
    playerSpeed: 20,
    playerMaxHealth: 100,
    playerFireRate: 0.1,
  };

  console.log("Zombie health desdel server", newSettings.zombieMaxHealth);

  adminSettings.newSettingsAsync(newSettings);
}

app.post("/getSettingsPost", async (req, res) => {
  connexio.iniciar();

  let settings = await adminSettings.getSettingsAsync();

  let ret = JSON.stringify(settings);

  res.send(ret);
});

app.post("/updateSettingsPost", async (req, res) => {
  console.log("Ha entrat a update post");

  let newSettings = {
    zombieMaxHealth: req.body.zombieHealth,
    zombieDamage: req.body.zombieDamage,
    zombieSpeed: req.body.zombieSpeed,
    playerSpeed: req.body.playerSpeed,
    playerMaxHealth: req.body.playerHealth,
    playerFireRate: req.body.playerFireRate,
  };

  await adminSettings.updateSettingsAsync(1, newSettings);
});

console.log("Nom usuari fora: ", nomUsuari);
