var request = require('request');
var bcrypt = require('bcrypt-nodejs');
var db = require('../app/config');
var Session = require('../app/models/session');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

exports.testPassword = function(password, user, cb) {
  console.log("USER:", user);
  bcrypt.compare(password, user.password, function(err, isMatch) {
    if (err) {
      res.render('login', { error: 'Incorrect password' })
    }
    cb(isMatch);
  });
}

exports.checkUser = function (req, res, next) {

  console.log("checkUser session: ", req.session);
  if (req.headers.cookie && req.headers.cookie.slice(8)) {
    var token = req.headers.cookie.slice(8);
    var session = new Session({token: token}).fetch().then(function(found){
      if (found) {
        next();
      } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
      }

    })

  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}
