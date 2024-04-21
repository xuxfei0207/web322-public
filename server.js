/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Xiaofei Xu Student ID: 149011223 Date: 2024-04-020
 * 
 *  Published URL: https://ill-pink-pants.cyclic.app/
 *
 ********************************************************************************/
const clientSessions = require("client-sessions");
const authData = require("./modules/auth-service");
const { error } = require("console");
const legoData = require("./modules/legoSets");
const express = require("express");
const path = require("path");

const app = express();
const HTTP_PORT = 3000;

app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

legoData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Unable to start server: ${err}`);
  });

app.set("view engine", "ejs");

app.use(express.static("public")); // now /public folder will be the starting point of finding css file
// app.get("/", (req, res) => {
//   res.status(200).send("Assignment 2: Xiaofei Xu - 149011223");
// });
app.use(express.urlencoded({extended:true}));

app.get("/", (req, res) => {
  console.log("serving html file: ", path.join(__dirname, "/views/home.html"));
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/addSet", ensureLogin, async (req, res) => {
  let themes = await legoData.getAllThemes()
  res.render("addSet", { themes: themes})
});

app.post("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {message: `Sorry, we have encountered the following error: ${err}`});
  }
});

app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {

  try {
    let set = await legoData.getSetByNum(req.params.num);
    let themes = await legoData.getAllThemes();

    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }

});

app.post("/lego/editSet", ensureLogin, async (req, res) => {

  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
})

// /lego/sets
// /lego/sets?theme=abc

app.get("/lego/sets", (req, res) => {
  const theme = req.query.theme;
  if (theme) {
    legoData
      .getSetsByTheme(theme)
      // .then((legoSets) => res.send(legoSets))
      .then((legoSets) => {
        console.log(legoSets);
        res.render("sets", { sets: legoSets });
      })
      .catch((error) => res.status(404).render("404", {
        message: "No Sets found for a matching theme",
      }));
  } else {
    legoData
      .getAllSets()
      // .then((legoSets) => res.send(legoSets))
      .then((legoSets) => {
        console.log(legoSets);
        res.render("sets", { sets: legoSets });
      })
      .catch((error) => res.status(404).send({ message: error }));
  }
});


app.get("/lego/sets/num-demo", (req, res) => {
  const userNum = req.params.num;
  legoData
    .getSetByNum(userNum)
    .then((foundSet) => {
      if (foundSet) {
        res.status(200).send(foundSet);
      } else {
        res.status(404).send("Set not found");
      }
    })
    .catch((error) => res.status(404).send({ message: error }));
});

app.get("/lego/sets/:num", (req, res) => {
  const setNum = req.params.num;
  console.log("set num: ", setNum);
  legoData
    .getSetByNum(setNum)
    // .then((foundSet) => res.status(200).send(foundSet))
    .then((legoSet) => res.render("set", {set: legoSet}))
    .catch((error) => res.status(404).render("404", {
      message: "No Sets found for a specific set num",
    }));
});

app.get("/login", (req, res) => {
  res.render("login", { errorMessage: null });
});

app.get("/register", (req, res) => {
  res.render("register", { successMessage: null, errorMessage: null });
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      console.log("register user: ", req.body)
      res.render("register", {
          successMessage: "User created",
          errorMessage: null,
      });
    })
    .catch(err => {
      console.log("error occurrs when register user: ", req.body, err)
      res.render("register", {
          successMessage: null,
          errorMessage: error.message,
          userName: req.body.userName,
      });
    })
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body).then((user) => {
    req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
    };  
    res.redirect("/lego/sets");
  })
  .catch((error) => {
      res.render("login", {
          errorMessage: error,
          userName: req.body.userName,
      });
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});


app.use((req, res) => {
  res.status(404).render("404", {
    message: "No view matched for a specific route",
  });
});
