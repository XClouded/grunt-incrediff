grunt-incrediff
==================

> grunt构建时自动生成文件间增量更新差异数据

## 使用文档

### 注意
- 仅支持 alibaba gitlab 构建时 grunt，其他环境路径不同不保证需求(可能因为CDN路径不同需要修改options)  
- 模块加入 `chunk` / `chunkLcs` 两种差异生成算法，各有使用场景，为了避免算法的不完备性导致差异生成错误，加入强校验，若生成的差异合并失败会使grunt过程fail。

### 安装

通过 npm 安装：

`
$ npm install grunt-incrediff -g
`

### 配置使用

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
	
	sourceFormat:  '%{CDNURL}/%{OLDVERSION}/%{FILEPATH}',   
	CDN上原始文件的获取地址，此处的oldversion 
	  当`isSingleDiff===FALSE`时会匹配 version[>=1]的所有元素，
 	  当`isSingleDiff===TRUE`时会匹配 version[1]的元素
	
	format: '%{FILEPATH}\_%{OLDVERSION}\_%{NEWVERSION}.js'    
	需要生成在build目录的差异文件的路径
	
	dest: 'build'    
	差异文件生成目录
	
	algorithm: 'chunk'    
	枚举类型 `chunk` / `chunklcs`，两种差分算法
	  `chunk`: 时间复杂度低,当差异巨大,(如两个完全不同的文件时),此算法速度较快,但差异文件较大
	  `chunklcs`: 时间复杂度略高,当差异巨大时,速度较慢,300K的文件间比较能跑5s左右,但在差异小时数据量很小,大约是 `chunk` 算法的 60% 左右
	
	newsrc: 'build'    
	新版本文件在之前的grunt构建中的生成目录

	cdnUrl: 'http://g.assets.daily.taobao.net/dd/h5/'
	CDN存储路径, 会从此地址下拉取 旧版本 资源文件

### 构建步骤
1. grunt 配置 

		grunt.initConfig({
				incrediff: {
					incre: {
						options: {
							version: ["1.0.1","1.0.0"],
							chunkSize: 20, 
			                isSingleDiff: true,
			                dest: 'build',
			                sourceFormat: '%{CDNURL}/%{OLDVERSION}/%{FILEPATH}',
			                format: '%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}.js',
			                newsrc: 'build',
			                algorithm: 'chunk',
							cdnUrl: 'http://cdnurl/pathprefix/',
			            },
			        files: {
			            src: ['path/to/css.css', 'path/to/js.js']
			            }
			        },
			    }
		});

2. 如果将 `version: ["1.0.1","1.0.0"]`变量单独放在其他文件中，请主动修改
3. 本地执行 `grunt incrediff` / 服务端自动 `grunt` 时会生成到指定目录
4. **增加差异输出强校验，会对差异进行一次合并测试，如果合并测试失败则grunt会fail(如果算法某些点没测试到可能报错)**


### 单独调用

#### 1. chunk 算法
> 
> 	var diff = require('./tasks/lib/newChunk');
> 	var oldS = '1234567890';
> 	var newS = '12345678toString90';
> 
> **生成差异**
> 
> 	var d = diff(oldS, newS, 8 /*chunkSize 分块大小*/, true /*是否不压缩字符串*/);
> 
> **合并差异**
> 
> 	var m = diff.merge(oldS, null /*若d不带chunkSize可以外部输入*/, d)
> 
#### 2. chunkLcs 算法
> 
> 	var diff = require('./tasks/lib/chunkLCS');
> 	var oldS = '1234567890';
> 	var newS = '12345678toString90';
> 
> **生成差异**
> 
> 	var d = diff(oldS, newS);
> 
> **合并差异**
> 
> 	var m = diff.merge(oldS, null, d);
> 

## 代码文档
**其实啊...直接去看代码最好...算法都写在那里...**

### 目录说明

-	/tasks
	-	/incrediff.js	grunt插件代码
	-	/libs
		-	newChunk.js		`chunk` 差分算法实现
		-	newLcs.js		`lcs` 算法实现,复杂度太高不提供外部调用
		-	chunkLCS.js		`chunkLcs` 两种算法结合,具体实现

### incrediff DOC

#### 依赖项
	/* http请求，下载历史版本文件 */
	request = require('request')
    async = require('async')

    /* 显示差异文件大小 */
    maxmin = require('maxmin')
    chalk = require('chalk')

    /* 差异算法库 */
    diff = require('./lib/newChunk')

#### 调用方法

**responseHandler**  
> http响应的回调，为了获取dest, done, container, _name, url, cnt, all，而产生的闭包

- *入参*
	- {object} done async异步回调对象
	- {object} container 统一存储下载下来的字符串
	- {string} _name 存储的名称
	- {string} url 下载路径，显示用
	- {string} cnt 下载顺序，显示用
	- {string} all 下载总数，显示用
- *返回*
	- {Function} 返回闭包函数,用于request回调执行

**strFormat**  
> 字符串处理格式化，按照指定的  %{XXX} 进行替换

- *入参*
	- {string} source 源格式串
	- {object} kvd 替换数据
- *返回*
	- {string} 结果字串


**generateDiffData**  
> 根据输入新旧数据源计算差异，并存储到指定位置

- *入参*
	- {string} newdata 新数据源
	- {string} olddata旧数据源
	- {string} oldver 旧版本号
	- {string} path 存储路径
- *返回*
	- *无*

**generateFullData**  
> 根据输入数据源生成全量数据，并存储到指定位置，(考虑到所有文件,包括CSS和JS能被combo在一起,必须要做一定处理,让本地接收时能够分离成单个文件)

- *入参*
	- {string} 数据内容
	- {string} path 存储路径
- *返回*
	- *无*

#### 执行逻辑

-	初始化 options  
	详见 *配置使用*
	-	 路径修正(添加'/'或去除'/')
	-	 版本修正(添加最后一个''元素)
	-	 根据配置选择差分算法('chunk'/'chunkLcs')
-	读取本地最新资源文件(由之前的grunt生成的),存入`newContent`数组
-	根据 `sourceFormat` 的格式生成需要下载的旧版本资源文件URL,存入`reqQueue`数组
-	调用`async.each(reqQueue, ***)` 对所有指定旧版本资源进行下载,把下载后文本存入`reqContent`
-	`async.each` 全部执行done之后,开始生成差异
	-	调用 `generateDiffData` 生成 版本间差异数据
	-	调用 `generateFullData` 生成 全量更新数据


### lib/newChunk DOC

#### 调用方法

**generateOriginBlock**  
> 由o原始字符串按照chunkSize分块大小生成对应块的hashmap，用来标记块是否存在

- *入参*
	- {string} o 原始字符串
	- {number} chunkSize 分块大小
	- {object} originHash hashmap记录
- *返回*
	- *无*

**generateOriginBlock**  
> 对n按照rsync的思想进行滑动块查询，如果在originHash中查询到了就是未被修改，没查询到就当做新增一个字节然后继续，把生成的差异数据存入diffRecord

- *入参*
	- {object} originHash hashmap记录
	- {string} n 目标新字符串
	- {number} chunkSize 分块大小
	- {object} diffRecord 差异数据
- *返回*
	- *无*
