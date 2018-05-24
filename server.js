var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 3000;
var players = {};

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
});