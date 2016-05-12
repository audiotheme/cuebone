var Player,
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' ),
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
		this.media = new Backbone.Collection();
		this.tracks = this.options.tracks || new Tracks([{}]);
		delete this.options.tracks;

		// Remember the player state between requests.
		if ( this.options.persist ) {
			this.fetchTracks();
			this.on( 'change', this.save, this );
			this.current.on( 'add change remove reset', this.save, this );
			this.media.on( 'add change remove reset', this.save, this );
			this.tracks.on( 'add remove reset', this.tracks.save, this.tracks );
		}

		this.listenTo( this.media, 'ended', this.onTrackEnded );

		// Clear the current track index when replacing tracks.
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
			currentTrack.media.set( 'status', 'error' === currentTrack.get( 'status') ? 'error' : 'paused' );
			currentTrack.media.unload();
		}

		// Update the current track.
		this.set( 'status', 'loading' );
		this.current.reset( track );
		this.media.reset( track.media );

		// Re-use the media element between tracks because Android and iOS won't
		// play dynamically created media elements without user interaction.
		track.media.mediaElement = this.mediaElement;

		track.media.load();
	},

	mute: function() {
		this.current.first().media.mute();
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
			this.current.first().media.pause();
		}
		return this;
	},

	play: function() {
		this.options.events.trigger( 'play', this );
		this.current.first().media.play();
		return this;
	},

	previousTrack: function() {
		var currentIndex = this.get( 'currentTrackIndex' ),
			previousIndex = currentIndex - 1 < 0 ? this.tracks.length - 1 : currentIndex - 1;

		this.setCurrentTrack( previousIndex );
		return this;
	},

	seekTo: function( time ) {
		this.current.first().media.seekTo( time );
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
		this.current.first().media.setVolume( volume );
		this.unmute();
		this.set( 'volume', volume );
		return this;
	},

	unmute: function() {
		this.current.first().media.unmute();
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
		this.seekTo( attributes.current_time );

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
		data.current_time = 0;
		data.status = 'paused';

		if ( this.current.length ) {
			track = this.current.first();
			data.current_time = track.media.get( 'current_time' );
			data.status = track.media.get( 'status' );
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
