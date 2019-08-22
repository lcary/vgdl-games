var tools = Tools();

function VGDLSprite(gamejs, pos, size, args) {
	
	this.gamejs = gamejs

	this.transformedBy = {};
	//new Set();
	this.name = args.key || null;
	this.COLOR_DISC = [20, 80, 140, 200];
	this.is_static = false;
	this.only_active = false;
	this.is_avatar = false;
	this.is_stochastic =false;
	this.color = null;
	this.cooldown = 0;
	this.speed = null;
	this.mass = 1;
	this.physicstype = null;
	this.shrinkfactor = 0;
	this.dirtyrects = [];

	// import GridPhysics
	size = size || [10, 10];
	this.rect = new gamejs.Rect(pos, size);
	this.x = pos[0];
	this.y = pos[1];
	this.lastrect = this.rect.clone();
	this.physicstype = args.physicstype || this.physicstype || GridPhysics;
	this.physics = new this.physicstype();
	this.physics.gridsize = size;
	this.speed = args.speed || this.speed;
	this.cooldown = args.cooldown || this.cooldown;
	this.ID = new_id();
	this.direction = null;
	this.color = args.color || this.color || '#8c148c';
	this.image = args.image;

	// iterate over kwargs
	// this.extend(args);
	if (args) {
		var that = this;
		Object.keys(args).forEach(function (name) {
			var value = args[name];
			try {
				that[name] = value;
			}
			catch (e) {
			}
		});
	}
	// how many timesteps ago was the last move
	this.lastmove = 0;

	// management of resources contained in the sprite
	this.resources = new defaultDict(0);
}

VGDLSprite.dirtyrects = [];

VGDLSprite.prototype = {
	update : function (game) {
		this.x = this.rect.x;
		this.y = this.rect.y;

		this.lastrect = this.rect.clone();
		

		this.lastmove += 1;
		if (!(this.is_static) && !(this.only_active)) {
			// console.log('trying to do passive movement')
			this.physics.passiveMovement(this);
		}
	},

	_updatePos : function (orientation, speed = null) {
		if (speed == null)
			speed = this.speed;
		
		if (!(this.cooldown > this.lastmove) || Math.abs(orientation[0]) + Math.abs(orientation[1]) == 0) {
			// this.rect = this.rect.move(orientation[0] * speed, orientation[1] * speed);
			this.rect.moveIp(orientation[0] * speed, orientation[1] * speed);
			this.lastmove = 0;
		}

	},

	_velocity : function () {
		if (this.speed = null || this.speed == 0 || !('orientation' in this))
			return [0, 0];
		else
			return [this.orientation[0] * this.speed, this.orientation[1]*this.speed];
	},

	lastdirection : function () {
		return [this.rect.x-this.lastrect.x, this.rect.y-this.lastrect.y];
	},

	_draw : function (game) {

		if (this.image) {
			// console.log(this.image);
			// console.log(game.screen);

			game.screen.blit(game.image_dict[this.image], this.rect);
		}
		else {
			this.gamejs.graphics.rect(game.screen, this.color, this.rect);
		}

		if (Object.keys(this.resources).length)  {
			this._drawResources(game, game.screen, this.rect);
		}


		return;
		// var screen = game.screen;
		// if (this.shrinkfactor != 0)
		// 	var shrunk = this.rect.inflate(-this.rect.width * this.shrinkfactor,
		// 									-this.rect.height * this.shrinkfactor);
		// else
		// 	var shrunk = this.rect;

		// if (this.is_avatar) {
		// 	var rounded = tools.roundedPoints(shrunk);
		// 	this.gamejs.graphics.polygon(screen, this.color, rounded);
		// 	this.gamejs.graphics.lines(screen, '#32fa32', true, rounded, 2);
		// 	var r = this.rect.clone();
		// } 
		// else if (!(this.is_static)) {
		// 	var rounded = roundedPoints(shrunk);
		// 	this.gamejs.graphics.polygon(screen, this.color, rounded);
		// 	var r = this.rect.clone();
		// } 
		// else {
		// 	var r = screen.fill(this.color, shrunk);
		// }
		
		// VGDLSprite.dirtyrects.push(r);
	},

	_drawResources : function (game, screen, rect) {
		// import BLACK
		// console.log('drawing resource');
		var BLACK = '#000';
		var RCOLOR = '#FFF';
		var tot = Object.keys(this.resources).length;
		Object.keys(this.resources).forEach(r => {
			if (r != 'get') {
				if (game.sprite_constr[r][1].color) {
					RCOLOR = game.sprite_constr[r][1].color;
				}
			}
		})
		
		
		var barheight = rect.height /3.5/ tot;
		var offset = rect.top + 2*rect.height/3;
		var that = this;
		Object.keys(this.resources).sort().forEach(function (r) {
			var wiggle = rect.width/10;
			var prop = Math.max(0, Math.min(1, that.resources[r] / game.resources_limits[r]));
			var filled = new that.gamejs.Rect(rect.left+wiggle/2, offset, prop*(rect.width-wiggle), barheight);
			var rest = new that.gamejs.Rect(rect.left+wiggle/2+prop*(rect.width-wiggle), offset, (1-prop)*(rect.width-wiggle), barheight);
		
			that.gamejs.graphics.rect(screen, BLACK, rest);
			// console.log(game.resources_colors[r])
			that.gamejs.graphics.rect(screen, RCOLOR, filled);
			// screen.fill(game.resources_colors[r], filled);
			// screen.fill(BLACK, rest);
			offset += barheight;
		});
	},

	_clear : function (screen, background, double=null) {
		var r = screen.blit(background, this.rect, this.rect);
		VGDLSprite.dirtyrects.push(r);
		if (double) {
			r = screen.blit(background, this.lastrect, this.lastrect);
			VGDLSprite.dirtyrects.push(r);
		}
	},

	inspect : function () {
		return `${this.name} at (${this.rect.left}, ${this.rect.top})`; 
	},

	toString : function () {
		return `${this.name} at (${this.rect.left}, ${this.rect.top})`; 
	} 
}

function EOS (gamejs, pos, size, args) {
	this.ID = -1
}
EOS.prototype = Object.create(VGDLSprite.prototype);

function Immovable (gamejs, pos, size, args) {
	args.color = args.color || GRAY;
	this.is_static = args.is_static || true;
	VGDLSprite.call(this, gamejs, pos, size, args);
}
Immovable.prototype = Object.create(VGDLSprite.prototype);



function Passive (gamejs, pos, size, args) {
	args.color = args.color || RED;
	VGDLSprite.call(this, gamejs, pos, size, args);
}
Passive.prototype = Object.create(VGDLSprite.prototype);



function Flicker (gamejs, pos, size, args) {
	this._age = 0;
	args.color = args.color || RED;
	this.limit = 1;
	VGDLSprite.call(this, gamejs, pos, size, args);
}
Flicker.prototype = Object.create(VGDLSprite.prototype);

Flicker.prototype.update = function (game) {
	VGDLSprite.prototype.update.call(this, game);
	if (this._age > this.limit) 
		killSprite(this, null, game);

	this._age ++;	
}



function SpriteProducer (gamejs, pos, size, args) {
	VGDLSprite.call(this, gamejs, pos, size, args); 
} 
SpriteProducer.prototype = Object.create(VGDLSprite.prototype);



function Portal (gamejs, pos, size, args) {
	this.is_static = true;
	this.color = BLUE;
	SpriteProducer.call(this, gamejs, pos, size, args); 
}
Portal.prototype = Object.create(SpriteProducer.prototype);



function SpawnPoint (gamejs, pos, size, args) {
	SpriteProducer.call(this, gamejs, pos, size, args);
	args.color = args.color || BLACK
	if (args.prob != undefined) {
		this.prob = args.prob
	} else {
		this.prob = 1
	}

	this.is_stochastic = this.prob > 0 && this.prob < 1;

	if (args.cooldown != undefined) {
		this.cooldown = args.cooldown;
	} else {
		this.cooldown = 1;
	}
	if (args.total != undefined) this.total = args.total;

	this.counter = 0;
}
SpawnPoint.prototype = Object.create(SpriteProducer.prototype);

SpawnPoint.prototype.update = function (game) {
	var random = this.gamejs.math.random
	// console.log(this.prob, this.cooldown)
	var rnd = random.random()
	// console.log(game.time, this.cooldown)
	if (game.time % this.cooldown == 0 && rnd < this.prob) {
		game._createSprite([this.stype], [this.rect.left, this.rect.top]);
		this.counter ++;
	}

	if (this.total && this.counter >= this.total) {
		killSprite(this, undefined, game);
	}
}



function RandomNPC(gamejs, pos, size, args) {
	args.speed = args.speed || 1;
	args.is_stochastic = args.is_stochastic || true;
	VGDLSprite.call(this, gamejs, pos, size, args);
}
RandomNPC.prototype = Object.create(VGDLSprite.prototype);

RandomNPC.prototype.update = function (game) {
	VGDLSprite.prototype.update.call(this, game);
	this.direction = this.gamejs.math.random.choose(BASEDIRS);
	this.physics.activeMovement(this, this.direction);
}



function OrientedSprite(gamejs, pos, size, args) {
	this.draw_arrow = false;
	this.orientation = RIGHT;
	VGDLSprite.call(this, gamejs, pos, size, args);	
}	
OrientedSprite.prototype = Object.create(VGDLSprite.prototype);

OrientedSprite.prototype._draw = function (game) {
	VGDLSprite.prototype._draw.call(this, game);
	if (this.draw_arrow) {
		var col = (self.color[0], 255 - this.color[1], this.color[2]);
		this.gamejs.draw.polygon(game.screen, col, triPoints(this.rect, unitVector(this.orientation)))
	}
}


function Conveyer(gamejs, pos, size, args) {
	this.is_static = true;
	this.color = BLUE;
	this.strength = 1;
	this.draw_arrow = true;
	OrientedSprite.call(this, gamejs, pos, size, args);
}
Conveyer.prototype = Object.create(OrientedSprite.prototype);



function Missile(gamejs, pos, size, args) {
	this.speed = 1;
	this.color = PURPLE;
	OrientedSprite.call(this, gamejs, pos, size, args);
}
Missile.prototype = Object.create(OrientedSprite.prototype);



function Switch(gamejs, pos, size, args) {
	OrientedSprite.call(this, gamejs, pos, size, args);
}
Switch.prototype = Object.create(OrientedSprite.prototype);



function OrientedFlicker(gamejs, pos, size, args) {
	// These two functions called in sequence probably overwrite one another
	this.draw_arrow = true;
	this.speed = 0;
	OrientedSprite.call(this, gamejs, pos, size, args);
	Flicker.call(this, gamejs, pos, size, args);
}
OrientedFlicker.prototype = Object.create(Flicker.prototype);
OrientedFlicker.prototype._draw = OrientedSprite.prototype._draw;
OrientedFlicker.prototype._drawResources = function () {};
OrientedFlicker.prototype._updatePos = function () {};

function Walker(gamejs, pos, size, args) {
	Missile.call(this, gamejs, pos, size, args);
	this.airsteering = false;
	this.is_stochastic = true;
}
Walker.prototype = Object.create(Missile.prototype);

Walker.prototype.update = function (game) {
	if (this.airsteering || this.lastdirection()[0] == 0) {
		if (this.orientation[0] > 0)
			var d = 1;
		else if (this.orientation[0] < 0)
			var d = -1;
		else 
			var d = this.gamejs.random.choice([-1, 1]);
		this.physics.activeMovement(this, [d, 0]);
	}
	Missile.prototype.update.call(this, game);
}



function WalkJumper(gamejs, pos, size, args) {
	this.prob = 0.1;
	this.strength = 10;	
	Walker.call(this, gamejs, pos, size, args);
}
WalkJumper.prototype = Object.create(Walker.prototype);

WalkJumper.prototype.update = function (game) {
	if (this.lastdirection()[0] == 0) {
		if (this.prob < random.random()) 
			this.physics.activeMovement(this, (0, -this.strength));
	}
	Walker.prototype.update.call(this, game);
}



function RandomInertial(gamejs, pos, size, args) {
	this.physicstype = ContinuousPhysics;
	OrientedSprite.call(this, gamejs, pos, size, args);
	RandomNPC.call(this, gamejs, pos, size, args);
}
RandomInertial.prototype = Object.create(RandomNPC.prototype);
RandomInertial.prototype._draw = OrientedSprite.prototype._draw;


function RandomMissile(gamejs, pos, size, args) {
	Missile.call(this, gamejs, pos, size, args);
}
RandomMissile.prototype = Object.create(Missile.prototype);



function EraticMissile(gamejs, pos, size, args) {
	this.prob = prob;
	this.is_stochastic = (prob > 0 && prob < 1);
	Missile.call(this, gamejs, pos, size, args);
}
EraticMissile.prototype = Object.create(Missile.prototype);

EraticMissile.prototype.update = function (game) {
	Missile.prototype.update.call(this, game);
	if (this.gamejs.random.random() < this.prob)
		this.orientation = gamejs.random.choice(BASEDIRS);
}



function Bomber(gamejs, pos, size, args) {
	args.color = args.color || ORANGE;
	args.is_static = args.is_static || false;
	SpawnPoint.call(this, gamejs, pos, size, args);
	Missile.call(this, gamejs, pos, size, args);
}
Bomber.prototype = Object.create(Missile.prototype);

Bomber.prototype.update = function (game) {

	Missile.prototype.update.call(this, game);
	SpawnPoint.prototype.update.call(this, game);
}

function Chaser(gamejs, pos, size, args) {
	this.stype = null;
	this.fleeing = false;
	RandomNPC.call(this, gamejs, pos, size, args);
}
Chaser.prototype = Object.create(RandomNPC.prototype);

Chaser.prototype._closestTargets = function (game) {
	var bestd = 1e100;
	var res = [];
	var that = this;
	// console.log(this.stype);
	// console.log(game.getSprites(this.stype).map(s => {return s.name}));
	game.getSprites(this.stype).forEach(target => {
		var d = that.physics.distance(that.rect, target.rect);
		// console.log(d)
		if (d < bestd) {
			bestd = d;
			res = [target];
		} else if (d == bestd) {
			res.push(target);
		}
	});
	// console.log(res)
	return res;
}

Chaser.prototype._movesToward = function(game, target) {
	var res = [];
	var basedist = this.physics.distance(this.rect, target.rect);
	var that = this;
	BASEDIRS.forEach(a => {
		// console.log(a)
		var r = that.rect.copy();
		r = r.move(a.map(function (v) {return 2*v}));
		var newdist = that.physics.distance(r, target.rect);
		// console.log(a, basedist,  newdist);
		if (that.fleeing && basedist < newdist) {
			res.push(a);
		}
		if (!(that.fleeing) && basedist > newdist){
			res.push(a);
		}

	});
	return res;
}

Chaser.prototype.update = function (game) {
	VGDLSprite.prototype.update.call(this, game);

	options = [];
	position_options = {};
	var that = this;
	this._closestTargets(game).forEach(target => {
		options = options.concat(that._movesToward(game, target));
	});
	if (options.length == 0) {
		options = BASEDIRS;
	}
	this.physics.activeMovement(this, options.randomElement());
}

function Fleeing(gamejs, pos, size, args) {
	Chaser.call(this, gamejs, pos, size, args);
	this.fleeing = true;
}
Fleeing.prototype = Object.create(Chaser.prototype);



function AStarChaser(gamejs, pos, size, args) {
	this.stype = null;
	this.fleeing = false;
	this.drawpath = null;
	this.walableTiles = null;
	this.neighborNodes =null;
	RandomNPC.call(this, gamejs, pos, size, args);
}
AStarChaser.prototype = Object.create(RandomNPC.prototype);

AStarChaser.prototype._movesToward = function (game, target) {
	var res = [];
	var basedist = this.physics.distance(this.rect, target.rect);
	var that = this;
	BASEDIRS.forEach(a => {
		var r = that.rect.copy();
		r = r.move(a);
		var newdist = that.physics.distance(r, target.rect);
		if (that.fleeing && basedist < newdist)
			res.push(a);
		if (!(that.fleeing && basedist > newdist))
			res.push(a);
	});
	return res;
}

AStarChaser.prototype._draw = function (game) {
	RandomNPC.prototype._draw.call(this, game);
	if (this.walableTiles) {
		var col = this.gamejs.Color(0, 0, 255, 100);
		var that = this;
		this.walableTiles.forEach(sprite => {
			that.gamejs.draw.rect(game.screen, col, sprite.rect);
		});
	}

	if (this.neighborNodes) {
		var col = this.gamejs.Color(0, 255, 255, 80);
		var that = this;
		this.neighborNodes.forEach(node => {
			that.gamejs.draw.rect(game.screen, col, node.sprite.rect);
		})
	}

	if (this.drawpath) {
		var col = this.gamejs.Color(0, 255, 0, 120);
		var that = this;
		this.drawpath.slice(1, -1).forEach(sprite => {
			that.gamejs.draw.rect(game.screen, col, sprite.rect);
		});
	}
}


AStarChaser.prototype._setDebugVariables = function (world, path) {
	var path_sprites = path.map(node => {return node.sprite});

	this.walableTiles = world.get_walkable_tiles();
	this.neighborNodes = world.neighbor_nodes_of_sprite(this);
	this.drawpath = path_sprits;
}

AStarChaser.prototype.update = function (game) {
	VGDLSprite.prototype.update.call(this, game);
}