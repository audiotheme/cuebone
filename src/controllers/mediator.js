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
	_ = require( 'underscore' ),
	Backbone = require( 'backbone' );

Mediator = Backbone.Collection.extend({
	initialize: function( models, options ) {
		this.listenTo( options.events, 'play', this.pauseOthers );
	},

	pauseOthers: function( model ) {
		_.chain( this.models ).without( model ).invoke( 'pause' );
	}
});

module.exports = Mediator;
