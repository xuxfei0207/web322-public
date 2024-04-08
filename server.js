/********************************************************************************
 *  WEB322 – Assignment 05
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Xiaofei Xu Student ID: 149011223 Date: 2024-04-07
 * 
 *  Published URL: https://ill-pink-pants.cyclic.app/
 *
 ********************************************************************************/

const { error } = require("console");
const legoData = require("./modules/legoSets");
const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

legoData.initialize().then(() => {
  console.log("sets initialized!");
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

app.get("/lego/addSet", async (req, res) => {
  let themes = await legoData.getAllThemes()
  res.render("addSet", { themes: themes})
});

app.post("/lego/addSet", async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", {message: `Sorry, we have encountered the following error: ${err}`});
  }
});

app.get("/lego/editSet/:num", async (req, res) => {

  try {
    let set = await legoData.getSetByNum(req.params.num);
    let themes = await legoData.getAllThemes();

    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }

});

app.post("/lego/editSet", async (req, res) => {

  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/deleteSet/:num", async (req, res) => {
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

app.use((req, res) => {
  res.status(404).render("404", {
    message: "No view matched for a specific route",
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
