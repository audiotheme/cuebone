var Player,
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' ),
	mejs = require( 'mediaelementjs' );

// @todo Watch for remove events.

Player = Backbone.Model.extend({
	defaults: {
		id: null,
		player: null
	},

	initialize: function( attributes, options ) {
		this.events = options.events;
		this.get( 'player' ).$media.on( 'play', _.bind( this.onPlay, this ) );
	},

	pause: function() {
		this.get( 'player' ).pause();
	},

	onPlay: function() {
		this.events.trigger( 'play', this );
	}
});

function Adapter( collection, events ) {
	this.events = events;
	this.collection = collection;
	this.model = Player;

	this.initialize();
}

Adapter.prototype.initialize = function() {
	var mejsPlayerInit,
		self = this;

	if ( _.isUndefined( mejs ) ) {
		return;
	}

	// Proxies the MediaElement.js init method to automatically register players
	// created after initialization.
	mejsPlayerInit = mejs.MediaElementPlayer.prototype.init;
	mejs.MediaElementPlayer.prototype.init = function() {
		mejsPlayerInit.apply( this, arguments );
		self.register( this );
	};

	// Register players that have already been created.
	this.registerPlayers();
};

Adapter.prototype.registerPlayers = function() {
	if ( _.isUndefined( mejs ) ) {
		return;
	}

	_.each( mejs.players, function( player ) {
		this.register( player );
	}, this );
};

Adapter.prototype.register = function( player ) {
	var model = new this.model({
		id: player.id,
		player: player
	}, {
		events: this.events
	});

	this.collection.add( model );
};

module.exports = Adapter;
