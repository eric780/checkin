


module.exports = function (io) {
	// io stuff here

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

	    if(!usernameIsGood(user)){
	    	socket.emit('invalid username');
	    	return;
	    }

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

	usernameIsGood = function(username)
	{
		//var regex = /(<([^>]+)>)/ig;
		//return regex.test(username);
		return username.indexOf('<script>') == -1;
	}

/*END Socket.io stuff */

}