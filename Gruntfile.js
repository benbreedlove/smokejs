'use strict';
module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      }
    },
    browserify: {
      dist: {
        files: { 'build/js/smoke.js': ['js/main.js'] },
        options: {
          bundleOptions: {
            debug: true
          }
        }
      },
      edit: {
        files: { 'build/js/smoke_edit.js': ['js/main_edit.js'] },
        options: {
          bundleOptions: {
            debug: true
          }
        }
      },
      test: {
        files: { 'build/test/smoke_test.js': ['test/all.js'] },
        options: {
          bundleOptions: {
            debug: true
          }
        }
      }
    },
    less: {
      development: {
        files: {
          'build/css/<%= pkg.name %>.css': [
            'css/**/*.less',
            'css/**/*.css'
          ]
        }
      },
      production: {
        options: { yuicompress: true },
        files: {
          'build/css/<%= pkg.name %>.min.css': [
            'css/*.less',
            'css/*.css'
          ]
        }
      }
    },
    uglify: {
      options: { banner: '<%= banner %>' },
      dist: {
        src: 'build/js/smoke.js',
        dest: 'build/js/smoke.min.js'
      },
      edit: {
        src: 'build/js/smoke_edit.js',
        dest: 'build/js/smoke_edit.min.js'
      }
    },
    shell: {
      testling: {
        command: function (browser) {
          if (browser === 'undefined') {
            return 'node_modules/.bin/browserify -t coverify test/all.js | node_modules/.bin/testling | node_modules/.bin/coverify -o ./coverify.log && tail -n3 ./coverify.log || true';
          } else if (browser === 'url') {
            return 'node_modules/.bin/browserify -t coverify test/all.js | node_modules/.bin/testling -u';
          } else {
            return 'node_modules/.bin/browserify -t coverify test/all.js | node_modules/.bin/testling -x "' + browser + '" | node_modules/.bin/coverify -o ./coverify.log && tail -n3 ./coverify.log || true';
          }
        }
      },
      tail_log: {
        command: 'tail -n3 ./coverify.log || true'
      }
    },
    jshint: {
      gruntfile: {
        options: { jshintrc: '.jshintrc' },
        src: 'Gruntfile.js'
      },
      src: {
        options: { jshintrc: 'js/.jshintrc' },
        src: [
          'js/**/*.js',
          '!js/libs/**/*.js'
        ]
      },
      test: {
        options: { jshintrc: 'test/.jshintrc' },
        src: [
          'test/*.js',
          '!test/libs/**/*.js'
        ]
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'build/css/',
        src: ['/*.css'],
        dest: 'build/css',
        ext: '.css'
      }
    },
    connect: {
      server: {
        options: {
          port: 9001,
          base: 'build',
          middleware: function (connect, options) {
            var less = require('less-middleware');
            return [
              less({ src: options.base }),
              connect.static(options.base),
              connect.directory(options.base)
            ];
          }
        }
      }
    },
    htmlmin: {
      build: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'build/index.html': 'index.html',
          'build/edit.html': 'edit.html',
          'build/test.html': 'test/test.html'
        }
      }
    },
    dust: {
      defaults: {
        files: {
          'build/js/dust_templates.js': [
            'templates/**/*.dust',
            '!templates/edit/**/*.dust'
          ]
        },
        options: {
          runtime: false,
          basePath: 'templates',
          wrapper: 'commonjs',
          wrapperOptions: {
            returning: 'dust',
            deps: { dust: 'dustjs-linkedin' }
          }
        }
      },
      edit: {
        files: { 'build/js/edit_templates.js': [ 'templates/**/*.dust' ]
        },
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: [
          'browserify',
        ]
      },
      templates: {
        files: 'templates/**/*.dust',
        tasks: [
          'dust',
          'browserify',
        ]
      },
      css: {
        files: 'css/**/*.less',
        tasks: ['less:development']
      },
      html: {
        files: '**/*.html',
        tasks: ['htmlmin']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: [
          'browserify:test'
        ]
      }
    }
  });
  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-dust');
  grunt.loadNpmTasks('grunt-browserify');
  // Default task.
  grunt.registerTask('default', [
    'dust',
    'browserify',
    'concat',
    'uglify',
    'less',
    'htmlmin',
    'connect'
  ]);
  grunt.registerTask('min', [
    'dust',
    'browserify',
    'concat',
    'uglify',
    'cssmin',
    'htmlmin'
  ]);
  grunt.registerTask('test', function (browser) {
    grunt.task.run('dust', 'shell:testling:' + browser, 'shell:tail_log');
  });
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('css', [
    'less',
    'cssmin'
  ]);
  grunt.registerTask('fab', [
    'dust',
    'browserify',
    'concat',
    'uglify',
    'less',
    'cssmin',
    'htmlmin'
  ]);
  grunt.registerTask('serve', [
    'dust',
    'browserify',
    'less:development',
    'htmlmin',
    'connect',
    'watch'
  ]);
};
