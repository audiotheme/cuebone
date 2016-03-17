/*jshint node:true */

module.exports = function( grunt ) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		banner: grunt.file.read( 'banner.tpl' ),

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			check: [
				'Gruntfile.js',
				'src/**/*.js'
			]
		},

		browserify: {
			options: {
				banner: '<%= banner %>',
				browserifyOptions: {
					standalone: 'cuebone'
				}
			},
			build: {
				files: {
					'browser/cuebone.js' : 'index.js'
				}
			}
		},

		uglify: {
			options: {
				banner: '<%= banner %>',
			},
			build: {
				files: {
					'browser/cuebone.min.js' : 'browser/cuebone.js'
				}
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-browserify' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	grunt.registerTask( 'default', function() {
		grunt.config.set( 'browserify.options.keepAlive', true );
		grunt.config.set( 'browserify.options.watch', true );
		grunt.task.run([ 'browserify' ]);
	});

	grunt.registerTask( 'build', [ 'jshint', 'browserify', 'uglify' ] );

};
