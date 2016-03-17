var Track,
	$ = require( 'jquery' ),
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' );

// @todo Media nodes can have multiple sources to handle different formats.
// // @todo Add credit/source icon and link attributes?

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
