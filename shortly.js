var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Sessions = require('./app/collections/sessions');
var Session = require('./app/models/session');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
// app.use(cookieParser('shhhh, very secret'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/login',
function(req, res) {
  res.render('login');
});

app.post('/login',
function(req, res) {
  console.log("IN");
  var username = req.body.username;
  var password = req.body.password;
//check for new user
  new User({username: username}).fetch().then(function(found) {
    if (found) {
      console.log("IN HERE")
      util.testPassword(password, found.attributes, function() {
        //save sessionID
        var expiration = new Date(Date.now() + (60000));
        var token = req.sessionID;
        req.session.cookie.expires = expiration;

        var session = new Session({
          user_id: found.attributes.id,
          token: token,
          expiration: expiration
        });

        session.save().then(function(newSession) {
          Sessions.add(newSession);
          console.log("expiration", expiration);
          res.cookie('session', token, { expires: expiration});
          // res.send(200);
          res.redirect('index');
        });
      });

    } else {
     res.render('login', { error: 'Username not found' });
    }
  });


});


app.get('/', util.checkUser,
function(req, res) {
  //ask if user logged in?
  res.render('index');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/logout',
function(req, res) {
    console.log("OUT");
    res.clearCookie('session');
    res.redirect('login');

});
app.post('/',
function(req, res) {
    console.log("OUT");
    res.clearCookie('session');
    res.redirect('login');

});


app.post('/signup',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

//check for new user
  new User({username: username}).fetch().then(function(found) {
    if (found) {
        res.render('signup', { error: 'Username already exists' });
    } else {


      var password = bcrypt.hashSync(password, null);

      var user = new User({
        username: username,
        password: password
      });

      user.save().then(function(newUser) {
        Users.add(newUser);
        res.redirect('login');
      });

    }
  });
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(foundLink) {
    if (foundLink) {
      console.log(req.session.user);
      new User({id: req.session.user.id}).fetch().then(function(user){
        foundLink.save().then(function(newLink){
          newLink.users().attach(user).then(function(relation){
            Links.add(newLink);
            res.send(200, newLink);
          })
        });
      })

      // res.send(200, foundLink.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        // user_id: user.get('id')
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
