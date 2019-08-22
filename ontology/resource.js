var Resource = function (gamejs, pos, size, args) {
	var that = this;
	VGDLSprite.call(this, gamejs, pos, size, args);
	this.value = args.value || 1;
	this.limit = args.limit || 2;
	this.res_type = args.res_type || null;
	// console.log(this.rect);
	// return that
}
Resource.prototype = Object.create(VGDLSprite.prototype);

Resource.prototype.resourceType = function () {
		if (this.res_typ == null)
			return this.name;
		else
			return this.res_type;
}



function ResourcePack (gamejs, pos, size, args) {
	Resource.call(this, gamejs, pos, size, args);
	this.is_static = true;
}
ResourcePack.prototype = Object.create(ResourcePack.prototype);

ResourcePack.prototype = Object.create(Resource.prototype);

