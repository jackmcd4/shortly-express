var Bookshelf = require('bookshelf');
var path = require('path');

var db = Bookshelf.initialize({
  client: 'sqlite3',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'password',
    database: 'shortlydb',
    charset: 'utf8',
    filename: path.join(__dirname, '../db/shortly.sqlite')
  }
});
// db.knex.schema.dropTableIfExists('users').then(function(something, err) {
//     console.log("droptable", something, err);
//   });
// db.knex.schema.dropTableIfExists('urls').then(function(something, err) {
//     console.log("droptable", something, err);
//   });
// db.knex.schema.dropTableIfExists('sessions').then(function(something, err) {
//     console.log("droptable", something, err);
//   });
// db.knex.schema.dropTableIfExists('clicks').then(function(something, err) {
//     console.log("droptable", something, err);
//   });

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('base_url', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('link_id');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('users').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function (user) {
      user.increments('id').primary();
      user.string('username', 50);
      user.string('password', 32);
      user.string('salt', 32);
      user.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('sessions').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('sessions', function (session) {
      session.increments('id').primary();
      session.integer('user_id');
      session.string('token', 100);
      session.dateTime('expiration');
      session.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('users_urls').then(function(exists) {
  if(!exists) {
    db.knex.schema.createTable('users_urls', function(table){
      table.integer('user_id').references('users.id');
      table.integer('urls_id').references('urls.id');
    })
  }
})



module.exports = db;
