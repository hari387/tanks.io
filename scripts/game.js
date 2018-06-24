let config = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: { y: 0 }
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	} 
};

var game = new Phaser.Game(config);
var room = '';
var first = true;

function preload(){
	this.load.image('tankBody','assets/tankBody.png');
	this.load.image('tankHead','assets/tankHead.png');
	this.load.image('tiles','assets/moreTiles.png');
	this.load.image('bullet','assets/bullet1.png');
	this.load.tilemapTiledJSON('level1', 'assets/map.json');
}

function create(){

	var g = this;

	this.map = this.add.tilemap('level1');
	let tileset = this.map.addTilesetImage('moreTiles','tiles');
	this.background = this.map.createStaticLayer('Background',tileset,0,0);
	this.walls = this.map.createStaticLayer('Walls',tileset,0,0);
	//this.walls.setCollisionByExclusion(nonColTiles,true);
	this.map.setCollisionBetween(1, 120, true, 'walls');

	this.socket = io.connect();

	this.socket.on('currentPlayers',function(players){
		Object.keys(players).forEach(function(id){
			if(id == g.socket.id){
				addMe(g,players[id]);
			} else {
				addOtherPlayer(g,players[id]);
			}
		});
	});

	this.socket.on('newPlayer',function(newPlayer){
		console.log('A player joined this room');
		addOtherPlayer(g,newPlayer);
	});

	this.socket.on('disconnected',function(id){
		console.log(id + 'disconnected');
		g.otherBodies.getChildren().forEach(function(body){
			if(body.id == id){
				body.destroy();
			}
		});
		g.otherHeads.getChildren().forEach(function(head){
			if(head.id == id){
				head.destroy();
			}
		});
	});

	this.socket.on('moveUpdate',function(player){
		console.log('Move Update');
		//search in other players for matching id and update accordingly
		g.otherBodies.getChildren().forEach(function(gPlayer){
			if(gPlayer.id == player.id){
				gPlayer.x = player.x;
				gPlayer.y = player.y;
				gPlayer.rotation = player.rotation;
				gPlayer.velocity.x = player.v.x;
				gPlayer.velocity.y = player.v.y;
			}
		});
		g.otherHeads.getChildren().forEach(function(gHead){
			if(gHead.id == player.id){
				gHead.x = player.x;
				gHead.y = player.y;
				gHead.rotation = player.aim;
				gHead.velocity.x = player.v.x;
				gHead.velocity.y = player.v.y;
			}
		});
	});

	this.socket.on('shot',function(bullet){
		console.log('shot');
		g.bullet = g.physics.add.sprite(bullet.x,bullet.y,'bullet')
			.setOrigin(0.5,0.5)
			.setDisplaySize(292/425 * 20,20);
		g.bullets.add(g.bullet);
		g.bullet.setVelocity(bullet.v.x,bullet.v.y);
		g.bullet.rotation = bullet.rotation;
	});

	this.otherBodies = this.physics.add.group();
	this.otherHeads = this.physics.add.group();

	this.bullets = this.physics.add.group();

	this.keys = this.input.keyboard.createCursorKeys();
	this.wasd = {
	  up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
	  down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
	  left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
	  right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
	};
	this.mouse = this.input.activePointer;

	//this.cameras.main.startFollow(this.tankBody,false,1,1,-1 * config.width/2 +3 * window.innerWidth/8 +40,-config.height/2+895 + 3 * window.innerHeight/8);
}

function update(){

	if(first && this.tankBody){
		console.log('cameraFollow');
		first = false;
		this.cameras.main.startFollow(this.tankBody);
	}

	this.bullet;

	if(this.tankBody){
		//rotation
		if (this.keys.left.isDown || this.wasd.left.isDown) {
			this.tankBody.setAngularVelocity(-180);
		} else if (this.keys.right.isDown || this.wasd.right.isDown) {
			this.tankBody.setAngularVelocity(180);
		} else {
			this.tankBody.setAngularVelocity(0);
		}
		
		//forwards and backwards movement (both body and head)
		if (this.keys.up.isDown || this.wasd.up.isDown) {
			this.tankBody.setVelocity(300 * Math.cos(this.tankBody.rotation-Math.PI/2),300 * Math.sin(this.tankBody.rotation-Math.PI/2));
			this.tankHead.setVelocity(300 * Math.cos(this.tankBody.rotation-Math.PI/2),300 * Math.sin(this.tankBody.rotation-Math.PI/2));
		} /*else if (this.keys.down.isDown || this.wasd.down.isDown) {
			this.tankBody.setVelocity(-300 * Math.cos(this.tankBody.rotation-Math.PI/2),-300 * Math.sin(this.tankBody.rotation-Math.PI/2));
			this.tankHead.setVelocity(-300 * Math.cos(this.tankBody.rotation-Math.PI/2),-300 * Math.sin(this.tankBody.rotation-Math.PI/2));
		}*/ else {
			this.tankBody.setVelocity(0,0);
			this.tankHead.setVelocity(0,0);
		}

		this.physics.collide(this.tankBody, this.walls);

		//debug statements
		if(this.keys.space.isDown){
			//console.log('Tank: ' + this.tankBody.velocity.x + ', ' + this.tankBody.velocity.y);
			//console.log('Cam: '+ this.cameras.main.scrollX + ', ' + this.cameras.main.scrollY);
			//console.log(this.tankBody.rotation)
			//console.log(this.mouse.y);
		}

		//update tank head rotation
		this.tankHead.x = this.tankBody.x;
		this.tankHead.y = this.tankBody.y;
		if(this.mouse.x >= window.innerWidth/2){
			this.tankHead.rotation = Math.atan((this.mouse.y - 1/2 * window.innerHeight) / (this.mouse.x - window.innerWidth/2)) + Math.PI/2;
		} else {
			this.tankHead.rotation = (Math.atan((this.mouse.y - 1/2 * window.innerHeight) / (this.mouse.x - window.innerWidth/2)) - Math.PI/2);
		}
		
		//Add Bullet and fire
		if(this.mouse.justDown){
			console.log('hi');
			let vel = {
				x:2000 * Math.cos(this.tankHead.rotation - Math.PI/2),
				y:2000 * Math.sin(this.tankHead.rotation - Math.PI/2)
			};
			this.bullet = this.physics.add.sprite(this.tankHead.x,this.tankHead.y,'bullet')
				.setDisplaySize(292/425 * 20,20)
				.setOrigin(0.5,0.5); 
			this.bullets.add(this.bullet);
			this.bullet.depth = 0;
			this.bullet.rotation = this.tankHead.rotation;
			this.bullet.setVelocity(2000 * Math.cos(this.tankHead.rotation - Math.PI/2),2000 * Math.sin(this.tankHead.rotation - Math.PI/2));
			this.socket.emit('shot',room,{
				x:this.bullet.x,
				y:this.bullet.y,
				v:{
					x:vel.x,
					y:vel.y
				},
				rotation:this.bullet.rotation
			});
		}

		//send server updates

		this.playerF = {
			x:this.tankBody.x,
			y:this.tankBody.y,
			velocity:{
				x:this.tankBody.velocity.x,
				y:this.tankBody.velocity.y
			},
			rotation: this.tankBody.rotation,
			aim: this.tankHead.rotation
		}
		
		if(typeof this.playerI != "undefined"){
			if(!isEquivalent(this.playerI,this.playerF)){// isEquivalent is object equality function
				//if tank is in different state before vs after, send a server update
				//console.log('sending move update');
				this.socket.emit('movement',this.playerF,room);
			}
		}

		this.playerI = {
			x:this.tankBody.x,
			y:this.tankBody.y,
			velocity:{
				x:this.tankBody.velocity.x,
				y:this.tankBody.velocity.y
			},
			rotation: this.tankBody.rotation,
			aim: this.tankHead.rotation
		}

	}
}

// tis = game/this for all intents and purposes
function addMe(tis,player){
	tis.tankBody = tis.physics.add.sprite(player.x,player.y,'tankBody').setOrigin(0.5,0.55);
	tis.tankBody.rotation = player.rotation;
	tis.tankHead = tis.physics.add.sprite(tis.tankBody.x,tis.tankBody.y,'tankHead').setOrigin(0.5,34/42);
	tis.tankHead.rotation = player.aim;
	tis.tankBody.velocity = player.v;
	tis.tankHead.velocity = player.v;
	room = player.room;

	tis.tankBody.id = player.id;
	tis.tankHead.id = player.id;

	tis.tankBody.depth = 1;
	tis.tankHead.depth = 2;
}

function addOtherPlayer(tis,player){
	tis.otherBody = tis.physics.add.sprite(player.x,player.y,'tankBody').setOrigin(0.5,0.55);
	tis.otherHead = tis.physics.add.sprite(player.x,player.y,'tankHead').setOrigin(0.5,34/42);
	tis.otherBody.rotation = player.rotation;
	tis.otherHead.rotation = player.aim;
	tis.otherBody.velocity = player.v;
	tis.otherHead.velocity = player.v;

	tis.otherBody.id = player.id;
	tis.otherHead.id = player.id;
	tis.otherBodies.add(tis.otherBody);
	tis.otherHeads.add(tis.otherHead);

	tis.otherBody.depth = 1;
	tis.otherHead.depth = 2;
}

function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if((typeof a[propName]) != "object" && (typeof b[propName] != "object")) {
	        if (a[propName] !== b[propName]) {
	            return false;
	        }
	    } else {
	    	if(!isEquivalent(a[propName],b[propName])){
	    		return false;
	    	}
	    }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}
function resizeCam(g){
	console.log('resizeCam');
	first = true;
}