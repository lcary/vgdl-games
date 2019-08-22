var VGDLSprite = VGDLSprite || require('./vgdl-sprite.js').VGDLSprite;
var tools_module = Tools || require('../tools.js');

var Avatar = function (gamejs) {
	this.gamejs = gamejs;
	this.actions = this.declare_possible_actions();
	this.shrinkfactor = 0.15;
}

var MovingAvatar = function (gamejs, pos, size, args) {
	args.color = args.color || WHITE;
	this.speed = 1;
	this.is_avatar = true;
	this.alternate_keys = false;
	VGDLSprite.call(this, gamejs, pos, size, args);
	Avatar.call(this, gamejs);
}
MovingAvatar.prototype = Object.create(VGDLSprite.prototype);

MovingAvatar.prototype.declare_possible_actions = function () {
	var event = this.gamejs.event;
	var actions = {};
    actions["UP"] = event.K_UP;
    actions["DOWN"] = event.K_DOWN;
    actions["LEFT"] = event.K_LEFT;
    actions["RIGHT"] = event.K_RIGHT;
    return actions;
}

MovingAvatar.prototype._readMultiActions = function (game) {
	var event = this.gamejs.event;
	var [UP, LEFT, DOWN, RIGHT] = BASEDIRS;
	res = [];
	// console.log('reading actions');
	if (this.alternate_keys) {
		if (game.keystate[event.K_d]) res.push(RIGHT);
		else if (game.keystate[event.K_a]) res.push(LEFT);
		if (game.keystate[event.K_w]) res.push(UP);
		else if (game.keystate[event.K_s]) res.push(DOWN);
	} else {
		if (game.keystate[event.K_RIGHT]) res.push(RIGHT);
		else if (game.keystate[event.K_LEFT]) res.push(LEFT);
		if (game.keystate[event.K_UP]) res.push(UP);
		else if (game.keystate[event.K_DOWN]) res.push(DOWN);
	}
	// console.log(res);
	return res;
}

MovingAvatar.prototype._readAction = function (game) {
	var actions = this._readMultiActions(game);
	// console.log('actions read', actions);
	if (actions.length)
		return actions[0];
	else
		return null;
}

MovingAvatar.prototype.update = function (game) {
	VGDLSprite.prototype.update.call(this, game);
	var action = this._readAction(game);
	// console.log(action);
	// console.log(this.physics);
	if (action)
		this.physics.activeMovement(this, action, this.speed);
}


var HorizontalAvatar = function (gamejs, pos, size, args) {
	MovingAvatar.call(this, gamejs, pos, size, args);
}
HorizontalAvatar.prototype = Object.create(MovingAvatar.prototype);

HorizontalAvatar.prototype.declare_possible_actions = function () {
	var event = this.gamejs.event;
	var actions = {};
	actions['LEFT'] = event.K_LEFT;
	actions['RIGHT'] = event.K_RIGHT;
	return actions;
}

HorizontalAvatar.prototype.update = function (game) {
	VGDLSprite.prototype.update.call(this, game);
	var action = this._readAction(game);
	// console.log(this.physics.activeMovement);
	if (action == RIGHT || action == LEFT) {
		this.physics.activeMovement(this, action);
	}
}

var VerticalAvatar = function (gamejs) {
	MovingAvatar.call(this, gamejs);
}
VerticalAvatar.prototype = Object.create(MovingAvatar.prototype);

VerticalAvatar.prototype.declare_possible_actions = function () {
	var event = this.gamejs.event;
    actions = {}
    actions["UP"] = event.K_UP
    actions["DOWN"] = event.K_DOWN
    return actions
}

VerticalAvatar.prototype.update = function () {
	VGDLSprite.prototype.update.call(this, game);
	var action = this._readAction(game);
	if (action == UP || action == DOWN)
		this.physics.activeMovement(this, action)
}
/**
 *
 *
 *
 **/
var FlakAvatar = function (gamejs, pos, size, args) {
	args.color = args.color || GREEN;
	SpriteProducer.call(this, gamejs, pos, size, args);
	HorizontalAvatar.call(this, gamejs, pos, size, args);
}
FlakAvatar.prototype = Object.create(HorizontalAvatar.prototype);


FlakAvatar.prototype.declare_possible_actions = function () {
	var actions = HorizontalAvatar.prototype.declare_possible_actions.call(this);
	actions['SPACE'] = this.gamejs.event.K_SPACE;
	return actions;
}

FlakAvatar.prototype.update = function (game) {
	HorizontalAvatar.prototype.update.call(this, game);
	this._shoot(game);
}

FlakAvatar.prototype._shoot = function (game) {
	if (this.stype && game.keystate[this.gamejs.event.K_SPACE]) {
		var spawn = game._createSprite([this.stype], [this.rect.left, this.rect.top]);
	}
}


function OrientedAvatar (gamejs, pos, size, args) {
	args.draw_arrow = args.draw_arrow || true;
	OrientedSprite.call(this, gamejs, pos, size, args);
	MovingAvatar.call(this, gamejs, pos, size, args);
}
OrientedAvatar.prototype = Object.create(MovingAvatar.prototype);
OrientedFlicker.prototype._draw = OrientedSprite.prototype._draw;

OrientedAvatar.prototype.update = function (game) {
	

	var tmp = this.orientation.slice();

	this.orientation = [0, 0];
	VGDLSprite.prototype.update.call(this, game);
	var action = this._readAction(game);
	if (action) 
		this.physics.activeMovement(this, action);
	var d = this.lastdirection();
	if (d[0] != 0 || d[1] != 0) {
		this.orientation = d;
	}
	else {
		this.orientation = tmp;
	}
}

function RotatingAvatar (gamejs, pos, size, args) {
	args.draw_arrow = args.draw_arrow || true;
	this.speed = 0;
	OrientedSprite.call(this, gamejs, pos, size, args);
	MovingAvatar.call(this, gamejs, pos, size, args);
}
RotatingAvatar.prototype = Object.create(MovingAvatar.prototype);
RotatingAvatar.prototype._draw = OrientedSprite.prototype._draw;

RotatingAvatar.prototype.update = function (game) {
	var actions = this._readMultiActions(game);
	if (UP in actions) 
		this.speed = 1;
	else if (DOWN in actions) 
		this.speed = -1;
	if (LEFT in actions){
		var i = BASEDIRS.indexOf(this.orientation);
		this.oriientation = BASEDIRS[(i + 1) % BASEDIRS.length];
	} else if (RIGHT in actions) {
		var i = BASEDIRS.indexOf(this.orientation);
		this.orientation = BASEDIRS[(i - 1) % BASEDIRS.length];
	}
	VGDLSprite.prototype.update.call(this, game);
	this.speed = 0;
}


function RotatingFlippingAvatar (gamejs, pos, size, args) {
	this.noiseLevel = args.noiseLevel || 0;
	RotatingAvatar.call(this, gamejs, pos, size, args);
}
RotatingFlippingAvatar.prototype = Object.create(RotatingAvatar.prototype);

RotatingFlippingAvatar.prototype.update = function (game) {
	    var actions = this._readMultiActions(game)
        if (actions.length > 0 && this.noiseLevel > 0) {
            // pick a random one instead
            if (Math.random() < this.noiseLevel*4)
                actions = [[UP, LEFT, DOWN, RIGHT].randomElement()]
           }
        if (actions.contains(UP))
            this.speed = 1
        else if (actions.contains(DOWN)) {
            var i = BASEDIRS.indexOf(this.orientation)
            this.orientation = BASEDIRS[(i + 2) % BASEDIRS.length]
        }
        else if (actions.contains(LEFT)) {
            var i = BASEDIRS.index(this.orientation)
            this.orientation = BASEDIRS[(i + 1) % BASEDIRS.length]
        }
        else if (actoins.contains(RIGHT)) {
            var i = BASEDIRS.index(this.orientation)
            this.orientation = BASEDIRS[(i - 1) % BASEDIRS.length]
        }
        VGDLSprite.prototype.update.call(this, game)
        this.speed = 0	
}

RotatingFlippingAvatar.prototype.is_stochastic = function () {
	return this.noiseLevel > 0;
}

function NoisyRotatingFlippingAvatar (gamejs, pos, size, args) {
	this.noiseLevel = args.noiseLevel || 0.1;
	RotatingFlippingAvatar.call(this, gamejs, pos, size, args);
}

function ShootAvatar (gamejs, pos, size, args) {
	this.ammo = args.ammo;
	this.stype = args.stype;
	SpriteProducer.call(this, gamejs, pos, size, args);
	OrientedAvatar.call(this, gamejs, pos, size, args);	

}
ShootAvatar.prototype = Object.create(OrientedAvatar.prototype);

ShootAvatar.prototype.update = function (game) {
	OrientedAvatar.prototype.update.call(this, game);
	if (this._hasAmmo()) {
		this._shoot(game);
	}
}

ShootAvatar.prototype._hasAmmo = function (game) {
	// console.log('resources', this.resources)
	if (!(this.ammo))
		return true;
	if (this.ammo in this.resources)
		return this.resources[this.ammo] > 0;
	return false;
}

ShootAvatar.prototype._reduceAmmo = function () {
	if (this.ammo && this.ammo in this.resources)
		this.resources[this.ammo] --;
}

ShootAvatar.prototype._shoot = function (game) {
	var K_SPACE = this.gamejs.event.K_SPACE;
	if (this.stype && game.keystate[K_SPACE]) {
		var u = tools.unitVector(this.orientation);
		// console.log(this.orientation)
		var newones = game._createSprite([this.stype], [this.lastrect.left + u[0] * this.lastrect.size[0],
                                                       this.lastrect.top + u[1] * this.lastrect.size[1]]);
		if (newones.length > 0 && newones[0] instanceof OrientedSprite)
			newones[0].orientation = tools.unitVector(this.orientation);
		this._reduceAmmo();
	}
}