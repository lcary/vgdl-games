/**
 * params {**kwargs} any number of arguments which will be used in the game
 */
 // console.log('this is running');
var BasicGame = function (gamejs, args) {
	var that = Object.create(BasicGame.prototype);
	var MAX_SPRITES = 10000;

	that.default_mapping = {'w': ['wall'], 'A': ['avatar']};

	var block_size = 10;
	var load_save_enabled = true;
	var disableContinuousKeyPress = true;
	var image_dir = '../../images/';
	//var real_start_time = 0;
	//var real_time = 0;

	//var _ = require('underscore');

	that.reset = function () {
		that.score = 0;
		that.bonus_score = 0;
		that.real_start_time = 0;
		that.real_time = 0;
		that.time = 0;
		that.ended = false;
		that.num_sprites = 0;
		that.kill_list = [];
		that.all_killed = [];

	}

			//INIT

	//grab all arguments
	that.frame_rate = 20;
	for (arg in args) {
		that[arg] = args[arg];
	}

	that.block_size = block_size*5


	// that.use_images = ['error.png'];
	// contains mappings to constructor (just a few defaults are known)
	that.sprite_constr = {'wall': [Immovable, {'color': DARKGRAY}, ['wall']],
						  'avatar': [MovingAvatar, {}, ['avatar']]};

	// z-level of sprite types (in case of overlap)
	that.sprite_order = ['wall', 'avatar'];

	// contains instance lists
	that.sprite_groups = {};
	// which sprite types (abstract or not) are singletons?
	that.singletons = [];	
	// collision effects (ordered by execution order)
	that.collision_eff = [];


	that.playback_actions = [];
	that.playbacx_index = 0;
	// for reading levels
	that.char_mapping = {};
	// temination criteria
	that.terminations = [new Termination()];
	// conditional criteria
	that.conditions = [];
	// resource properties
	that.resources_limits = new defaultDict(2);
	that.resources_colors = new defaultDict(GOLD);

	that.is_stochastic = false;
	that._lastsaved = null;
	that.win = null;
	that.effectList = []; // list of effects that happened this current time step
	that.spriteDistribution = {};
	that.movement_options = {};
	that.all_objects = null;

	that.lastcollisions = {};
	that.steps = 0;
	that.gameStates = [];
	that.realGameStates = [];
	that.keystate = {}
	that.EOS = new EOS();
	that.sprite_bonus_granted_on_timestep = -1; // to ensure you only grant bonus once per timestep (since you check _isDone() multiple times)
	that.timeout_bonus_granted_on_timestep = -1; // to ensure you only grant bonus once per timestep (since you check _isDone() multiple times)
	that.reset();

	that.buildLevel = function (lstr) {
		var lines = lstr.split('\n').map(l => {return l.trimRight()}).filter(l => {return l.length > 0});
		var lengths = lines.map(function (line) {return line.length});

		console.assert(Math.min.apply(null, lengths) == Math.max.apply(null, lengths), "Inconsistent line lengths");

		that.width = lengths[0];
		that.height = lines.length;

		console.assert(that.width > 1 && that.height > 1, 'Level too small');

		// rescale pixels per block to adapt to the level
		var window_width = window.innerWidth/1.5;
		var window_height = window.innerHeight/2;

		that.block_size =parseInt(Math.min(window_height/that.height, window_width/that.width));
		that.screensize = [that.width*that.block_size, that.height*that.block_size];

		//Set up resources
		for (var res_type in that.sprite_constr) {
		   if (!(that.sprite_constr.hasOwnProperty(res_type))) continue;
			var [sclass, args, _] = that.sprite_constr[res_type];
			if (new sclass(gamejs, 0, 0, args) instanceof Resource) {

				if (args['res_type']) {
					res_type = args['res_type'];
				}
				if (args['color']) {
					that.resources_colors[res_type] = args['color'];
				}
				if (args['limit']) {
					that.resources_limits[res_type] = args['limit'];
				}
			}
			else {
				that.sprite_groups[res_type] = []
			}
		};

		// create sprites
		lines.forEach(function (line, row) {
			for (var col in line) {
				var c = line[col];
				if (c in that.char_mapping) {
					var pos = [col*that.block_size, row*that.block_size];
					that._createSprite(that.char_mapping[c], pos);
				} else if (c in that.default_mapping) {
					var pos = [col*that.block_size, row*that.block_size];
					that._createSprite(that.default_mapping[c], pos);
				}
			}
		});

		that.kill_list = [];

		that.collision_eff.forEach(function (item) {
			var [_, _, effect, _] = item;
			if (stochastic_effects.indexOf(effect) != -1)
				that.is_stochastic = true;
		});
	}

	that.emptyBlocks = function () {
		var alls;//iterate over all the sprites
	}

	that.randomizeAvatar = function () {
		if (that.getAvatars().length == 0)
			that._createSprite(['avatar'], [0, 0]);
	}

	that._createSprite = function (keys, pos) {
		var res = [];
		keys.forEach(function (key) {

			if (that.num_sprites > MAX_SPRITES) {
				console.log('Sprite limit reached.');
				return;
			}
			var [sclass, args, stypes] = that.sprite_constr[key];
			var anyother = false;

			stypes.reverse().forEach(pk => {
				if (that.singletons.contains(pk)){
					if (that.numSprites(pk) > 0) {
						anyother = true;
						return;
					}
				}					
			})
			if (anyother) return;
			args.key = key;
			var s = new sclass(gamejs, pos, [that.block_size, that.block_size], args);
			s.stypes = stypes;

			if (that.sprite_groups[key])
				that.sprite_groups[key].push(s);
			else 
				that.sprite_groups[key] = [s];
			that.num_sprites += 1;
			if (s.is_stochastic)
				that.is_stochastic = true;
			res.push(s);
		});

		return res;

	}

	that._createSprite_cheap = function (key, pos) {
		var [sclass, args, stypes] = that.sprite_constr[key];
		var s = new sclass(gamejs, pos, [that.block_size, that.block_size], args);
		s.stypes = stypes;
		that.sprite_groups[key].push(s);
		that.num_sprites += 1;
		return s;
	}

	that._initScreen = function (size) {
		that.screen = gamejs.display.setMode(size);
		that.background = new gamejs.graphics.Surface(size);
		that.background.fill(LIGHTGRAY);
		that.screen.blit(that.background, [0, 0]);
	}

	that._iterAll = function () {
		if (that.sprite_order[that.sprite_order.length-1] != 'avatar') {
			that.sprite_order.remove('avatar');
			that.sprite_order.push('avatar');
		}
		return that.sprite_order.reduce((base, key) => {
			if (that.sprite_groups[key] == undefined)
				return base;
			return base.concat(that.sprite_groups[key]);
		}, []);
	}

	that.numSprites = function (key) {

		var deleted = that.kill_list.filter(function (s) {return s.stypes[key]}).length;
		if (key in that.sprite_groups) {
			return that.sprite_groups[key].length-deleted;
		}
		else{
			return that._iterAll().filter(s => {return s.stypes.contains(key)}).length - deleted; // Should be __iter__ - deleted
		}

	}

	that.getSprites = function (key) {
		if (that.sprite_groups[key] instanceof Array)
			return that.sprite_groups[key].filter(s => {return that.kill_list.indexOf(s) == -1});
		else
			return that._iterAll().filter(s => {return (s.stypes.contains(key) && that.kill_list.indexOf(s) == -1)});
	}

	that.getAvatars = function () {
		var res = [];
		for (var key in that.sprite_groups) {
		    if (Object.prototype.hasOwnProperty.call(that.sprite_groups, key)) {

		        var ss = that.sprite_groups[key];
		        if (ss && ss[0] instanceof Avatar)
					res.concat(ss.filter(function(s) {return that.kill_list.indexOf(s) == -1}));
		    }
		}

		return res;
	}

	that.ignoredattributes = ['stypes',
                           'name',
                           'lastmove',
                           'color',
                           'lastrect',
                           'resources',
                           'physicstype',
                           'physics',
                           'rect',
                           'alternate_keys',
                           'res_type',
                           'stype',
                           'ammo',
                           'draw_arrow',
                           'shrink_factor',
                           'prob',
                           'is_stochastic',
                           'cooldown',
                           'total',
                           'is_static',
                           'noiseLevel',
                           'angle_diff',
                           'only_active',
                           'airsteering',
                           'strength',
                           'gamejs'
                           ];

	that.getObjects = function () {
		var obj_list = {};
		var fs = that.getFullState();
		var obs = Object.copy(fs['objects']);

		for (obj_type in obs) {
			that.getSprites(obj_type).forEach(function (obj) {
				var features = {'color': colorDict[obj.color.toString()],
				                'row': [obj.rect.top]};
				var type_vector = {'color': colorDict[obj.color.toString()],
				                   'row': [obj.rect.top]};
				var sprite = obj;
				obj_list[obj.ID] = {'sprite': sprite, 
									   'position': [obj.rect.left, obj.rect.top],
									   'features': features,
									   'type': type_vector};
			});
		};

		return obj_list;
	}

	that.getFirstState = function () {
		var ias = that.ignoredattributes;
		var obs = {};
		var killed = {};
		var actions = Object.keys(that.keystate).filter(key => {
			return that.keystate[key]
		})
		that.steps += actions.length;
		for (key in that.sprite_groups) {
			if (!(that.sprite_groups.hasOwnProperty(key))) break;
			var ss = {};
			that.getSprites(key).forEach(function (s) {

				var attrs = {};
				Object.keys(s).forEach(function (a) {	
					var val = s[a];
					if (ias.indexOf(a) == -1) {
						attrs[a] = val;
					}
				});
				if (s.resources) {
					attrs['resources'] = s.resources; // Should be object
				}

				ss[s.ID] = Object.copy(attrs)
			});
			obs[key] = Object.copy(ss);
		};
		
		object_cur = Object.copy(obs);
		object_data = Object.copy(obs);

		function notEmpty(data) {
 			if(typeof(data) == 'number' || typeof(data) == 'boolean') { 
    			return true; 
  			}
  
  			if(typeof(data) == 'undefined' || data === null) {
    			return false; 
  			}
  
  			if(typeof(data.length) != 'undefined') {
    			return data.length != 0;
  			}
  
  			var count = 0;
  			
  			for(var i in data) {
    			if(data.hasOwnProperty(i)) {
      				count ++;
    			}
  			}
  		
  			return count != 0;
		}

		for (var sprite_type in object_cur) {
			if (sprite_type === 'avatar') {
				//for (instance in object_cur[sprite_type]) {
				//	object_data[sprite_type] = {};
				//	object_data[sprite_type][instance] = {};
				//	object_data[sprite_type][instance]['x'] = object_cur[sprite_type][instance]['x'];
				//	object_data[sprite_type][instance]['y'] = object_cur[sprite_type][instance]['y'];
				//	object_data[sprite_type][instance]['resources'] = object_cur[sprite_type][instance]['resources'];
				//	object_data[sprite_type][instance]['direction'] = object_cur[sprite_type][instance]['direction'];
				//}
				//object_data[sprite_type] = object_cur[sprite_type];
				continue;
			}
			// Else sprite type is not 'avatar'
			var sprite_info = object_cur[sprite_type];
			for (var index in sprite_info) {
				var one_sprite = sprite_info[index];
				var updated_info = {};
				if ('resources' in one_sprite) {
					if (notEmpty(one_sprite['resources'])) {
						//Object.keys(one_sprite['resources']).length > 0) {
						updated_info['resources'] = one_sprite['resources'];
						updated_info['x'] = one_sprite['x'];
						updated_info['y'] = one_sprite['y'];
						object_data[sprite_type][index] = updated_info;
					} else {
						updated_info['x'] = one_sprite['x'];
						updated_info['y'] = one_sprite['y'];
						object_data[sprite_type][index] = updated_info;
					}
				} else {
					updated_info['x'] = one_sprite['x'];
					updated_info['y'] = one_sprite['y'];
					object_data[sprite_type][index] = updated_info;
				}
			}
		}


		return {'frame': that.time,
				'score': that.bonus_score,
				//'bonus_score': that.bonus_score,
				'ended': that.ended,
				'win'  : that.win,
				'objects': object_data,
				//Object.copy(obs),
				'killed': killed,
				'actions': actions,
				'events': that.effectList,
				'real_time': that.real_time,
		};
	}


	that.getFullState = function () {
		var ias = that.ignoredattributes;
		var obs = {};
		var killed = {};
		var actions = Object.keys(that.keystate).filter(key => {
			return that.keystate[key]
		})
		that.steps += actions.length;
		for (key in that.sprite_groups) {
			if (!(that.sprite_groups.hasOwnProperty(key))) break;
			var ss = {};
			that.getSprites(key).forEach(function (s) {

				var attrs = {};
				Object.keys(s).forEach(function (a) {	
					var val = s[a];
					if (ias.indexOf(a) == -1) {
						attrs[a] = val;
					}
				});
				if (s.resources) {
					attrs['resources'] = s.resources; // Should be object
				}

				ss[s.ID] = Object.copy(attrs)
			});
			obs[key] = Object.copy(ss);
		};
		
		object_cur = Object.copy(obs);
		object_data = Object.copy(obs);

		function notEmpty(data) {
 			if(typeof(data) == 'number' || typeof(data) == 'boolean') { 
    			return true; 
  			}
  
  			if(typeof(data) == 'undefined' || data === null) {
    			return false; 
  			}
  
  			if(typeof(data.length) != 'undefined') {
    			return data.length != 0;
  			}
  
  			var count = 0;
  			
  			for(var i in data) {
    			if(data.hasOwnProperty(i)) {
      				count ++;
    			}
  			}
  		
  			return count != 0;
		}

		for (sprite_type in object_cur) {

			if (sprite_type === 'wall') {
				continue;
			}

			if (sprite_type === 'avatar') {
				for (instance in object_cur[sprite_type]) {
					object_data[sprite_type] = {};
					object_data[sprite_type][instance] = {};
					object_data[sprite_type][instance]['x'] = object_cur[sprite_type][instance]['x'];
					object_data[sprite_type][instance]['y'] = object_cur[sprite_type][instance]['y'];
					object_data[sprite_type][instance]['resources'] = object_cur[sprite_type][instance]['resources'];
					object_data[sprite_type][instance]['direction'] = object_cur[sprite_type][instance]['direction'];
				}
				//object_data[sprite_type] = object_cur[sprite_type];
				continue;
			}

			var sprite_info = object_cur[sprite_type];
			for (var index in sprite_info) {
				var updated_info = {};
				var one_sprite = sprite_info[index];
				if ('resources' in one_sprite) {
					if (notEmpty(one_sprite['resources'])) {
						//Object.keys(one_sprite['resources']).length > 0) {
						updated_info['resources'] = one_sprite['resources'];
						updated_info['x'] = one_sprite['x'];
						updated_info['y'] = one_sprite['y'];
						object_data[sprite_type][index] = updated_info;
					} else {
						updated_info['x'] = one_sprite['x'];
						updated_info['y'] = one_sprite['y'];
						object_data[sprite_type][index] = updated_info;
					}
				} else {
					updated_info['x'] = one_sprite['x'];
					updated_info['y'] = one_sprite['y'];
					object_data[sprite_type][index] = updated_info;
				}
			}
		};

		delete object_data["wall"];

		return {'frame': that.time,
				'score': that.bonus_score,
				//'bonus_score': that.bonus_score,
				'ended': that.ended,
				'win'  : that.win,
				'objects': object_cur,
				//object_data
				'killed': killed,
				//Object.copy(obs),
				'actions': actions,
				'events': that.effectList,
				'real_time': that.real_time,
		};
	}

	that.gameStatesDiff = function () {
		var killed = {};
		var obs = {};
		currentGameState = Object.copy(that.getFullState());
		lastGameState = Object.copy(that.realGameStates[that.realGameStates.length-1]);
		newGameState = Object.copy(currentGameState);

		for (var sprite_type in lastGameState['objects']) {

			//if (sprite_type === 'wall') {
			//		continue;
			//}

			// if it is avatar, save everything
			if (sprite_type === 'avatar') {
				obs[sprite_type] = currentGameState['objects'][sprite_type];
			}

			// if this type isn't even in current, must be all killed
			if (!(currentGameState['objects'].hasOwnProperty(sprite_type))) {
				killed[sprite_type] = lastGameState['objects'][sprite_type];
				continue;
			}

			// now current has the type, what about instances? 
			var last_sprite_info = lastGameState['objects'][sprite_type];
			var current_sprite_info = currentGameState['objects'][sprite_type];


			// check if any sprite of this type is gone or altered since last game state
			for (var instance in last_sprite_info) {
				var last_instance_info = last_sprite_info[instance];
				var current_instance_info = current_sprite_info[instance];

				// instance of killed sprite 
				if (!(current_sprite_info.hasOwnProperty(instance))){
					// if this sprite type is not in the set of killed items yet
					if (!(killed.hasOwnProperty(sprite_type))) {
						killed[sprite_type] = {};
						killed[sprite_type][instance] = {};
						killed[sprite_type][instance]['x'] = last_instance_info['x'];
						killed[sprite_type][instance]['y'] = last_instance_info['y'];
					} else {
						killed[sprite_type][instance] = {};
						killed[sprite_type][instance]['x'] = last_instance_info['x'];
						killed[sprite_type][instance]['y'] = last_instance_info['y'];
					}
					continue;
				};

				// if instance not killed, check whether it is changed

				var altered = false;

				for (var key in last_instance_info) {
					//if (key === 'resources') {
					//	continue;
					//}
					var last_key_info = last_instance_info[key];
					var current_key_info = current_instance_info[key];
					if (last_key_info !== current_key_info) {
						altered = true;
					}
				};

				// instance of altered sprite
				if (altered) {
					if (!(obs.hasOwnProperty(sprite_type))){
						obs[sprite_type] = {};
						obs[sprite_type][instance] = current_instance_info;
					} else {
						obs[sprite_type][instance] = current_instance_info;
					}
				};
			};
		};

		// check if new sprites appear here
		for (var sprite_type in currentGameState['objects']) {

			// if the sprite type is new 
			if (!(lastGameState['objects'].hasOwnProperty(sprite_type))) {
				obs[sprite_type] = currentGameState['objects'][sprite_type];
				continue
			}

			// if the sprite is changed
			var last_sprite_info = lastGameState['objects'][sprite_type];
			var current_sprite_info = currentGameState['objects'][sprite_type];

			for (var instance in current_sprite_info) {

				var current_instance_info = current_sprite_info[instance];

				if (!(last_sprite_info.hasOwnProperty(instance))){
					if (!(obs.hasOwnProperty(sprite_type))) {
						obs[sprite_type] = {};
						obs[sprite_type][instance] = current_instance_info;
					} else {
						obs[sprite_type][instance] = current_instance_info;
					}
				}
			}
		};


		return {'frame': currentGameState['frame'],
				'score': that.bonus_score,
				//'bonus_score': currentGameState['bonus_score'],
				'ended': currentGameState['ended'],
				'win'  : currentGameState['win'],
				'objects': obs, 
				'killed': killed,
				//Object.copy(obs),
				'actions': currentGameState['actions'],
				'events': currentGameState['events'],
				'real_time': that.real_time,
		};
	}



	that.setFullState = function (fs, as_string = false) {
		that.reset();
		that.score = fs['score'];
		that.ended = fs['ended'];
		for (var key in fs['objects']) {
			that.sprite_groups[key] = [];
			for (var pos in ss) {
				var attrs = ss[pos];
				if (as_string) 
					var p = eval(pos);
				else
					var p = pos;

				var s = that._createSprite_cheap(key, p);
				for (var attrs in a) {
					var val = attrs[a];
					if (a == 'resources') {
						for (r in val) {
							s.resources[r] = val[r];
						}
					} else 
						s[a] = val;
				}
			}
		}
	}

	that.getFullStateColorized = function (as_string = false) {
		var fs = that.getFullState(as_string = as_string);
		var fs_colorized = deepcopy(fs);
		fs_colorized['objects'] = {};
		for (sprite_name in fs['objects']) {
			var [sclass, args, stypes] = that.sprite_constr[sprite_name];
			try {
				fs_colorized['objects'][colorDict[args['color'].toString()]] = fs['objects'][sprite_name];
			} catch (e) {
				var sprite_type = [];
				if (stypes[0] in that.sprite_groups) 
					sprite_type = that.sprite_groups[stypes[0]];
				
				if (sprite_type.length > 0) {
					var sprite_rep = sprite_type[0];
					fs_colorized['objects'][colorDict[sprite_rep.color.toString()]] = fs['objects'][sprite_name];
				}
			}
		}

		return fs_colorized;
	}

	that._clearAll = function (onscreen = true) {

		that.kill_list.forEach(function (s) {
			that.all_killed.push(s);
			if (onscreen) {
				// s._clear(that.screen, that.background, double = true);
			}
			// delete that.sprite_groups[s.name][s];
			that.sprite_groups[s.name].remove(s);
		});

		if (onscreen)
			that._iterAll().forEach(s =>  {
				// s._clear(that.screen, that.background);
			})
		that.kill_list = [];
	}


	that._drawAll = function () {

		that._iterAll().forEach(s => {
			try {	
				if (!(s.crashed))
					s._draw(that);
			} catch (err) {
				if ((!s.crashed)) {
				console.log('cannot draw', s.name);
				console.log(err)
				s.crashed = true
				}
			}
		})
	}

	that._updateAll = function () {
		that._iterAll().forEach(sprite => {
			try {
				if (!(sprite.crashed))
					sprite.update(that);
			} catch (err) {
				if ((!sprite.crashed)) {
					console.log('could not update', sprite.name)
					console.log(err);
					sprite.crashed = true;
				}
				
			}
			})

	}

	that._updateCollisionDict = function (changedsprite) {
		for (key in changedsprite.stypes) {
			if (key in that.lastcollisions)
				delete that.lastcollisions[key];
		}
	}

	that._terminationHandling = function () {
		var break_loop = false
		that.terminations.forEach(t => {
			//if (break_loop) return;
			if (break_loop) return;
			var [ended, win] = t.isDone(that);

			that.ended = ended;
			if (that.ended) {
				if (win) {
					//if (that.score <= 0)
					//that.score += 1;
					that.win = true;
				} else {
					//that.score -= 1;
					that.win = false;
				}
				break_loop = true;
			}
			//var [ended, win] = t.isDone(that);
		});
	}


	that._getAllSpriteGroups = function () {
		var lastcollisions = {};

		that.collision_eff.forEach(function (eff) {
			var [class1, class2, effect, kwargs] = eff;
	
			[class1, class2].forEach(function (sprite_class) {
				if (!(sprite_class in lastcollisions)) {
					var sprite_array = [];
					if (sprite_class in that.sprite_groups) {
						var sprite_array = that.sprite_groups[sprite_class].slice();
					} else {

						var sprites_array = [];;
						Object.keys(that.sprite_groups).forEach(key => {

							var sprites = that.sprite_groups[key].slice();	
							if (sprites.length && sprites[0].stypes.contains(sprite_class)) {
								sprite_array = sprite_array.concat(sprites);
							}
							
						})
					}
					lastcollisions[sprite_class] = sprite_array;
				}
			})
		})	
		return Object.assign(lastcollisions, that.sprite_groups);
	}

	that._multi_effect = function () {
	  function r (sprite, partner, game, kwargs) {
	  	  var value;
		  for (var i = 0; i < arguments.length; i++) {
		    value = arguments[i](sprite, partner, game, kwargs)
		  }
		  return value;
		}
	  return r;
	}

	that._eventHandling = function () {

		that.effectList = [];

		var push_effect = 'bounceForward';
		var back_effect = 'stepBack';

		// list of objects sets
		var force_collisions = [];

		// object sets
		var new_collisions = {0: 0};
		var collisions = {};

		var new_effects = [];

		// make a copy of the kill list
		var dead = that.kill_list.slice();
		var loop = 0 // Simply to prevent infinitely looping
		while (Object.keys(new_collisions).length && loop < 7) {
			loop ++;
			if (loop > 5) {
				console.log('resolving too many collisions');
			}
			
			new_collisions = {};
			new_effects = [];

			// update collision sprites
			that.lastcollisions = that._getAllSpriteGroups();

			that.collision_eff.forEach(function (eff) {
				var [class1, class2, effect, kwargs] = eff;

				// Special cases
				if (class2 == 'EOS') {
					var ss1 = that.lastcollisions[class1];
					ss1.forEach(function (s1) {
						if (!(new gamejs.Rect([0, 0], that.screensize).collideRect(s1.rect))) {
							var e = effect(s1, that.EOS, that, kwargs);
							if (e != null) {
								that.effectList.push(e);
							}
						}
					});

					return;
				}

				var sprite_array1 = that.lastcollisions[class1];
				var sprite_array2 = that.lastcollisions[class2];

				

				var score = 0;
				if ('scoreChange' in kwargs) {
					kwargs = Object.assign({}, kwargs);
					kwargs.score = kwargs['scoreChange'];
					var effect = that._multi_effect(effect, scoreChange)
					delete kwargs['scoreChange'];
				}
				var dim = null;
				if ('dim' in kwargs) {
					kwargs = Object.assign({}, kwargs);
					dim = kwargs['dim'];
					delete kwargs['dim'];
				}

				sprite_array1.forEach(sprite1 => {
					var rects = sprite_array2.map(os => {return os.rect});
					if (sprite1.rect.collidelistall(rects) == -1) return ;
					sprite1.rect.collidelistall(rects).forEach(function (ci) {
						var sprite2 = sprite_array2[ci];
						if (sprite1 == sprite2
							|| dead.contains(sprite1) 
							|| dead.contains(sprite2)
							|| (sprite1 in collisions
								&& collisions[sprite1].contains(sprite2))) {
							return;
						}

						// update new collision set
						if (sprite1 in new_collisions) {
							new_collisions[sprite1].push(sprite2)
						}
						else {
							new_collisions[sprite1] = [sprite2]
						}


						if (score > 0) 
							that.score += score;
							that.bonus_score += score;

						if ('applyto' in kwargs) {
							var stype = kwargs['applyto'];

							var kwargs_use = deepcopy(kwargs);
							delete kwargs_use['applyto'];
							that.getSprites(stype).forEach(function (sC) {
								var e = effect(sC, sprite1, self, kwargs_use);
							});
							that.effectList.push(e);
							return;
						}
					

						if (dim) {
							var sprites = that.getSprites(class1);
							var spritesFiltered = sprites.filter(function (sprite) {
								return sprite[dim] == sprite2[dim];
							});

							spritesFiltered.forEach(function (sC) {
								if (!(sprite1 in dead)) {

									var e = effect(sprite1, sC, that, kwargs);
								}
								that.effectList.push(e);
								return;
							});
						}

						if (effect.name == 'changeResource') {
							var resource = kwargs['resource'];
							var [sclass, args, stypes] = that.sprite_constr[resource];
							var resource_color = args['color'];
							new_effects.push(effect(sprite1, sprite2, resource_color, that, kwargs));
						} else if (effect.name == 'transformTo') {
							new_effects.push(effect(sprite1, sprite2,that, kwargs));
							var new_sprite = that.getSprites(kwargs['stype'])[-1]
							new_collisions[sprite1].push(new_sprite);
							dead.push(sprite1)

						} else if (effect.name == push_effect) {
							var contained = false;
							if (force_collisions.length) {
								force_collisions.forEach(collision_set => {
									if (collision_set.contains(sprite2)) {
										collision_set.push(sprite1)
										contained = true;
									}
								})
							}
							if (!(contained)) {
								force_collisions.push([sprite1, sprite2]);
							}
							new_effects.push(effect(sprite1, sprite2, that, kwargs));
						} else if (effect.name == back_effect) {
							var contained = false;

							if (force_collisions.length) {
								force_collisions.forEach(collision_set => {
									if (collision_set.contains(sprite1)) {
										collision_set.forEach(sprite => {
											new_effects.push(effect(sprite, sprite2, that, kwargs));
										})
										contained = true;
									}
								})
							}
							if (!(contained)) {
								new_effects.push(effect(sprite1, sprite2, that, kwargs));
							}
						} else {
							new_effects.push(effect(sprite1, sprite2, that, kwargs));
						}
						
					});
				});
			});
			that.effectList = that.effectList.concat(new_effects);
			Object.keys(new_collisions).forEach(collision_sprite => {
				if (collision_sprite in collisions)
					collisions = collisions[collision_sprite].concat(new_collisions[collision_sprite])
				else
					collisions[collision_sprite] = new_collisions[collision_sprite]
			})
		}
		return that.effectList;
	}


	that.run = function (on_game_end) {
		if (that.images.length) {
			that.images.forEach(image => {
				gamejs.preload(that.images.map(image => {return image_dir + image}))
			})			
		}
		that.on_game_end = on_game_end;
		return that.startGame;
	}

	that.startGame = function () {
		that._initScreen(that.screensize);
		// gamejs.display.flip();

		if (that.images) {
			that.image_dict = {}
			that.images.forEach(image => {
				try {
					that.image_dict[image] = gamejs.image.load(image_dir + image);
				} catch (err) {
					that.image_dict[image] = gamejs.image.load(image_dir + 'error.png');	
					console.log(`could not load imag {image_dir}{image}`, err)
				}
			})
		}


		that.reset();
		// var clock = gamejs.time.Clock();
		// if (that.playback_actions)
		// 		that.frame_rate = 5;
		
		var win = false;
		var i = 0;

		var lastKeyPress = [0, 0, 1];
		var lastKeyPressTime = 0;

		// var f = stypes
		// m = re.search('[A-Za-z0-9+)\.py', f)?
		
		// var name = m.group(1);
		var gamelog = "";

		// -------------- Game-play ----------------
		// from ontology import Immovable, Passive, Resource, ResourcePack, RandomNPC, Chaser, AStarChaser, OrientedSprite, Missile
  		// from ontology import initializeDistribution, updateDistribution, updateOptions, sampleFromDistribution
		// import things
		var finalEventList = [];
		var agentStatePrev = [];
		var agentState = {};

		// that.getAvatars()[0].resources.forEach(function (resource) {
		// 	agentState[resource[0]] = resource[1];
		// })
		var keyPressPrev = null;

		//Prep for Sprite Induction 
		var sprite_types = [Immovable
							// Passive, 
							// Resource, 
							// ResourcePack, 
							// RandomNPC, 
							// Chaser, 
							// AstarChaser, 
							// OrintedSprite, 
							// Missile
							];
		that.all_objects = that.getObjects(); // Save all objects, some which may be killed in game

		// figure out keypress type

		// disableContinuousKeyPress = Object.keys(that.all_objects).every(function (k) {
		// 	return that.all_objects[k]['sprite'].physicstype.__name__ == 'GridPhysics';
		// });
		// console.log(disableContinuousKeyPress)


		var objects = that.getObjects();
		that.spriteDistribution = {};
		that.movement_options = {};
		Object.keys(objects).forEach(function (sprite) {
			that.spriteDistribution[sprite] = initializeDistribution(sprite_types);
			that.movement_options[sprite] = {"OTHER": {}};
			sprite_types.forEach(function (sprite_type) {
				that.movement_options[sprite][sprite_type] = {};
			})
		});

		// This should actually be in a game loop function, or something.
		
	
		that.time = 0;

		// that._clearAll();

		var objects = that.getObjects();
		Object.keys(objects).forEach(function (sprite_number) {
			var sprite = objects[sprite_number];
			if (!(that.spriteDistribution in sprite)) {
				that.all_objects[sprite] = objects[sprite];
				that.spriteDistribution[sprite] = initializeDistribution(sprite_types);
				that.movement_options[sprite] = {"OTHER": {}};
				sprite_types.forEach(function (sprite_type) {
					that.movement_options[sprite][sprite_type] = {};
				})
			}
		});

		that.keystate = {};
		that.keywait = {};
		// disableContinuousKeyPress = false;

		gamejs.event.onKeyDown (event => {
			if (!(that.keywait[event.key])) 
				that.keystate[event.key] = true;
			
		});

		gamejs.event.onKeyUp (event => {
			that.keystate[event.key] = false;
			that.keywait[event.key] = false;
		})

		// Main Game Loop
		var pre_time = new Date().getTime();
		var new_time = 0;
		var mpf = 1000/that.frame_rate;

		that.background.fill(LIGHTGRAY);
		that.screen.blit(that.background, [0, 0]);
		that._drawAll();

		// that.collision_eff.sort((a, b) => {
		// 	return (a[2].name == 'killSprite')
		// }).reverse();


		
		gamejs.onTick(function () {

			if (that.paused) return;

			if (that.ended) {
				if (that.win) {
					$('#score-value').text(that.bonus_score);
					that.real_start_time = 0;
				} else {
					$('#score-value').text(that.score);
					that.real_start_time = 0;
				}
				//that.gameStates.push(that.gameStatesDiff());
				that.on_game_end();
				return
			};



			// console.log(that.kill_list);

			new_time = new Date().getTime();
			ms = (new_time - pre_time);

			if (ms < mpf) return;

			pre_time = new_time;

			$('#score-value').text(that.score);

			that._terminationHandling();
			that._eventHandling();

			// that.background.fill(LIGHTGRAY);
			that.background.fill(LIGHTGRAY);
			that.screen.blit(that.background, [0, 0]);
			that._clearAll();
			that._drawAll();
			that._updateAll();

			if (that.time == 0) {
				that.real_start_time = Date.now();
				that.real_time = 0;
				that.realGameStates.push(that.getFirstState());	
				that.gameStates.push(that.getFirstState());
			} else {
				that.real_time = Date.now() - that.real_start_time;
				//that.gameStates.push(that.getFullState());
				that.gameStates.push(that.gameStatesDiff());
				that.realGameStates.push(that.getFullState());
			}

			that.time ++;

			// Discontinuous key press
			// console.log(that.getFullState())
			if (disableContinuousKeyPress) {
				Object.keys(that.keystate).forEach(key => {
					if (that.keystate[key]) {
						that.keystate[key] = false;
						that.keywait[key] = true;
					}
				});
			}

		})

		
	}


	that.getPossibleActions = function () {
		that.getAvatars()[0].declare_possible_actions();
	}

	that.tick = function (action) {

	}

	return that;
}

try {module.exports = BasicGame}
catch (e) {};
