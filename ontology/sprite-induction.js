var initializeDistribution = function (sprite_types) {
	var catch_all_prior = .000001;
	initial_distribution = {"OTHER": catch_all_prior};

	sprite_types.forEach(sprite_type => {
		initial_distribution[sprite_type] = (1.0-catch_all_prior)/(sprite_types.length);
	});
	return initial_distribution;
}

// var spriteInduction = function (game, step) {
//     var sprite_types = [Immovable
//     //, Passive, Resource, ResourcePack, RandomNPC, Chaser, AStarChaser, OrientedSprite, Missile
//     ]

//     if (step == 0) {
//     // Prep for sprite induction

//         game.getObjects.forEach(sprite => {
//             game.spriteDistribution[sprite] = initializeDistribution(sprite_types) // Indexed by object ID
//             game.movement_options[sprite] = {"OTHER":{}}
//             for sprite_type in sprite_types:
//                 game.movement_options[sprite][sprite_type] = {}
//         }
//     }

//     else if (step == 1) {

//         // Sprite Induction Part 1:
//         // every time you act, make sure there aren't new object
//         // if there are, update spriteDistribution etc.
//         objects = game.getObjects()
//         for sprite in objects:
//             if sprite not in game.spriteDistribution:
//                 game.all_objects[sprite] = objects[sprite]
//                 game.spriteDistribution[sprite] = initializeDistribution(sprite_types) // Indexed by object ID
//                 game.movement_options[sprite] = {"OTHER":{}}
//                 for sprite_type in sprite_types:
//                     game.movement_options[sprite][sprite_type] = {}
//     }

//     else if (step == 2) {
//         // See the update options for each sprite type the sprite could be
//         objects = game.getObjects()
//         game = game                                               // Save game state
//         for sprite in game.spriteDistribution.keys():                  // Keys are the IDs of the game objects
//             for sprite_type in game.spriteDistribution[sprite].keys(): // Check each potential sprite type                    
//                 if game.spriteDistribution[sprite][sprite_type] > 0 and sprite in objects.keys():    // Make sure sprite_type is an option for sprite, and sprite is not killed
//                     sprite_obj = objects[sprite]["sprite"]

//                     // Get potential next positions for sprite if it were that sprite type
//                     // TODO: Implement Avatar updateOptions function (if desired)
//                     if sprite_obj.name != 'avatar':
//                         game.movement_options[sprite][sprite_type] = updateOptions(game, sprite_type, sprite_obj) 
//                         // print sprite_obj.name, sprite_type // For debugging
//                         // print movement_options[sprite][sprite_type]

//         game.collision_objects = set()
//     }
//     elif step==3: // TODO: remember to change all instances of 2s in function calls to 3s!
//         // Sprite Induction Part 2: Update sprite distribution based on observations
//         objects = game.getObjects()
//         for sprite in game.spriteDistribution.keys():        // Keys are the IDs of the game objects
//             if sprite in objects.keys():                // Sprite may have been killed
//                 sprite_obj = objects[sprite]["sprite"] 

//                 if sprite not in game.collision_objects and sprite_obj.name != 'avatar':

//                     outcome = objects[sprite]["position"]
//                     game.spriteDistribution = updateDistribution(sprite, game.spriteDistribution, game.movement_options, outcome)
// }