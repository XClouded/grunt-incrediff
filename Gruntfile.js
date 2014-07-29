/*
 * grunt-incrediff
 * https://github.com/SenYu/grunt-incrediff
 *
 * Copyright (c) 2014 SenYu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    var version = grunt.file.readJSON('version.json');
/****************************************/
    var DAILY_PATH = 'http://g.assets.daily.taobao.net';
    //var CDN_PATH = 'http://g.tbcdn.cn';
    var CDN_PATH = DAILY_PATH;
    //grunt build 时使用build目录，本地打包调试使用
    var buildDir = 'build';
  // Project configuration.
    grunt.initConfig({
        versionSrcBase: '.version',
        versionBuildBase: buildDir ,//+ '/version',
        jshint: {
          all: [
            'Gruntfile.js',
            'tasks/**.js',
          ],
          options: {
            jshintrc: '.jshintrc'
          }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: [ buildDir ]
        },

        // Configuration to be run (and then tested).
        incrediff: {
            incre: {
                options: {
                    version: version,   //版本号数据 

                    chunkSize: 20,          //Diff生成配置
                    isSingleDiff: false,
                    dest: '<%= versionBuildBase %>',
                    format: '%{NEWVERSION}/%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}', //支持FILEPATH,OLDVERSION,NEWVERSION三个替换
                    //最后产生的可能是 g.tbcdn.cn/dd/h5/1.3.6/css/app_all.min.css_1.3.51
                    //发布到线上需要把改成！！%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}！！，去掉最前面的 %{NEWVERSION}/

                    newsrc: buildDir,   //new版本获取配置

                    cdnUrl: CDN_PATH +'/dd/h5',   //old版本下载配置
                },
                files: {
                    src: ['css/app_all.min.css', 'js/core_all.js', 'js/app/app_all.js']
                }
            },
      }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('test', ['clean', 'incrediff'/*, 'nodeunit'*/]);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};