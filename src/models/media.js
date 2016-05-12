var Media,
	$ = require( 'jquery' ),
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' );

Media = Backbone.Model.extend({
	defaults: {
		current_time: 0,
		duration: 0, // Seconds.
		loaded: 0, // Percentage.
		source: '',
		status: '', // Values: loading, ready, paused, playing.
		track: null,
		type: ''
	},

	initialize: function( attributes, options ) {
		this.canPlay = $.Deferred();
		this.mediaElement = null;
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
		var currentTime = this.get( 'current_time' ),
			duration = this.get( 'duration' );

		return currentTime / duration;
	},

	load: function() {
		this.set( 'status', 'loading' );

		if ( ! this.mediaElement ) {
			this.set( 'status', 'error' );
			return;
		}

		this.mediaElement.setAttribute( 'preload', 'auto' );
		this.mediaElement.setAttribute( 'src', this.get( 'source' ) );
		this.mediaElement.setAttribute( 'type', this.get( 'type' ) );

		this.mediaElement.addEventListener( 'canplay',        this.onReady );
		this.mediaElement.addEventListener( 'loadedmetadata', this.onReady );
		this.mediaElement.addEventListener( 'ended',          this.onEnded );
		this.mediaElement.addEventListener( 'loadedmetadata', this.onLoadedMetadata );
		this.mediaElement.addEventListener( 'error',          this.onError );
		// abort, emptied, stalled, suspend
		this.mediaElement.addEventListener( 'pause',          this.onPause );
		this.mediaElement.addEventListener( 'playing',        this.onPlaying );
		this.mediaElement.addEventListener( 'loadedmetadata', this.onTimeUpdate );
		this.mediaElement.addEventListener( 'timeupdate',     this.onTimeUpdate );
		this.mediaElement.addEventListener( 'progress',       this.updateLoaded );
		this.mediaElement.addEventListener( 'timeupdate',     this.updateLoaded );

		// https://code.google.com/p/chromium/issues/detail?id=73609
		//this.mediaElement.addEventListener( 'canplaythrough', this.onReady );

		this.mediaElement.load();
	},

	unload: function() {
		this.set( 'status', 'paused' );

		this.mediaElement.removeEventListener( 'canplay',        this.onReady );
		this.mediaElement.removeEventListener( 'loadedmetadata', this.onReady );
		this.mediaElement.removeEventListener( 'ended',          this.onEnded );
		this.mediaElement.removeEventListener( 'loadedmetadata', this.onLoadedMetadata );
		this.mediaElement.removeEventListener( 'error',          this.onError );
		this.mediaElement.removeEventListener( 'pause',          this.onPause );
		this.mediaElement.removeEventListener( 'playing',        this.onPlaying );
		this.mediaElement.removeEventListener( 'loadedmetadata', this.onTimeUpdate );
		this.mediaElement.removeEventListener( 'timeupdate',     this.onTimeUpdate );
		this.mediaElement.removeEventListener( 'progress',       this.updateLoaded );
		this.mediaElement.removeEventListener( 'timeupdate',     this.updateLoaded );
	},

	mute: function() {
		this.mediaElement.muted = true;
	},

	pause: function() {
		if ( this.mediaElement ) {
			this.mediaElement.pause();
		}

		this.set( 'status', 'paused' );
	},

	play: function() {
		var self = this;
		this.ready.done(function() {
			self.mediaElement.play();
			self.set( 'status', 'playing' );
		});
	},

	seekTo: function( time ) {
		var intervalId, readyState,
			deferred = $.Deferred(),
			media = this.mediaElement;

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
		this.mediaElement.volume = volume;
	},

	unmute: function() {
		this.mediaElement.muted = false;
	},

	onError: function() {
		this.set( 'status', 'error' );
	},

	onEnded: function() {
		this.trigger( 'ended' );
	},

	onLoadedMetadata: function() {
		this.set( 'duration', this.mediaElement.duration );
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
		if ( this.mediaElement ) {
			this.set( 'current_time', this.mediaElement.currentTime );
		}
	},

	updateLoaded: function() {
		var loaded;

		try {
			loaded = this.mediaElement.buffered.end( this.mediaElement.buffered.length - 1 );
			this.set( 'loaded', loaded / this.mediaElement.duration * 100 );
		} catch ( ex ) {}
	}
});

module.exports = Media;
