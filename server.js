var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 3000;
var rooms = [];
app.use('/scripts',express.static(__dirname + '/scripts'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req, res){
	res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || port, function(){
	console.log('Listening on '+server.address().port);
});

io.on('connection', function(socket){
	console.log('A client has connected');
	console.log("The Client's ID is: " + socket.id);
	player = {
	    rotation: 0,
	    aim:0,
	    x: 360,//Math.floor(Math.random() * 4686) + 153,
	    y: Math.floor(Math.random() * 4686) + 153,
	    name:'',
	    v:{
	    	x:0,
	    	y:0
	    },
	    id: socket.id,
	    room:-1
	}
	if(rooms.length > 0 && Object.keys(rooms[rooms.length - 1]).length < 10){
		player.room = rooms.length - 1;
		rooms[rooms.length - 1][socket.id] = player;
		socket.join(player.room.toString());
		console.log('Player joined room ' + player.room.toString());
	} else {
		player.room = rooms.length;
		rooms[rooms.length] = {};
		rooms[rooms.length - 1][socket.id] = player;
		socket.join(player.room.toString());
		console.log('Player joined room ' + player.room.toString());
	}
	socket.emit('currentPlayers',rooms[player.room]);
	//console.log(rooms[player.room]);
	socket.to(player.room.toString()).emit('newPlayer',player);

	socket.on('disconnect',function(){
		console.log('user disconnected: ', socket.id);
		delete rooms[player.room][socket.id];
		socket.to(player.room.toString()).emit('disconnected',socket.id);
	});

	socket.on('movement',function(player,room){
		//console.log('Move Update');
		let DBplayer = rooms[room][socket.id];
		DBplayer.v.x = player.velocity.x;
		DBplayer.v.y = player.velocity.y;
		DBplayer.x = player.x;
		DBplayer.y = player.y;
		DBplayer.rotation = player.rotation;
		DBplayer.aim = player.aim;
		socket.to(room.toString()).emit('moveUpdate',DBplayer);//ID is already in DBplayer as DBplayer.id
	});
});