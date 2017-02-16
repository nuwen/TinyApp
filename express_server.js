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
  res.locals.username = req.cookies['username'];

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
  if(false) { // change back to "!req.cookies["username"]"
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

/////////////////////////////////// LOGIN \\\\\\\\\\\\\\\\\\\\\\\\


app.post("/login", (req, res) => {
  var usernameINPUT = req.body['username'];
  res.cookie('username', usernameINPUT);
  res.cookie('session', '1', {expires: 0});
  if(req.body['username']) {
    res.redirect('/urls');
  } else {
    //html with input fields for email and password
  }
});
/////////////////////////////////// REGISTER \\\\\\\\\\\\\\\\\\\\\\\\
app.get("/register", (req, res) => {
  res.render('register');
});

app.post("/register", (req, res) => {
  var emailReg = req.body['email'];
  var pwdReg = req.body['password'];
  res.cookie('email', emailReg);
  res.cookie('password', pwdReg);
  var userID = generateRandomString();
  users[userID] = {
      id: userID,
      email: emailReg,
      password: pwdReg
  }
  console.log(emailReg, pwdReg, users);
});

/////////////////////////////////// LOGOUT \\\\\\\\\\\\\\\\\\\\\\\\


app.post("/logout", (req, res) => {
  res.clearCookie('username');
  console.log('deleted');
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
  if(!req.cookies['username']) {
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
