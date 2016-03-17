var Tracks,
	$ = require( 'jquery' ),
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' ),
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
