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

  // genid: function(req) {
  //   var gui = guid();
  //   console.log(gui);
  //   return gui; // use UUIDs for session IDs
  // }
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

var restrict = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}


app.get('/login',
function(req, res) {
  res.render('login');
});

app.post('/login',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

//check for new user
  new User({username: username}).fetch().then(function(found) {
    if (found) {

      if(util.testPassword(password, found.attributes)) {
        //save sessionID
        var session = new Session({
          user_id: found.attributes.id,
          token: req.sessionID,
          expiration: new Date(Date.now() + 900000)
        });

        session.save().then(function(newSession) {
          Sessions.add(newSession);
          console.log("one", newSession.attributes.expiration);
          res.cookie('session', req.sessionID, { expires: newSession.attributes.expiration});
          // res.send(200);
          res.render('index');
        });
      } else {
        res.render('login', { error: 'Incorrect password' })
      }
    } else {
     res.render('login', { error: 'Username not found' });
    }
  });


});


app.get('/', restrict,
function(req, res) {
  //ask if user logged in?
  res.render('index');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
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
      var salt = bcrypt.genSaltSync(10);
      var user = new User({
        salt: salt,
        username: username,
        password: bcrypt.hashSync(password, salt)
      });

      user.save().then(function(newUser) {
        Users.add(newUser);
        // console.log(newUser);
        // res.send(200, );
        res.render('index');
      });

    }
  });
});

app.get('/create',
function(req, res) {
  res.render('index');
});

app.get('/links',
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
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
