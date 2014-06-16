module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        requirejs: {
            options: {
                name: "dcevent",
                baseUrl: "./src/",
                useStrict: true,
                wrap: {
                    start: '(function (window, document, undefined) {"use strict"; ',
                    end: '}(window, document));'
                },
                onModuleBundleComplete: function (data) {
                    var fs = require('fs'),
                        amdclean = require('amdclean'),
                        outputFile = data.path;

                    fs.writeFileSync(outputFile, amdclean.clean({
                        'filePath': outputFile
                    }));
                }
            },
            compileDev: {
                options: {
                    out: "dcevent.js",
                    optimize: "none"
                }
            },
            compileProd: {
                options: {
                    out: "dcevent.min.js",
                    optimize: "uglify2"
                }
            },
            compileTests: {
                options: {
                    name: "../tests/test",
                    out: "tests/test.bundle.js",
                    optimize: "none"
                }
            }
        },

        watch: {
            build: {
                files: ['src/*.js', 'Gruntfile.js'],
                tasks: ["requirejs:compileDev", "requirejs:compileProd", "requirejs:compileTests" ]
            },
            tests: {
                files: ["tests/test.js"],
                tasks: ["requirejs:compileTests" ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [ "requirejs", "watch" ]);
};
