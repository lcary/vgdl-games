var tools = Tools || require('../tools.js');

function GridPhysics () {
}

GridPhysics.prototype = { 
	passiveMovement : function (sprite) {
		if (sprite.speed == null)
			var speed = 1;
		else 
			var speed = sprite.speed;
		if (speed != 0 && 'orientation' in sprite) {
			sprite._updatePos(sprite.orientation, speed * this.gridsize[0]);
		}
	},
	calculatePassiveMovement : function (sprite) {
		if (sprite.speed == null) 
			var speed = 1;
		else
			var speed = sprite.speed;
		if (speed != 0 && 'orientation' in sprite) {
			var orientation = sprite.orientation;
			speed = speed * self.gridsize[0];
			if (!(sprite.cooldown > sprite.lastmove + 1 || Math.abs(orientation[0]) + Math.abs(orientation[1]) == 0)) {
				var pos = sprite.rect.move((orientation[0] * speed, orientation[1]*speed));
				return [pos.left, pos.top];
			}
		} else {
			return null;
		}
	},
	activeMovement : function (sprite, action, speed) {
		// console.log('active movement', speed);
		if (!speed) {
			if (!sprite.speed) 
				var speed = 1.0;
			else
				var speed = sprite.speed;
		}

		if (speed != 0 && action) 
			sprite._updatePos(action, speed * this.gridsize[0]);
	},
	calculateActiveMovement : function (sprite, action, speed = null) {

	},
	distance : function (r1, r2) {
		return (Math.sqrt(Math.pow(r1.top - r2.top, 2)) + Math.sqrt(Math.pow(r1.left - r2.left, 2)));
	}
	// distance : function (r1, r2) {
	// return (Math.abs(r1.top - r2.top) + Math.abs(r1.left - r2.left))
	// }
}

function ContinuousPhysics () {
	GridPhysics.call(this, arguments);
	this.gravity = 0.0;
	this.friction = 0.02;
}
ContinuousPhysics.prototype = Object.create(GridPhysics.prototype);

ContinuousPhysics.prototype = {
	passiveMovement : function (sprite) {

	},

	calculatePassiveMovement : function (sprite) {

	},

	activeMovement : function (sprite, action, speed=null) {

	},

	calculateActiveMovement : function (sprite, action, speed = null) {

	},

	distance : function (r1, r2) {
		return (Math.sqrt(Math.pow(r1.top - r2.top, 2)) + Math.sqrt(Math.pow(r1.left - r2.left, 2)));
	}
};


function NoFrictionPhysics () {
	ContinuousPhysics.call(this, arguments);
	this.friction = 0.0;
}
NoFrictionPhysics.prototype = Object.create(ContinuousPhysics.prototype);

function GravityPhysics () {
	ContinuousPhysics.call(this, arguments);
	this.gravity = 0.8;
}
GravityPhysics.prototype = Object.create(GravityPhysics.prototype);

var PhysicsModule = {GridPhysics : GridPhysics,
					 ContinuousPhysics : ContinuousPhysics};

try {
	module.exports = PhysicsModule;
} catch (e) {
	
}