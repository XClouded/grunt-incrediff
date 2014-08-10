/*
 * grunt-incrediff
 * https://github.com/SenYu/grunt-incrediff
 *
 * Copyright (c) 2014 SenYu
 * Licensed under the MIT license.
 */

'use strict';
var request = require('request'),
    async = require('async'),
    maxmin = require('maxmin'),
    chalk = require('chalk'),
    diff = require('./lib/newChunk');

module.exports = function(grunt) {

function responseHandler(dest, done, container, _name, url, cnt, all) {
      return function (error, response, body) {
            response = response || { statusCode: 0 };

            if (error) {
                return done(error);
            } else if ( (response.statusCode < 200 || response.statusCode > 399)) {
                grunt.log.warn( 'Download ' + chalk.grey(url) + chalk.red(' Failed ' + response.statusCode));
                return done(response.statusCode);
            }

            container[ _name ] = body;
            grunt.log.warn( 'Download ' + chalk.grey(url) + chalk.green(' success ') + (++cnt.cnt + '/' + all) );
            done();
      };
}

function strFormat( source, kvd ) {
    if ( typeof source !== 'string' ) { return ''; }
    for ( var key in kvd ) {
        if ( kvd.hasOwnProperty( key ) ) {
            source = source.replace( new RegExp('%{'+ key +'}','g') , kvd[ key ] );
        }
    }
    return source;
}

    grunt.registerMultiTask('incrediff', 'auto-generate tool of incremental difference of static files', function() {
        var options = this.options({
            version: [],
            chunkSize: 20,
            isSingleDiff: true,
            isHashStr: false,
            sourceFormat:  '%{CDNURL}/%{NEWVERSION}/%{FILEPATH}',
            format: '%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}.js' //支持FILEPATH,OLDVERSION,NEWVERSION三个替换
        });

        var i, j, len, lenJ;
        var _versions;
        var src;
        var newContent;
        var done;
        if ( !options.dest || !options.newsrc || !options.cdnUrl ){
            grunt.log.warn('config need [DEST],[NEWSRC],[CDNURL]');
            return;
        }

        options.dest   = options.dest.replace(/\/$/,'') + '/';
        options.newsrc = options.newsrc.replace(/\/$/,'') + '/';
        options.cdnUrl = options.cdnUrl.replace(/\/$/,'');

        if (  options.version.length  < 1 ) {
            grunt.log.warn('Array[Version] must has 2 element AT LEAST');
            return;
        }

        _versions = options.isSingleDiff ? [ options.version[ 0 ], options.version[ 1 ] || undefined ] : options.version;
            if ( typeof _versions[ _versions.length -1 ] === 'undefined' ) {
                _versions.pop();
            }
            _versions = _versions.concat( [''] );
        //需要生成差异的版本数组,最后有一个 ''元素
        src = this.files[0].orig.src;
        src = src.map(function (data) {
            return data.replace(/^\//,'');
        });
        //原文件path数组
        newContent = [];
        //源文件path的content数组
        done = this.async();
        //async 同步

        for ( j = 0, len = src.length ; j < len ; j++ ) {
            //read 最新版本文件存入newContent
            var readPath = options.newsrc + src[ j ];
            newContent[ j ] = grunt.file.read(readPath);
        }

        //生成request请求的url队列
        var reqQueue = [];
        for ( i = 1, len = _versions.length; i < len ; i ++) {
            var curVersion = _versions[ i ];
            if ( curVersion !== '' ) {
                for ( j = 0, lenJ = src.length; j < lenJ ; j++ ) {
                    var oldUrl = strFormat( options.sourceFormat, {
                            CDNURL  : options.cdnUrl,
                            FILEPATH: src[ j ],
                            OLDVERSION: '',
                            NEWVERSION: curVersion
                        } );
                    //options.cdnUrl + curVersion + '/' + src[ j ];
                    reqQueue.push( {url:oldUrl ,name: src[j] + '?' + curVersion} );
                }
            }
        }

        //请求回来的内容给reqContent,全部请求完成后执行 resolve
        var reqContent = {};
        var _count = {cnt:0};
        async.each(reqQueue, 
            function (file, next) {
                 var r, callback;
                 var url = file.url,
                     name = file.name;

                 callback = responseHandler(null, next, reqContent, name, url, _count, reqQueue.length);
                 //写入文件的回调放在 responseHandler 里面了
                 r = request({url: url}, callback);

            }, 
            //操作结束 (均完成或有一失败),执行下面的,开始生成
            function (err) {
                if (err) {    
                    grunt.log.writeln(chalk.red('ERROR 404: ')+chalk.yellow('Please Validate ths Configuration of CDN-URL or File Path'));
                    grunt.fail.fatal(err);
                }
                else {
                    grunt.log.warn('NEXT');
                }
                //TODO, 开始产生差分数据
                for ( i = 1, len = _versions.length; i < len ; i ++) {
                    var curVersion = _versions[ i ];
                    
                    for ( j = 0, lenJ = src.length ; j < lenJ ; j ++) {
                        if ( curVersion === '' ) {
                            generateFullData( newContent[ j ], src[ j ] );
                        }
                        else {
                            //Http下载
                            var oldContent = reqContent[ src[ j ] + '?' + curVersion ];
                            generateDiffData( newContent[ j ], oldContent, curVersion, src[ j ] );
                        }
                    }
                }

                done(err);
            });

        function generateDiffData ( newdata, olddata, oldver, path) {
            var writePath = options.dest + strFormat( options.format, {
                FILEPATH: path,
                OLDVERSION: oldver,
                NEWVERSION: _versions[0]
            } );

            var content = diff(olddata, newdata, options.chunkSize, options.isHashStr);
            var writeContent = JSON.stringify( content ) + '/*"""*/';
            grunt.file.write(writePath, writeContent, 'utf8');
            grunt.log.warn('DiffData '+ chalk.cyan(writePath) + ' created: ' + maxmin(newdata, writeContent, false)  );
        }

        function generateFullData ( content, path ) {
            var writePath = options.dest + strFormat( options.format, {
                FILEPATH: path,
                OLDVERSION: '',
                NEWVERSION: _versions[0]
            } );

            var writeContent = JSON.stringify( content ) + '/*"""*/';
            grunt.file.write(writePath, writeContent, 'utf8');
            grunt.log.warn('FullData '+ chalk.cyan(writePath) + ' created ' );
        }

    });

};
