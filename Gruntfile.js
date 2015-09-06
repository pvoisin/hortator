module.exports = function(grunt) {
	grunt.initConfig({
		mochaTest: {
			test: {
				options: {
					reporter: "spec"
				},

				src: ["test/suites/**/*Suite.js"]
			}
		}
	});

	grunt.registerTask("test", ["mochaTest"]);

	grunt.loadNpmTasks("grunt-mocha-test");
};
