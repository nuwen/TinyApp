var express = require('express');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcrypt');
var app = express();
var PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));
var cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'development']
}));

app.set('view engine', 'ejs');


let urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "abc123",
    allCount: 0,
    uniqueCount: 0
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "abc123",
    allCount: 0,
    uniqueCount: 0
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


app.use(function(req, res, next) {
  res.locals.user_id = req.session.user_id;
  res.locals.email = req.session.user_id;
  res.locals.users = users;
  res.locals.urls = urlDatabase;
  next();
});


function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function emailExists(emailReg) {
  for (userid in users) {
    if (users[userid].email === emailReg) {
      return userid;
    }
  }
  return false;
}

function urlsForUser(id) {
  var idArr = [];

  for (let url in urlDatabase) {
    var shortURL = urlDatabase[url].userID;
    if (id === shortURL) {
      idArr.push(url);
    }
  }
  return idArr;
}

let checkValidURL = (url) => {
  if (/^\s+$/.test(url) || url === null || !url) {
    return false;
  } else {
    return true;
  }
};

let includesHTTP = (url) => {

  if (url.includes('http://') || url.includes('https://')) {
    return url;
  } else {
    return ('http://' + url);
  }

};

app.get('/', (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('Unauthorized');
  } else {

    let templateVars = {
      userUrls: (urlsForUser(req.session.user_id))
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/new", (req, res) => {

  res.render("urls_new");

});

app.post("/urls", (req, res) => {
  let valid = checkValidURL(req.body.newURL)
  if (valid) {
    console.log(valid);
  } else {
    res.redirect(`/urls`)
    return;
  }

  if (req.session.user_id && valid) {
    let validatedURL = includesHTTP(req.body.newURL);
    let newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      url: validatedURL,
      userID: req.session.user_id,
      allCount: 0,
      uniqueCount: 0,
      timeStamp: new Date().toUTCString()
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.status(401).send("Please login <a href='/login'>Click Here</a>");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('urls_login');
  }
});

app.post("/login", (req, res) => {

  if (!req.body.userEmail) {
    res.send("Invalid credentials. <a href='/login'>Try again!</a>");
  }

  if (!emailExists(req.body.userEmail)) {
    res.status(403).send("Email does not exist! <a href='/login'>Try again!</a>");
  }

  if (bcrypt.compareSync(req.body.password, users[emailExists(req.body.userEmail)].password)) {

    req.session.user_id = req.body.userEmail;
    res.redirect('/urls');

  } else {
    res.status(403).send("Invalid password<a href='/login'>Try again!</a>");
  }

});


app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
  }
  res.render('urls_register');
});

app.post("/register", (req, res) => {
  var email = req.body.email;

  var password = bcrypt.hashSync(req.body.password, 10);
  var userID = generateRandomString();

  if (!email || !password) {
    res.status(400).send("Invalid input!<a href='/register'>Try again!</a>");
  } else if (emailExists(email)) {

    res.status(400).send("E-mail already exists!<a href='/register'>Try again!</a>");

  } else {
    users[userID] = {
      id: userID,
      email,
      password
    };
    req.session.email = email;
    req.session.user_id = email;
    res.redirect('/urls');
  }
});


app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect('/login');
});

/////////// UPDATE URL
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = {
    shortURL,
    longURL: includesHTTP(urlDatabase[shortURL].url)
  };

  if (!shortURL) {
    res.status(404).send("URL does not exist!<a href='/urls'>Try Again!</a>");
  }
  if (!req.session.user_id) {
    res.status(401).send("Please login <a href='/login'>Click Here</a>");
  } else if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(403).send("Invalid credentials!<a href='/urls'>Try again!</a>");
  }
  res.render("urls_show", templateVars);
});


app.post("/urls/:id", (req, res) => {
  if (!req.params.id) {
    res.status(404).send("URL does not exist!<a href='/urls'>Go back!</a>");
  }
  if (!req.session.user_id) {
    res.status(401).send("Please login <a href='/login'>Click Here</a>");
  }
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Error 403, Unauthorized access. <a href='/urls'>Home</a>");
  }

  let updateURL = req.body;
  let shortURL = req.params.id;
  urlDatabase[shortURL].url = includesHTTP(updateURL.longURL);
  res.redirect('/urls');
});


app.get("/u/:id", (req, res) => {
  if (req.params.id && urlDatabase[req.params.id].url) {
    let longURL = urlDatabase[req.params.id].url;

    var views = urlDatabase[req.params.id].allCount;
    views++;
    urlDatabase[req.params.id].allCount = views;
    urlDatabase[req.params.id].count += 1;


    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL doesn't exist! Sorry!");
  }
});



app.post("/urls/:id/delete", (req, res) => {

  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }

  res.status(403).send('No Permission! <a href="/urls">Go back!</a>');

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
