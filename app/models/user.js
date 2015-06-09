var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function(){
    var salt = bcrypt.genSaltSync(10);
    var password = bcrypt.hashSync('password', salt);
  }

});

module.exports = User;
