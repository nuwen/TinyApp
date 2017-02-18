
// listen to port 8080
// need http

var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
var bcrypt = require('bcrypt');
var PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
var cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: [process.env.WHITE_CHOCOLATE_MACADAMIA_NUTS || 'development']
}));

app.set('view engine', 'ejs');

////////////////////////////// "Database"

let urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "abc123",
    allCount: 0,
    uniqueCount: 0,
    timeStamp: 0
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "abc123",
    allCount: 0,
    uniqueCount: 0,
    timeStamp: 0
  }
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

// Middleware

app.use(function(req, res, next){
  res.locals.user_id = req.session.user_id;
  res.locals.email = req.session.user_id;
  res.locals.users = users;
  res.locals.urls = urlDatabase;
  next();
});

/////////////////// Functions \\\\\\\\\\\\\\\\\\\\\\\\\\

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < 5; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
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

function urlsForUser(id) {
  var idArr = [];

  for(let url in urlDatabase) {
    var shortURL = urlDatabase[url];

    for(let userID in shortURL){
      if(id === shortURL[userID]) {
        idArr.push(url);
      }
    }
  }
  return idArr;
}

// ROOT

app.get('/', (req, res) => {
  res.redirect("/login");
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

// Access /urls

app.get("/urls", (req, res) => {
  if(!req.session.user_id) {
    res.status(401).send('Unauthorized');
  } else {

    let templateVars = {userUrls: (urlsForUser(req.session.user_id))};
    console.log(urlDatabase);
    res.render("urls_index", templateVars);
  }
});

app.get("/new", (req, res) => {

  res.render("urls_new");

});

// Create new URL Handler

app.post("/urls", (req, res) => {
  if(req.session.user_id){
    let newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      url: req.body.newURL,
      userID: req.session.user_id,
      allCount: 0,
      uniqueCount: 0,
      timeStamp: new Date()
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.status(401).send("Please login <a href='/login'>Click Here</a>");
  }
});

/////////////////////////////////// LOGIN \\\\\\\\\\\\\\\\\\\\\\\\ TASK 6

app.get("/login", (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('urls_login');
  }
});

app.post("/login", (req, res) => {

  if(!req.body['user_id']) {
    res.send('invalid user id');
  }

  if(emailExists(req.body.user_id)) {
    req.session.user_id = emailExists(req.body.user_id);
  } else {
  res.status(403).send('Email does not exist!');
  }

  if(bcrypt.compare(req.body['password'], users[emailExists(req.body['user_id'])]['password'])) {

    res.redirect('/urls');

  } else {
    res.status(403).send('Invalid password');
  }

});


/////////////////////////////////// REGISTER \\\\\\\\\\\\\\\\\\\\\\\\


app.get("/register", (req, res) => {
  if(req.session.user_id){
    res.redirect('/')
  }
  res.render('urls_register');
});

app.post("/register", (req, res) => {
  var email = req.body['email'];

  var password = bcrypt.hashSync(req.body['password'], 10);
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
    req.session.email = email;
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

/////////////////////////////////// LOGOUT \\\\\\\\\\\\\\\\\\\\\\\\


app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect('/login');
});
/////////// UPDATE URL
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL]['url']
  };

  if(!shortURL){
    res.status(404).send("URL does not exist!");
  }
  if(!req.session.user_id) {
    res.status(401).send("Please login <a href='/login'>Click Here</a>");
  } else if (req.session.user_id !== urlDatabase[shortURL]['userID']) {
    res.status(403).send("Invalid Permissions!");
  }
  res.render("urls_show", templateVars);
});

//////////////////////// Update URL

app.post("/urls/:id", (req, res) => {
  if(!req.params.id) {
    res.status(404).send("URL does not exist!");
  }
  if(!req.session.user_id) {
    res.status(401).send("Please login <a href='/login'>Click Here</a>");
  }
  if(req.session.user_id !== urlDatabase[req.params.id].userID){
    res.status(403).send("Error 403, Unauthorized access.");
  }

  let updateURL = req.body;
  let shortURL = req.params.id;
  console.log('POSTLINK:::::::::', urlDatabase[shortURL]);
  urlDatabase[shortURL].url = updateURL.longURL;

  console.log(urlDatabase);
});


app.get("/u/:id", (req, res) => {
  if(req.params.id){
    let longURL = urlDatabase[req.params.id]['url'];


    var views = urlDatabase[req.params.id]['allCount'];
    views++;
    urlDatabase[req.params.id]['allCount'] = views;
    urlDatabase[req.params.id].count += 1;

    console.log('REQID >>>>>>>>>>>>>>>>>', req.session.sessionid);

    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL doesn't exist");
  }
});



app.post("/urls/:id/delete", (req, res) => {

  if(req.session.user_id === urlDatabase[req.params.id]['userID']){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }

  res.status(403).send('No Permission!');

});
