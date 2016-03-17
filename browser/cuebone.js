/**
 * cuebone.js
 * https://github.com/audiotheme/cuebone
 *
 * @copyright Copyright (c) 2016 AudioTheme, LLC
 * @license MIT
 * @version 0.1.0
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cuebone = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";
var _ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null),
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./src/adapters/jplayer":2,"./src/adapters/mediaelementjs":3,"./src/collections/tracks.js":4,"./src/controllers/mediator":5,"./src/controllers/player.js":6,"./src/models/track.js":7}],2:[function(require,module,exports){
(function (global){
"use strict";
var Player,
	$ = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null),
	_ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){
"use strict";
var Player,
	_ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null),
	mejs = (typeof window !== "undefined" ? window['mejs'] : typeof global !== "undefined" ? global['mejs'] : null);

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (global){
"use strict";
var Tracks,
	$ = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null),
	_ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null),
	Track = require( '../models/track.js' );

Tracks = Backbone.Collection.extend({
	model: Track,

	initialize: function( models, options ) {
		this.options = _.extend({
			id: 'cuebone-default-tracks'
		}, options );
	},

	fetch: function() {
		var tracks,
			deferred = $.Deferred();

		tracks = JSON.parse( localStorage.getItem( this.options.id ) );
		if ( null !== tracks ) {
			this.reset( tracks );
		}

		return deferred.resolve( tracks ).promise();
	},

	save: function() {
		localStorage.setItem( this.options.id, JSON.stringify( this.toJSON() ) );
	}
});

module.exports = Tracks;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../models/track.js":7}],5:[function(require,module,exports){
(function (global){
"use strict";
/**
 * Players mediator.
 *
 * The collection of players acts as a mediator between all registered media
 * elements on a page to ensure only one is being played at any given time.
 *
 * Aside from cuebone players, support for MediaElement.js and jPlayer is built
 * in. Support for other players can be added by adding a Backbone model that
 * triggers a 'play' event on the main event bus when the player begins playing
 * and defining a 'pause' method to be called when another player starts.
 */

var Mediator,
	_ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null);

Mediator = Backbone.Collection.extend({
	initialize: function( models, options ) {
		this.listenTo( options.events, 'play', this.pauseOthers );
	},

	pauseOthers: function( model ) {
		_.chain( this.models ).without( model ).invoke( 'pause' );
	}
});

module.exports = Mediator;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global){
"use strict";
var Player,
	_ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null),
	instance = 0,
	Tracks = require( '../collections/tracks' );

Player = Backbone.Model.extend({
	defaults: {
		id: null,
		currentTrackIndex: 0,
		loop: false,
		muted: false,
		repeat: false,
		shuffle: false,
		volume: 0.8
	},

	initialize: function( attributes, options ) {
		var ua = window.navigator.userAgent.toLowerCase();

		this.mediaElement = document.createElement( 'audio' );

		this.options = _.extend({
			events: null,
			persist: false,
			tracks: null
		}, options );

		// Set a unique id for this instance if one hasn't been set.
		if ( ! this.get( 'id' ) ) {
			this.set( 'id', 'cuebone-player-' + instance );
			// A static id is needed to persist the player.
			this.options.persist = false;
			instance++;
		}

		// @todo Move this stuff into utils?
		this.isAndroid = ( ua.match( /android/i ) !== null );
		this.isiPad = ( ua.match( /ipad/i ) !== null );
		this.isiPhone = ( ua.match( /iphone/i ) !== null );
		this.isiOS = this.isiPhone || this.isiPad;

		this.current = new Tracks();
		this.tracks = this.options.tracks || new Tracks([{}]);
		delete this.options.tracks;

		// Remember the player state between requests.
		if ( this.options.persist ) {
			this.fetchTracks();
			this.on( 'change', this.save, this );
			this.current.on( 'add change remove reset', this.save, this );
			this.tracks.on( 'add remove reset', this.tracks.save, this.tracks );
		}

		this.listenTo( this.current, 'ended', this.onTrackEnded );

		// Reset the current track index when replacing tracks.
		this.listenTo( this.tracks, 'reset', this.onTracksReset );

		this.fetch();

		return this;
	},

	getCurrentTrack: function() {
		return this.current.first();
	},

	isMuted: function() {
		return !! this.get( 'muted' );
	},

	loadTrack: function( track ) {
		var currentTrack = this.current.first();

		this.pause();

		if ( currentTrack ) {
			currentTrack.set( 'status', 'error' === currentTrack.get( 'status') ? 'error' : 'paused' );
			currentTrack.unload();
		}

		// Update the current track.
		this.set( 'status', 'loading' );
		this.current.reset( track );

		// Re-use the media element between tracks because Android and iOS won't
		// play dynamically created media elements without user interaction.
		track.media = this.mediaElement;

		track.load();
	},

	mute: function() {
		this.current.first().mute();
		this.set( 'muted', true );
		return this;
	},

	nextTrack: function() {
		var nextIndex,
			currentIndex = this.get( 'currentTrackIndex' );

		if ( this.get( 'shuffle' ) ) {
			nextIndex = Math.floor( Math.random() * this.tracks.length );
		} else {
			nextIndex = currentIndex + 1 >= this.tracks.length ? 0 : currentIndex + 1;
		}

		this.setCurrentTrack( nextIndex );

		return this;
	},

	pause: function() {
		if ( this.current.length ) {
			this.current.first().pause();
		}
		return this;
	},

	play: function() {
		this.options.events.trigger( 'play', this );
		this.current.first().play();
		return this;
	},

	previousTrack: function() {
		var currentIndex = this.get( 'currentTrackIndex' ),
			previousIndex = currentIndex - 1 < 0 ? this.tracks.length - 1 : currentIndex - 1;

		this.setCurrentTrack( previousIndex );
		return this;
	},

	seekTo: function( time ) {
		this.current.first().seekTo( time );
		return this;
	},

	setCurrentTrack: function( index ) {
		while ( index >= this.tracks.length ) {
			index--;
		}

		if ( index !== this.get( 'currentTrackIndex' ) || ! this.current.length ) {
			this.set( 'currentTrackIndex', index );
			this.loadTrack( this.tracks.at( index ) );
		}

		return this;
	},

	setVolume: function( volume ) {
		this.current.first().setVolume( volume );
		this.unmute();
		this.set( 'volume', volume );
		return this;
	},

	unmute: function() {
		this.current.first().unmute();
		this.set( 'muted', false );
		return this;
	},

	fetch: function() {
		var attributes,
			id = this.get( 'id' );

		if ( ! this.options.persist ) {
			this.setCurrentTrack( this.get( 'currentTrackIndex' ) );
			return;
		}

		attributes = JSON.parse( localStorage.getItem( id ) );

		if ( null === attributes ) {
			this.setCurrentTrack( this.get( 'currentTrackIndex' ) );
			return;
		}

		this.setCurrentTrack ( attributes.currentTrackIndex );
		this.seekTo( attributes.currentTime );

		this.set({
			loop: attributes.loop,
			repeat: attributes.repeat,
			shuffle: attributes.shuffle
		});

		// Don't auto play on mobile devices.
		if ( 'playing' === attributes.status && ! this.isAndroid && ! this.isiOS ) {
			this.play();
		}
	},

	fetchTracks: function() {
		var id = this.get( 'id' ),
			cachedSignature = localStorage.getItem( id + '-signature' );

		// Don't fetch tracks from localStorage if the signature has changed.
		if ( 'signature' in this.options && cachedSignature !== this.options.signature ) {
			localStorage.removeItem( id );
			localStorage.removeItem( id + '-signature' );
			localStorage.removeItem( id + '-tracks' );
			return;
		}

		this.tracks.fetch();
	},

	save: function() {
		var data, track,
			id = this.get( 'id' );

		if ( ! this.options.persist ) {
			return;
		}

		data = this.toJSON();
		data.currentTime = 0;
		data.status = 'paused';

		if ( this.current.length ) {
			track = this.current.first();
			data.currentTime = track.get( 'currentTime' );
			data.status = track.get( 'status' );
		}

		localStorage.setItem( id, JSON.stringify( data ) );

		if ( 'signature' in this.options ) {
			localStorage.setItem( id + '-signature', this.options.signature );
		}
	},

	onTrackEnded: function() {
		if ( this.get( 'repeat' ) ) {
			this.seekTo( 0 ).play();
		} else if (
			this.get( 'currentTrackIndex' ) < this.tracks.length - 1 ||
			this.get( 'loop' ) ||
			this.get( 'shuffle' )
		) {
			this.nextTrack().play();
			this.play();
		} else {
			this.nextTrack().pause();
		}
	},

	onTracksReset: function() {
		this.set( 'currentTrackIndex', null );
	}
});

module.exports = Player;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../collections/tracks":4}],7:[function(require,module,exports){
(function (global){
"use strict";
var Track,
	$ = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null),
	_ = (typeof window !== "undefined" ? window['_'] : typeof global !== "undefined" ? global['_'] : null),
	Backbone = (typeof window !== "undefined" ? window['Backbone'] : typeof global !== "undefined" ? global['Backbone'] : null);

// @todo Add download_url, stream_url attributes.
// @todo Add credit/source icon and link attributes.
// @todo Media nodes can have multiple sources to handle different formats.

Track = Backbone.Model.extend({
	defaults: {
		title: '',
		artist: '',
		artwork_url: '',
		currentTime: 0,
		download_url: '',
		duration: 0,
		loaded: 0, // Percentage.
		purchase_url: '',
		record_id: null,
		source: '',
		status: '', // Values: loading, ready, paused, playing.
		track_number: '',
		type: ''
	},

	constructor: function( attributes ) {
		if ( ! _.has( attributes, 'source' ) && _.has( attributes, 'stream_url' ) ) {
			attributes.source = attributes.stream_url;
		}

		// @todo Convert formatted duration into a different property.

		Backbone.Model.apply( this, arguments );
	},

	initialize: function( attributes, options ) {
		this.canPlay = $.Deferred();
		this.media = null;
		this.ready = $.when( this.canPlay );

		_.bindAll(
			this,
			'onEnded',
			'onError',
			'onLoadedMetadata',
			'onPause',
			'onPlaying',
			'onReady',
			'onTimeUpdate',
			'updateLoaded'
		);
	},

	getProgress: function() {
		var currentTime = this.get( 'currentTime' ),
			duration = this.get( 'duration' );

		return currentTime / duration;
	},

	load: function() {
		this.set( 'status', 'loading' );

		if ( ! this.media ) {
			this.set( 'status', 'error' );
			return;
		}

		this.media.setAttribute( 'preload', 'auto' );
		this.media.setAttribute( 'src', this.get( 'source' ) );
		this.media.setAttribute( 'type', this.get( 'type' ) );

		this.media.addEventListener( 'canplay',        this.onReady );
		this.media.addEventListener( 'loadedmetadata', this.onReady );
		this.media.addEventListener( 'ended',          this.onEnded );
		this.media.addEventListener( 'loadedmetadata', this.onLoadedMetadata );
		this.media.addEventListener( 'error',          this.onError );
		// abort, emptied, stalled, suspend
		this.media.addEventListener( 'pause',          this.onPause );
		this.media.addEventListener( 'playing',        this.onPlaying );
		this.media.addEventListener( 'loadedmetadata', this.onTimeUpdate );
		this.media.addEventListener( 'timeupdate',     this.onTimeUpdate );
		this.media.addEventListener( 'progress',       this.updateLoaded );
		this.media.addEventListener( 'timeupdate',     this.updateLoaded );

		// https://code.google.com/p/chromium/issues/detail?id=73609
		//this.media.addEventListener( 'canplaythrough', this.onReady );

		this.media.load();
	},

	unload: function() {
		this.set( 'status', 'paused' );

		this.media.removeEventListener( 'canplay',        this.onReady );
		this.media.removeEventListener( 'loadedmetadata', this.onReady );
		this.media.removeEventListener( 'ended',          this.onEnded );
		this.media.removeEventListener( 'loadedmetadata', this.onLoadedMetadata );
		this.media.removeEventListener( 'error',          this.onError );
		this.media.removeEventListener( 'pause',          this.onPause );
		this.media.removeEventListener( 'playing',        this.onPlaying );
		this.media.removeEventListener( 'loadedmetadata', this.onTimeUpdate );
		this.media.removeEventListener( 'timeupdate',     this.onTimeUpdate );
		this.media.removeEventListener( 'progress',       this.updateLoaded );
		this.media.removeEventListener( 'timeupdate',     this.updateLoaded );
	},

	mute: function() {
		this.media.muted = true;
	},

	pause: function() {
		if ( this.media ) {
			this.media.pause();
		}

		this.set( 'status', 'paused' );
	},

	play: function() {
		var self = this;
		this.ready.done(function() {
			self.media.play();
			self.set( 'status', 'playing' );
		});
	},

	seekTo: function( time ) {
		var intervalId, readyState,
			deferred = $.Deferred(),
			media = this.media;

		if ( _.isUndefined( time ) ) {
			return;
		}

		this.ready = $.when( this.canPlay, deferred );

		readyState = function() {
			if ( 4 === media.readyState ) { //  && ( ! mejs.MediaFeatures.isWebkit || time < node.buffered.end( 0 ) )
				media.currentTime = time;
				clearInterval( intervalId );
				deferred.resolve();
				return true;
			}
			return false;
		};

		if ( ! readyState() ) {
			intervalId = setInterval( readyState, 50 );
		}
	},

	setVolume: function( volume ) {
		this.media.volume = volume;
	},

	unmute: function() {
		this.media.muted = false;
	},

	onError: function() {
		this.set( 'status', 'error' );
	},

	onEnded: function() {
		this.trigger( 'ended' );
	},

	onLoadedMetadata: function() {
		this.set( 'duration', this.media.duration );
	},

	onPause: function() {
		this.set( 'status', 'paused' );
	},

	onPlaying: function() {
		this.set( 'status', 'playing' );
	},

	onReady: function() {
		this.canPlay.resolve();
		this.set( 'status', 'ready' );
	},

	onTimeUpdate: function() {
		if ( this.media ) {
			this.set( 'currentTime', this.media.currentTime );
		}
	},

	updateLoaded: function() {
		var loaded;

		try {
			loaded = this.media.buffered.end( this.media.buffered.length - 1 );
			this.set( 'loaded', loaded / this.media.duration * 100 );
		} catch ( ex ) {}
	}
});

module.exports = Track;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});