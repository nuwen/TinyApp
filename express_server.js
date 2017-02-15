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

app.set('view engine', 'ejs');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// ROOT
app.get("/", (req, res) => {
  res.end('Hello');
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/", (req, res) => {
  const updateURL = req.body;
  const shortURL = (req.headers.referer.slice(27));
  console.log(req.body);  // debug statement to see POST parameters
  res.send(updateURL['longURL']);         // Respond with 'Ok' (we will replace this)
  urlDatabase[shortURL] = updateURL.longURL;
});

app.post("/login", (req, res) => {
  console.log(req.body);
  console.log(res.cookie);
  // res.send(req.body['username']);
  res.redirect('/');
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = { shortURL, longURL: urlDatabase[shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURLS", (req, res) => {
  let longURL = "http://www.lighthouselabs.ca";
  res.redirect(longURL);
});


app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

function generateRandomString() {

}
