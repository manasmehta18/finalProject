const express = require('express'),
      passport = require( 'passport' ),
      LocalStrategy = require( 'passport-local' ).Strategy,
      bodyParser = require("body-parser"),
      compression = require('compression'),
      fs_service = require('./firestore_service.js'),
      favicon = require('serve-favicon'),
      path = require('path'),
      helmet = require('helmet'),
      app = express()

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('dist'));
app.use(compression({level: 1}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(favicon(path.join(__dirname, '/src/media', 'favicon.jpg')));
app.use(helmet());

fs_service.init();

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/dist/login.html');
});

passport.use('local', new LocalStrategy( {
  usernameField: 'username',
  passwordField: 'password'
}, function( username, password, done ) {
  fs_service.readData(username).then(myData=> {
      if(myData === undefined || myData === null) {
        console.log("user not found");
        return done( null, false, { message:'user not found' })
      } else {
        const pass = myData.password;
        if ( pass !==  null && pass !== undefined && pass === password) {
          console.log("successfully authenticated");
          return done(null, {username, password})
        } else {
          console.log("incorrect password");
          return done( null, false, { message: 'incorrect password' })
        }
      }
    })
}));

app.use(passport.initialize());
//app.use(passport.session());

passport.serializeUser(function(username, done) {
  done(null, username);
});

passport.deserializeUser(function(username, done) {
  done(null, username);
});

app.post( '/login', passport.authenticate( 'local' ), function( req, res ) {
  console.log( 'username:', req.body.username );
  res.json({'status': true});
});



app.post( '/signup', function( request, response ) {
  json = request.body;

  let username = JSON.stringify(json.username).replace(/^"(.*)"$/, '$1');
  fs_service.addNewUserProfile(username, json);

  response.writeHead( 200, { 'Content-Type': 'application/json'})
  response.end( JSON.stringify( request.body ) )
})

// listen for requests
const listener = app.listen(3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

