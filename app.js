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

io.on('connection', function(socket){
  console.log('a user has connected', socket.id);
  // record connection
  clients.push(socket);
  loggedinusers[socket.id] = false; // not logged in yet
  checkedinusers[socket.id] = false; // not checked in yet

  // record disconnection
  socket.on('disconnect', function(){
    console.log('a user has disconnected');
    clients.splice(clients.indexOf(socket), 1);
  });

  // user attempted to log in
  socket.on('login', function(user){
    if(!loggedinusers[socket.id]){
      io.emit('userloggedin', user);
      loggedinusers[socket.id] = true;
      console.log(user + ' has logged in');
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
      io.emit('usercheckedin', user);
    }
    
  });

  // user checked out
  socket.on('checkout', function(user){
    checkedinusers[socket.id] = false;
    console.log(user + ' has checked out');
    io.emit('usercheckedout', user);
  });
});

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
