var Termination = function () {
}

Termination.prototype = {
	isDone : function (game) {

		return [false, null];
	}
}

var Timeout = function (args) {
	this.limit = args.limit;
	this.win = args.win;
	this.name = 'Timeout'; // Added Oct 26th
	if (args.bonus) {
		this.bonus = args.bonus;
	} else {
		this.bonus = 0;
	} 
}
Timeout.prototype = Object.create(Termination.prototype);

Timeout.prototype.isDone = function (game) {
	if (game.time >= this.limit) {
		return [true, this.win];
	}
	else {
		if (game.time >= game.timeout_bonus_granted_on_timestep) {
			//game.score += this.bonus;
			game.bonus_score += this.bonus;
			game.bonus_score = Math.round(game.bonus_score * 100) / 100
			//Math.round(this.bonus * 10) / 10.0;//this.bonus.toFixed(1);
			//game.score = game.score.toFixed(1);
			game.timeout_bonus_granted_on_timestep = game.time;
		}
		return [false, null];
	}
}

var SpriteCounter = function (args) {
	Termination.call(this, args);	
	this.limit = args.limit || 0;
	this.stype = args.stype;
	this.win = args.win;
	this.name = "SpriteCounter";
	if (args.bonus) {
		this.bonus = args.bonus;
	} else {
		this.bonus = 0;
	}
}
SpriteCounter.prototype = Object.create(Termination.prototype);

SpriteCounter.prototype.isDone = function (game) {
	if (game.numSprites(this.stype) <= this.limit) {
		if (game.time > game.sprite_bonus_granted_on_timestep) {
			game.bonus_score += this.bonus;
			game.score += this.bonus;
			//Math.round(this.bonus * 10) / 10.0;
			//game.score = game.score.toFixed(1);
			game.sprite_bonus_granted_on_timestep = game.time;
		}
		console.log(this.stype);
		return [true, this.win];
	}
	else
		return [false, null];
}


var MultiSpriteCounter = function (args) {
	Termination.call(this, args);
	this.limit = args.limit;
	this.win = args.win;
	if (args.bonus) {
		this.bonus = args.bonus;
	} else {
		this.bonus = 0;
	}
	this.name = "MultiSpriteCounter";
	array_args = Object.keys(args);
	this.stypes = array_args.filter(arg => {return arg.includes('stype')}).map(stype => {return args[stype]})
	
}
MultiSpriteCounter.prototype = Object.create(Termination.prototype);

MultiSpriteCounter.prototype.isDone = function (game) {
	if (this.stypes.map(st => {
			return game.numSprites(st)
		}).reduce((s, n) => {
			return s+n
		}, 0) == this.limit) {
		if (game.time > game.sprite_bonus_granted_on_timestep) {
			game.bonus_score += this.bonus;
			game.score += this.bonus;
			//Math.round(this.bonus * 10)/ 10.0;
			//game.score = game.score.toFixed(1);
			game.sprite_bonus_granted_on_timestep = game.time;
		}
		console.log(this.stypes);
		return [true, this.win];
	}
	else {
		return [false, null];
	}
}
