/*
 * grunt-incrediff
 * https://github.com/SenYu/grunt-incrediff
 *
 * Copyright (c) 2014 SenYu
 * Licensed under the MIT license.
 */

'use strict';
    /* http请求，下载历史版本文件 */
var request = require('request'),
    async = require('async'),
    /* 显示差异文件大小 */
    maxmin = require('maxmin'),
    chalk = require('chalk'),
    /* 差异算法库 */
    diff = require('./lib/newChunk');

module.exports = function(grunt) {

    /**
     * @description http响应的回调，为了获取dest, done, container, _name, url, cnt, all，而产生的闭包，如果直接写在里面太繁琐了
     * @param {object} done async异步回调对象
     * @param {object} container 统一存储下载下来的字符串
     * @param {string} _name 存储的名称
     * @param {string} url 下载路径，显示用
     * @param {string} cnt 下载顺序，显示用
     * @param {string} all 下载总数，显示用
     * @return {Function} 返回闭包函数
     */
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

    /**
     * @description 字符串处理格式化，按照指定的  %{XXX} 进行替换
     * @param {string} source 源格式串
     * @param {object} kvd 替换数据
     * @return {string} 结果字串
     */
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
            /* v[0] 为最新版本,v[1]为次新版本,之后类推 */
            version: [],
            /* 默认差异分块大小,如果diff中指定则使用diff中的 */
            chunkSize: 20,
            /* TRUE时只生成v[1]->v[0]的差异， FALSE生成v[>=1]->v[0]的差异 */
            isSingleDiff: true,
            /* 是否对公共str采取hash存储,建议FALSE */
            isHashStr: false,
            /* 算法,可选'chunk','chunklcs' */
            algorithm: 'chunk',
            /* 从CDN上获取的旧版本文件的url格式 */
            sourceFormat:  '%{CDNURL}/%{OLDVERSION}/%{FILEPATH}',
            /* 产生新的差异的路径格式，前面默认会有CDN// */
            format: '%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}.js' //支持FILEPATH,OLDVERSION,NEWVERSION三个替换
        });

        var i, j, len, lenJ;
        var _versions;
        var src;
        var newContent;
        var done;

        //选择差分算法
        switch(options.algorithm.toLowerCase()) {
            case 'chunk':
                diff = require('./lib/newChunk');
                break;
            case 'chunklcs':
                diff = require('./lib/chunkLCS');
                break;
        }
        var diffChunk = require('./lib/newChunk');
        var diffChunkLCS = require('./lib/chunkLCS');

        if ( !options.dest || !options.newsrc || !options.cdnUrl ){
            grunt.log.warn('config need [DEST],[NEWSRC],[CDNURL]');
            return;
        }

        /* 各种路径后缀修正 */
        options.dest   = options.dest.replace(/\/$/,'') + '/';
        options.newsrc = options.newsrc.replace(/\/$/,'') + '/';
        options.cdnUrl = options.cdnUrl.replace(/\/$/,'');

        if (  options.version.length  < 1 ) {
            grunt.log.warn('Array[Version] must has 2 element AT LEAST');
            return;
        }

        /* 设置需要差生差异的各版本 */
        _versions = options.isSingleDiff ? [ options.version[ 0 ], options.version[ 1 ] || undefined ] : options.version;
        /* 如果options.versions中只写了1个元素(最新)，会进入这里,自动填充一个空元素 */
        if ( typeof _versions[ _versions.length -1 ] === 'undefined' ) {
            _versions.pop();
        }
        _versions = _versions.concat( [''] );

        /* 需要产生差异的src源文件数组,去掉开头的斜杠 */
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
        /* 对每个列出的非最新版本 for-i */
        for ( i = 1, len = _versions.length; i < len ; i ++) {
            var curVersion = _versions[ i ];
            if ( curVersion !== '' ) {
                /* 对每个src源数据 */
                for ( j = 0, lenJ = src.length; j < lenJ ; j++ ) {
                    var oldUrl = strFormat( options.sourceFormat, {
                            CDNURL  : options.cdnUrl,
                            FILEPATH: src[ j ],
                            OLDVERSION: curVersion,
                            NEWVERSION: _versions[0]
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
                            /* 全量数据 */
                            generateFullData( newContent[ j ], src[ j ] );
                        }
                        else {
                            /* 差异数据 */
                            var oldContent = reqContent[ src[ j ] + '?' + curVersion ];
                            generateDiffData( newContent[ j ], oldContent, curVersion, src[ j ] );
                        }
                    }
                }

                done(err);
            });

        /**
         * @description 根据输入新旧数据源计算差异，并存储到指定位置
         * @param {string} newdata 新数据源
         * @param {string} olddata旧数据源
         * @param {string} oldver 旧版本号
         * @param {string} path 存储路径
         */
        function generateDiffData ( newdata, olddata, oldver, path) {
            var writePath = options.dest + strFormat( options.format, {
                FILEPATH: path,
                OLDVERSION: oldver,
                NEWVERSION: _versions[0]
            } );
            var content;
            var algoText;
            var mergeChunk, mergeChunkLCS, contentChunk, contentChunkLCS;
            if ( options.algorithm !== 'auto' ) {
                content = diff(olddata, newdata, options.chunkSize, options.isHashStr);
                algoText = options.algorithm;
                if ( diff.merge(olddata, options.chunkSize, content) !== newdata ) {
                    grunt.fail.fatal('差异数据计算出错,可能是算法有问题,请修改algorithm配置项: '+ options.algorithm + path + ' ' + oldver +'->' + _versions[0]);
                }
            }
            else {
                contentChunk = diffChunk(olddata, newdata, options.chunkSize, options.isHashStr);
                contentChunkLCS = diffChunkLCS(olddata, newdata, options.chunkSize, options.isHashStr);
                mergeChunk = diffChunk.merge(olddata, options.chunkSize, contentChunk) === newdata;
                mergeChunkLCS = diffChunkLCS.merge(olddata, options.chunkSize, contentChunkLCS) === newdata;
                if ( mergeChunk && mergeChunkLCS ) {
                    if ( JSON.stringify(contentChunk).length < JSON.stringify(contentChunkLCS).length ) {
                        content = contentChunk;
                        algoText = 'chunk';
                    }
                    else {
                        content = contentChunkLCS;
                        algoText = 'chunklcs';
                    }
                }
                else if ( mergeChunk ) {
                    content = contentChunk;
                    algoText = 'chunk';
                }
                else if ( mergeChunkLCS ) {
                    content = contentChunkLCS;
                    algoText = 'chunklcs';
                }
                else {
                    grunt.fail.fatal('差异数据计算出错,可能是算法有问题,请修改algorithm配置项: '+ options.algorithm + path + ' ' + oldver +'->' + _versions[0]);
                }
            }

            var writeContent = JSON.stringify( content ) + '/*"""*/';
            grunt.file.write(writePath, writeContent, 'utf8');
            grunt.log.warn('DiffData '+ algoText +' ' +chalk.cyan(writePath) + ' created: ' + maxmin(newdata, writeContent, false)  );
        }

        /**
         * @description 根据输入数据源生成全量数据，并存储到指定位置，(考虑到所有文件,包括CSS和JS能被combo在一起,必须要做一定处理,让本地接收时能够分离成单个文件)
         * @param {string} 数据内容
         * @param {string} path 存储路径
         */
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
