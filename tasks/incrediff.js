/*
 * grunt-incrediff
 * https://github.com/SenYu/grunt-incrediff
 *
 * Copyright (c) 2014 SenYu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('incrediff', 'auto-generat tool of incremental difference of static files', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', ',
      version: ["1.3.51","1.3.5","1.3.41","1.3.3","1.3.2"],
      CDN: "http://g.tbcdn.cn"
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      grunt.log.warn(JSON.stringify(f));
      var dd = [];
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
       //grunt.log.writeln();
        dd.push( filepath + grunt.file.exists(filepath) );
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return true;
        } else {
          grunt.log.warn('Source file "' + filepath + '" found.');
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        grunt.log.writeln(filepath);
        return grunt.file.read('http://my.m.taobao.com/h5/staticBytes/increLoad.js');
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
      grunt.log.writeln(dd.join('.')+dd.length);
    });
  });

};
