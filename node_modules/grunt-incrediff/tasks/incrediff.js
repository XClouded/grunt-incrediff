/*
 * grunt-incrediff
 * https://github.com/SenYu/grunt-incrediff
 *
 * Copyright (c) 2014 SenYu
 * Licensed under the MIT license.
 */

'use strict';
var diff = require('./lib/newChunk');
var maxmin = require('maxmin');
var chalk = require('chalk');
module.exports = function(grunt) {


    grunt.registerMultiTask('incrediff', 'auto-generate tool of incremental difference of static files', function() {
    // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            version: [],
            chunkSize: 20,
            format: '%{FILEPATH}_%{OLDVERSION}' //支持FILEPATH,OLDVERSION,NEWVERSION三个替换
        });

        var _nVer = options.version[0],
            _oVer = options.version[1] || "";
        var _src = this.files[0].orig.src;

        var _new = options.newsrc.replace(/\/$/,'') + '/';
        var _from = options.oldsrc.replace(/\/$/,'') + '/';
        var _to = options.dest.replace(/\/$/,'') + '/';

        var _format = options.format;
        var _chunkSize = options.chunkSize;

/*        grunt.log.warn('[[[grunt-incrediff]]]');

        grunt.log.warn('f'+console.log(this.files));
        grunt.log.warn('o'+console.log(options));
        grunt.log.warn('s'+console.log(_src));*/


        grunt.log.writeln('Full-Update File:');
        for ( var j = 0 ; j < _src.length ; j ++ ) {
            var file = _src[j].replace(/^\//,'');
            var readPath = _new + file;
            //var readPath = _from + _oVer + '/' + file;
            var writePath = _to + _format.replace(/\%\{FILEPATH\}/g, file).replace(/\%\{OLDVERSION\}/g, '').replace(/\%\{NEWVERSION\}/g, _nVer);

            var content = grunt.file.read(readPath);
            var write = JSON.stringify( content ) + '/*"""*/';
            grunt.file.write(writePath, write, 'utf8');

            //grunt.log.warn('['+readPath + '] -> [' + writePath+']');
            grunt.log.warn('File ' + chalk.cyan(writePath)+' created');
        }
        grunt.log.writeln('\nIncre-Update File:');
        for ( var j = 0 ; j < _src.length ; j ++ ) {
            var file = _src[j].replace(/^\//,'');
            var readPath1 = _new + file;
            var readPath2 = _from + _oVer + '/' + file;
            var writePath = _to + _format.replace(/\%\{FILEPATH\}/g, file).replace(/\%\{OLDVERSION\}/g, _oVer).replace(/\%\{NEWVERSION\}/g, _nVer);

            var oldData = grunt.file.read(readPath2);
            var newData = grunt.file.read(readPath1);

            var content = diff(oldData, newData, _chunkSize);
            var write = JSON.stringify( content ) + '/*"""*/';
            grunt.file.write(writePath, write, 'utf8');

            //grunt.log.warn('['+ readPath2+','+readPath1 + '] -> [' + writePath + ']');
            grunt.log.warn('File '+ chalk.cyan(writePath) + ' created: ' + maxmin(newData, write, false)  );
        }
  });

};
