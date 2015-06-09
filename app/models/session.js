var db = require('../config');
var User = require('./user.js')

var Session = db.Model.extend({
  tableName: 'sessions',
  hasTimestamps: true,
  user: function() {
    return this.hasOne(User, 'user_id');
  }
});

module.exports = Session;
