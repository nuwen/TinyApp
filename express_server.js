// listen to port 8080
// need http

var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();

var PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.use(cookieParser());




app.use(function(req, res, next){
  res.locals.user_id = req.cookies['user_id'];
  res.locals.users = users;
  res.locals.user_email = req.body['user_id'];

  next();
});

app.set('view engine', 'ejs');



var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "abc123": {
    id: "abc123",
    email: "mail@mail.com",
    password: "pass123"
  }
};






// ROOT

app.get('/', (req, res) => {
  // render `home.ejs` with the list of posts
  res.send('hello');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World! TESTSES</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  if(false) { // change back to "!req.cookies["user_id"]"
    res.status(401).send('Unauthorized');
  } else {
    let templateVars = {
      urls: urlDatabase
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);

});

app.post("/urls/", (req, res) => { //still need to generate shorturl wit user logged in
  const updateURL = req.body;
  const shortURL = (req.headers.referer.slice(27));
  console.log(req.body);  // debug statement to see POST parameters
  res.send(updateURL['longURL']);         // Respond with 'Ok' (we will replace this)
  urlDatabase[shortURL] = updateURL.longURL;
});

/////////////////////////////////// LOGIN \\\\\\\\\\\\\\\\\\\\\\\\ TASK 6

app.get("/login", (req, res) => {
  console.log("login page");
  res.render('urls_login');

})

app.post("/login", (req, res) => {

  res.cookie('user_id', req.body['user_id']);

  if(!req.body['user_id']) {
    res.send('invalid user id');
  }
  if(!emailExists(req.body['user_id'])){

    res.status(403).send('Email does not exist!');

  } else if(!req.body['password'] === users[emailExists(req.body['user_id'])]['password']) {

    res.status(403).send('Invalid password');

  } else {

    res.cookie('user_id', emailExists(req.body['user_id']));
    console.log(req.cookies);
    res.redirect('/');
  }

});


/////////////////////////////////// REGISTER \\\\\\\\\\\\\\\\\\\\\\\\


app.get("/register", (req, res) => {
  res.render('urls_register');
});

app.post("/register", (req, res) => {
  var email = req.body['email'];
  var password = req.body['password'];
  var userID = generateRandomString();

  if(!email || !password) {
    res.status(400).send("Invalid input!");
  } else if (emailExists(email)) {

    res.status(400).send("E-mail already exists!");

  } else {
    users[userID] = {
      id: userID,
      email,
      password
    };
    res.cookie('email', email);
    res.cookie('user_id', userID);
    console.log(email, password, users);
    res.redirect('/urls');
  }
});

/////////////////////////////////// LOGOUT \\\\\\\\\\\\\\\\\\\\\\\\


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  console.log('loggedout');
  res.redirect('/urls');
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL]
  };

  if(!shortURL){
    res.status(404).send("URL does not exist!");
  }
  if(!req.cookies['user_id']) {
    res.status(401).send("Please login"); //need to add login link
  } else { // still need to add logged in user doesnt own url
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURLS", (req, res) => {
  let longURL = "http://www.lighthouselabs.ca";
  res.redirect(longURL);
});

app.get("/u/:id", (req, res) => {
  if(req.params.id){
    res.redirect(urlDatabase[req.params.id]);
  } else {
    res.status(404).send("Short URL doesn't exist");
  }
  let longURL = "http://www.lighthouselabs.ca";
  res.redirect(longURL);
});


app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < 5; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function emailExists(emailReg){
  for(userid in users) {
    if(users[userid]['email'] === emailReg){
      return userid;
    }
  }
  return false;
}
