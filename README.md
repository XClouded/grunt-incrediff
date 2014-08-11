# grunt-incrediff
grunt端调用newChunk产生文件间增量更新差异数据

## 注意
仅支持 alibaba 内部 gitlab 构建时 grunt，其他环境路径不同不保证需求


## 安装

通过 npm 安装：

`
$ npm install grunt-incrediff -g
`

## 配置

<code>
GruntFiles.js
</code>

	version: [],   
	指定要生成差异文件的原始文件的版本号,如["1.0.2","1.0.1","1.0.0"]，
	
	chunkSize: 20,   
	newChunk算法调用时使用的参数，分块大小，建议>=10
	
	isSingleDiff: true,    
	若 `isSingleDiff` 为 true ，则
	生成 v[1]旧版 和 v[0]新版 的差异文件，否则生成 v[1-end] 和 v[0]新版 的所有差异文件
	
	isHashStr: true,
	生成差异信息中，是否压缩重复字符串
	
	sourceFormat:  '%{CDNURL}/%{NEWVERSION}/%{FILEPATH}',   
	CDN上原始文件的获取地址
	
	format: '%{FILEPATH}\_%{OLDVERSION}\_%{NEWVERSION}.js'    
	需要生成在build目录的差异文件的路径
	
	dest: 'build'    
	差异文件生成目录
	
	newsrc: 'build'    
	新版本文件在之前的grunt构建中的生成目录
	

## 使用

	grunt.initConfig({
 		incrediff: {
  			incre: {
 				options: {
 					version: ["1.0.1","1.0.0"],
 					chunkSize: 20, 
                    isSingleDiff: true,
                    dest: 'build',
                    sourceFormat: '%{CDNURL}/%{NEWVERSION}/%{FILEPATH}',
                    format: '%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}.js',
                    newsrc: 'build',
					cdnUrl: 'http://cdnurl/pathprefix/',
                },
            files: {
                src: ['path/to/css.css', 'path/to/js.js']
                }
            },
        }
	});


## 单独调用

	var diff = require('./tasks/lib/newChunk');
	var oldS = '1234567890';
	var newS = '12345678toString90';

**生成差异**

	var d = diff(oldS, newS, 8 /*chunkSize 分块大小*/, true /*是否不压缩字符串*/);

**合并差异**

	var m = diff.merge(oldS, null /*若d不带chunkSize可以外部输入*/, d)


