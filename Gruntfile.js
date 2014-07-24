'use strict';

module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');
/****************************************/
    var version = grunt.file.readJSON('version.json');
/****************************************/
    var DAILY_PATH = 'http://g.assets.daily.taobao.net';
    var CDN_PATH = 'http://g.tbcdn.cn';
    //grunt build 时使用build目录，本地打包调试使用
    var buildDir = 'build';
    var buildBase, buildEnv = 'daily';

    // load the contrib module
    require('load-grunt-tasks')(grunt);

    grunt.registerTask('config', 'config the build', function() {

        grunt.initConfig({
            pkg: pkg,
            version: version,     /*配置增量更新的版本,一般来说，
                                  创建完新分支之后修改下version.json到最新就可以了
                                  目前是 ["1.3.6"]*/
            jsSrcBase: 'src/js',
            jsBuildBase: buildDir + '/js',
            jsSrcExpand: '<%= jsSrcBase %>/libs_expand',
            cssSrcBase: 'src/css',
            cssBuildBase: buildDir + '/css',
            //清理文件
            clean: {
                build: [buildDir + '/js', buildDir + '/css', buildDir + '/version']
            },
            versionSrcBase: '.version',
            versionBuildBase: buildDir + '/version',
            //编译sass
            sass: {
                dist: {
                    expand: true,
                    cwd: '<%= cssSrcBase %>',
                    src: ['**/*.scss'],
                    dest: '<%= cssSrcBase %>/<%= grunt.task.current.args[0] %>/',
                    ext: '.css'
                }
            },

            //合并
            concat: {
                /*base: {
                 src: ['<%= jsSrcBase %>/libs_base/*.js', '<%= jsSrcBase %>/core.js'],
                 dest: '<%= jsBuildBase %>/core_base_debug.js'
                 },*/
                all: {
                    src: ['<%= jsSrcExpand %>/zepto.history.js', '<%= jsSrcBase %>/bridge.js', '<%= jsSrcBase %>/core.js', '<%= jsSrcBase %>/global/*.js', '<%= jsSrcBase %>/global/**/*.js', '<%= jsSrcExpand %>/*.js'],
                    dest: '<%= jsBuildBase %>/core_all_debug.js'
                },
                app: {
                    src: ['<%= jsSrcBase %>/app/*/*.js', '<%= jsSrcBase %>/app/app.js'],
                    dest: '<%= jsBuildBase %>/app/app_all_debug.js'
                }
            },
            //压缩
            uglify: {
                build: {
                    files: {
                        /*'<%= jsBuildBase %>/core_base.js': ['<%= concat.base.dest %>'],*/
                        '<%= jsBuildBase %>/core_all.js': ['<%= concat.all.dest %>'],
                        '<%= jsBuildBase %>/app/app_all.js': ['<%= concat.app.dest %>']
                    }
                }
            },
            /*
             * https://github.com/daxingplay/grunt-css-combo
             */
            css_combo: {
                options: {},
                page: {
                    files: {
                        '<%= cssBuildBase %>/app_all.css': ['<%= cssSrcBase %>/app_all.css']
                    }
                }
            },
            /*
             * https://github.com/gruntjs/grunt-contrib-cssmin
             */
            cssmin: {
                combine: {
                    files: {
                        '<%= cssBuildBase %>/app_all.min.css': ['<%= cssBuildBase %>/app_all.css']
                    }
                }
            },
            /***********************************************************/
            http: {
                app_css: {
                    options: {
                        url: CDN_PATH + '/dd/h5/<%= version[1] %>/css/app_all.min.css',
                    },
                    files: {
                        '<%= versionSrcBase %>/<%= version[1] %>/css/app_all.min.css': 'none'
                    }
                },
                core_js: {
                    options: {
                        url: CDN_PATH + '/dd/h5/<%= version[1] %>/js/core_all.js',
                    },
                    files: {
                        '<%= versionSrcBase %>/<%= version[1] %>/js/core_all.js': 'none'
                    }
                },
                app_js: {
                    options: {
                        url: CDN_PATH + '/dd/h5/<%= version[1] %>/js/app/app_all.js',
                    },
                    files: {
                        '<%= versionSrcBase %>/<%= version[1] %>/js/app/app_all.js': 'none'
                    }
                },
            },
            incrediff: {
                incre: {
                    options: {
                        version: version,
                        chunkSize: 20,
                        dest: '<%= versionBuildBase %>',
                        newsrc: buildDir,
                        oldsrc: '<%= versionSrcBase %>',
                        format: '%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}' //支持FILEPATH,OLDVERSION,NEWVERSION三个替换
                        //最后产生的可能是 g.tbcdn.cn/dd/h5/1.3.6/.package/version/css/app_all.min.css_1.3.51
                    },
                    files: {
                        src: ['css/app_all.min.css', 'js/core_all.js', 'js/app/app_all.js']
/*                      'css/app_all.min.css' : ['css/app_all.min.css'],
                      'js/core_all.js' : ['js/core_all.js'],
                      'js/app/app_all.js' : ['js/app/app_all.js']*/
                    }
                },
            }

        });
    })

    grunt.registerTask('build_group', ['sass','clean', 'concat', 'uglify', 'css_combo', 'cssmin', 'http', 'incrediff']);
    grunt.registerTask('default', ['init', 'config', 'build_group']);
    grunt.registerTask('build', ['config', 'build_group']);

    grunt.registerTask('init', 'init the build', function() {
        buildDir = String(grunt.option('buildTo') || '.package').trim();
        buildBase = String(grunt.option('path') || '').trim();

        if (buildBase.indexOf(DAILY_PATH) != -1) {
            buildEnv = 'daily';
        }
        if (buildBase.indexOf(CDN_PATH) != -1) {
            buildEnv = 'publish';
        }

        if (!buildEnv) {
            grunt.log.error('非法的base打包路径');
            return false;
        }

        grunt.log.oklns('build to ' + buildDir + '[' + buildBase + ']');
    });
}
