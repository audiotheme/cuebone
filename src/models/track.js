var Track,
	$ = require( 'jquery' ),
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' ),
	Media = require( './media' );

// @todo Media nodes can have multiple sources to handle different formats.
// @todo Add credit/source icon and link attributes?

Track = Backbone.Model.extend({
	defaults: {
		artist: '',
		artwork_url: '',
		download_url: '',
		duration: '',
		purchase_url: '',
		record_id: null,
		stream_url: '',
		title: '',
		track_number: ''
	},

	initialize: function( attributes, options ) {
		this.media = new Media({
			source: this.get( 'stream_url' ),
			track: this
		});
	}
});

module.exports = Track;
