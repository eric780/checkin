var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var http = require('http').createServer(app);
var io = require('socket.io')(http);
http.listen(8080);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/* socket.io stuff */
var clients = []; // maintain list of connected clients
var loggedinusers = {}; // maintain who is logged in
var checkedinusers = {}; // maintain who is checked in
var usernames = {}; // maintain list of usernames

io.on('connection', function(socket){
  console.log('a user has connected', socket.id);
  // record connection
  clients.push(socket);
  loggedinusers[socket.id] = false; // not logged in yet
  checkedinusers[socket.id] = false; // not checked in yet
  // send current status of users to the new user
  socket.emit('users-status', createUsersStatus(clients, loggedinusers, checkedinusers, usernames));

  // record disconnection
  socket.on('disconnect', function(){
    console.log('a user has disconnected');
    clients.splice(clients.indexOf(socket), 1);
    delete loggedinusers[socket.id];
    delete checkedinusers[socket.id];
    delete usernames[socket.id];

    io.emit('user-disconnected', socket.id);
  });

  // user attempted to log in
  socket.on('login', function(user){
    console.log('users ', usernames);
    // if user not logged in yet
    if(!loggedinusers[socket.id]){
      io.emit('userloggedin', {username: user, userid: socket.id});
      loggedinusers[socket.id] = true;
      usernames[socket.id] = user;
      console.log(user + ' has logged in');

    }
    else if(loggedinusers[socket.id] && usernames[socket.id] != user)
    {
      // user changed username then hit login
      usernames[socket.id] = user;
      io.emit('userchangedname', {userid: socket.id, newname: user});
    }
    else{
      console.log(user + ' has tried to log in but is already logged in');
    }
  });

  // user checked in
  socket.on('checkin', function(user){
    if(!checkedinusers[socket.id]){
      checkedinusers[socket.id] = true;
      console.log(user + ' has checked in');
      io.emit('usercheckedin', socket.id);

      // if all logged in users are also checked in
      if(allUsersReady(clients, loggedinusers, checkedinusers))
        io.emit('all-ready');
    }
    
  });

  // user checked out
  socket.on('checkout', function(user){
    checkedinusers[socket.id] = false;
    console.log(user + ' has checked out');
    io.emit('usercheckedout', socket.id);
  });
});

// returns an array of objects containing (for logged in users):
// client id
// username
// checked in boolean
createUsersStatus = function(clients, loggedinusers, checkedinusers, usernames)
{
  console.log('users logged in', Object.keys(loggedinusers));
  var users = []
  Object.keys(loggedinusers).forEach(function(userid) // iterate through user id's
    {
      if(loggedinusers[userid]){
        var user = {};
        user.userid = userid;
        user.username = usernames[userid];
        user.checkedin = checkedinusers[userid];
        users.push(user);
      }
    }
  );
  return users;
}

allUsersReady = function(clients, loggedinusers, checkedinusers)
{
  console.log('checking if everyone is ready..');
  console.log('checkedinusers: ', checkedinusers);
  console.log('loggedinusers: ', loggedinusers);
  var b = true;
  Object.keys(loggedinusers).forEach(function(userid){
    console.log(checkedinusers[userid], ' and ', loggedinusers[userid]);
    if(!checkedinusers[userid] && loggedinusers[userid]){
      b = false;
    }
      
  });
  return b;
}

/*END Socket.io stuff */


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
