var _ = require( 'underscore' ),
	Backbone = require( 'backbone' ),
	cuebone = {},
	JPlayerAdapter = require( './src/adapters/jplayer' ),
	MediaElementJsAdapter = require( './src/adapters/mediaelementjs' );

_.extend( cuebone, {
	players: {},
	collection: {},
	controller: {},
	model: {}
});

cuebone.Events = _.extend({}, Backbone.Events );

cuebone.controller.Mediator = require( './src/controllers/mediator' );
cuebone.controller.Player = require( './src/controllers/player.js' );
cuebone.model.Track = require( './src/models/track.js' );
cuebone.collection.Tracks = require( './src/collections/tracks.js' );

cuebone.players = new cuebone.controller.Mediator([], {
	events: cuebone.Events
});

cuebone.players.jplayer = new JPlayerAdapter( cuebone.players, cuebone.Events );
cuebone.players.mediaelementjs = new MediaElementJsAdapter( cuebone.players, cuebone.Events );

module.exports = cuebone;
