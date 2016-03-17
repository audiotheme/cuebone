var Player,
	$ = require( 'jquery' ),
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' );

// @todo Watch for remove events.

Player = Backbone.Model.extend({
	defaults: {
		id: null,
		player: null
	},

	initialize: function( attributes, options ) {
		var player = this.get( 'player' );
		this.events = options.events;
		player.on( $.jPlayer.event.play, _.bind( this.onPlay, this ) );
	},

	pause: function() {
		this.get( 'player' ).jPlayer( 'pause' );
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
	var jPlayerInit,
		self = this;

	if ( ! _.isFunction( $.jPlayer ) ) {
		return;
	}

	// Proxies the jPlayer init method to automatically register players
	// created after initialization.
	jPlayerInit = $.jPlayer.prototype._init;
	$.jPlayer.prototype._init = function() {
		jPlayerInit.apply( this, arguments );
		self.register( this.internal.instance, this.element );
	};

	// Register players that have already been created.
	this.registerPlayers();
};

Adapter.prototype.registerPlayers = function() {
	if ( ! _.isFunction( $.jPlayer ) ) {
		return;
	}

	_.each( $.jPlayer.prototype.instances, function( player, id ) {
		this.register( id, player );
	}, this );
};

Adapter.prototype.register = function( id, player ) {
	var model = new this.model({
		id: id,
		player: player
	}, {
		events: this.events
	});

	this.collection.add( model );
};

module.exports = Adapter;
