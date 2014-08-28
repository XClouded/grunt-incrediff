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
	枚举类型 `chunk` / `chunklcs`/`auto`，两种差分算法
	  `chunk`: 时间复杂度低,当差异巨大,(如两个完全不同的文件时),此算法速度较快,但差异文件较大
	  `chunklcs`: 时间复杂度略高,当差异巨大时,速度较慢,300K的文件间比较能跑5s左右,但在差异小时数据量很小,大约是 `chunk` 算法的 80% 左右
	  `auto`: 自动选择两者之间 数据量小的那个

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
			                algorithm: 'auto',
							cdnUrl: 'http://cdnurl/pathprefix/',
			            },
			        files: {
			            src: ['path/to/css.css', 'path/to/js.js']
			            }
			        },
			    }
		});

2. **如果将 `version: ["1.0.1","1.0.0"]`变量单独放在其他文件中，请主动修改**
3. 本地执行 `grunt incrediff` / 服务端自动 `grunt` 时会生成到指定目录
4. **增加差异输出强校验，会对差异进行一次合并测试，如果合并测试失败则grunt会fail(如果算法某些点没测试到可能报错)**

### 差异数据文件格式

1.	默认文件命名 `format: '%{FILEPATH}_%{OLDVERSION}_%{NEWVERSION}.js'`,即生成 `path/to/file.ext_1.0.0_1.0.1.js` 文件
2.	文件中的内容
	-	差异数据 `var data = {hash: (Array), diff: (Array), chunkSize: (Number)};`
		-	示例 
			-	`originStr = '1234567u'`
			-	`targetStr = '12abc567u'`
			-	`{hash: ['abc'], diff: [ [0,1], [0], [2,2] ], chunkSize: 2}`
		-	`data.hash` 表示 可以把 `data.diff` 中的重复字符串存到 `data.hash` 数组中节省空间(可选)
		-	`data.diff` **表示 有3种结构，按以下解释，依次连接起来即能生成 `targetStr`**
			-	`[x, y]`	 : 表示 `originStr.substr( x * data.chunkSize, y * data.chunkSize );`
			-	`[i]`		 : 表示 `data.hash[i]`
			-	`'string'` : 表示 字符串
		-	`data.chunkSize` 表示 分块大小，`chunk`算法默认为**20** / `chunklcs`算法默认为**1**
	-	对差异数据进行以下操作
		-	**`var write = JSON.stringify( data ) + '/*"""*/';`**
		-	`fs.writeSync(pathto, write, 'utf8');`
		-	执行此操作的原因：
			-	为了考虑到把文件放在CDN上，让多个文件能被combo下载后在客户端能正常分割开
			-	需要对每个差异文件标记分隔符 **`/*"""*/`** (考虑css和js会被一次combo起来)
			-	由于JSON.stringify处理后 形如`"`,`\`等字符会被转义处理, 因此 分隔符 **`/*"""*/`**在理论上并不会在 data的转义序列中出现, 不会出现本地误识别的情况
	-	文件中最终内容示例
		-	URL: http://g.assets.daily.taobao.net/dd/h5/1.3.772/js/app/app_all.js_1.3.771_1.3.772.js
		-	`{"hash":[],"diff":[[0,115765],[115796,673],";console.log(\"进入1.3.772 静态渲染方法\");var ",[116470,105278]],"chunkSize":1}/*"""*/`
		
### 单独调用

#### 1. chunk 算法

> 	var diff = require('./tasks/lib/newChunk');
> 	var oldS = '1234567890';
> 	var newS = '12345678toString90';
> 
> **生成差异**
> 
> 	var d = diff(oldS, newS, 2, true /*是否不压缩字符串*/);
> 
> **合并差异**
> 
> 	var m = diff.merge(oldS, null /*若d不带chunkSize可以外部输入*/, d)

#### 2. chunkLcs 算法

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
**以下内容为代码实现逻辑，当发现bug/需要修改代码逻辑的时候可以参考一下**

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
> 根据输入新旧数据源计算差异，并存储到指定位置，如果algorithm === 'auto' 则会调用两个方法分别运算选取数据量小的那个

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
> **可以参照 rsync算法描述**

- *入参*
	- {object} originHash hashmap记录
	- {string} n 目标新字符串
	- {number} chunkSize 分块大小
	- {object} diffRecord 差异数据
- *返回*
	- *无*

**getCorrectHashID**  
> 寻找最优分块hashID,由于复杂度原因，不可能做到绝对最优，采用这个O(N)的遍历来寻找一个相对最优的，找一个距离上次正确匹配最相近的匹配块

- *入参*
	- {string} curStr 需要查找的块
	- {number} priorHashID 最近一次成功匹配
- *返回*
	- {number} 返回最优匹配块号

**concatDiffBlock**  
> 把相邻的 数组标记块 或者 相邻的字符 连接起来，节省空间

- *入参*
	- {object} diff 差异数组，[[0,1],[1,1],'2','3']
	- {object} seq 连接之后存储在这里,会被处理成 [[0,2], '23']
	- {boolean} noIndex TRUE时不适用hash存储字符串，FALSE时使用
- *返回*
	- *无*

#### 执行逻辑

-	`generateOriginBlock` 计算源数据分块哈希映射
-	`generateDiffBlock` 根据源哈希映射 和 新数据 计算差异
	-	`getCorrectHashID` 计算寻找较优匹配
-	`concatDiffBlock` 把差异中满足一定条件的相邻块合并

### lib/newLcs DOC

#### 调用方法

**lcsDiff**
>  时间、空间复杂度均为O(N^2)，在 dp 中存储编辑距离， 在 step 中存储具体路径，然后进行一些处理把差异规则化

- *入参*
	- {string} o 源字符串
	- {string} n 新字符串
- *返回*
	- {object} 差异数据对象

**buildPaths**
>  由于路径是逆序记录在二维数组中的，需要重新遍历路径才能得到一维的编辑路径

- *入参*
	- {number} i 数组一维大小，源字符串长度
	- {number} j 数组二维大小，新字符串长度
	- {string} o 源字符串
	- {string} n 新字符串
	- {object} step 路径二维数组
- *返回*
	- {array} infoQueue 路径一维数据，MOD/EQUAL/DEL/ADD

**buildDiff**
>  处理之前构造的一维路径数组,把MOD/EUQALL/DEL/ADD,转换成 和newChunk一样的形式

- *入参*
	- {array} infoPaths 构造的一维路径数组
- *返回*
	- {array} diffQueue 基本差异数组,还没有优化过

**concatDiff**
>  把生成的差异数组中符合一定条件的相邻项进行合并,同newChunk中的concatDiffBlock,合并相邻 数组或相邻字符

- *入参*
	- {array} diffQueue 基本差异数组,还没有优化过
- *返回*
	- {array} sequence 优化完成的数组

#### 执行逻辑

-	`lcsDiff` 先跑动态规划,把编辑距离路径记录的二维数组跑出来
	-	`buildPaths` 根据二维路径生成一维最短编辑路径,二维包好了所有编辑路径,不论好坏,生成的一维是最优解
	-	`buildDiff` 把之前的一维路径的结果(MOD/EUQALL/DEL/ADD)处理成仅由 源字符串o.substr 和 新字符串 拼接就能构成的[[0,2], '23']如此的数组形式
	-	`concatDiff` 优化,拼接差异数组中满足某些特定条件的相邻项(数组相邻 或 都是字符串)

### lib/chunkLcs DOC

#### 调用方法

**algoWrap**
>  对外调用做的一个包裹函数,添加了 diff, chunkSize 等通用属性(后来做了点数组优化,增加一个合并小块的过程)

- *入参*
	- {string} o 源字符串
	- {string} n 新字符串
- *返回*
	- {object} 差异数据对象

**ChunkLCS**
>  递归调用的主函数,进入后,先试用chunk算法分出 最(较大,非绝对最大)大公共字串,及其前缀和后缀,然后对其前缀和后缀字符串递归调用该函数

- *入参*
	- {number} lcsLimit 执行lcs算法的阀值
	- {number} preStart 递归调用时指明后缀的开始位置
	- {object} arguments[2] 分情况，1个的话 是 chunkSplit生成的对象，2个的话是2个一旧一新的字符串
- *返回*
	- {object} 指定块的差异数据对象

**chunkSplit**
>  对指定的 源数据块o，和 新数据块n，执行最(较)大公共块计算,并返回含有前缀,公共,后缀信息的对象

- *入参*
	- {string} o 源数据'块'
	- {string} n 新数据'块'
	- {number} preStart 递归调用时指明后缀的开始位置
- *返回*
	- {object} splitInfo 分隔之后的信息

**lcsAdapter**
>  lcs算法适配器，需要适配 preStart的预制数，必须加上，否则会错乱

- *入参*
	- {string} o 源数据'块'
	- {string} n 新数据'块'
	- {number} preStart 递归调用时指明后缀的开始位置
- *返回*
	- {object} lcsDiff 经过preStart修正的 差异数据

**mergeBlock**
>  由于chunkSplit进行了前中后的拆分，这是重新组装的函数，并且要考虑两个差分数组拼接时连接处是否可以合并的问题

- *入参*
	- {object} source 被组装的前面部分
	- {object} addition 被组装的后面部分
- *返回*
	- {object} source 组装好的结果

**miniLcsBlock**
>  后期发现的一个问题, 本算法能精确到字节级别,那么即chunkSize分块大小===1,所以后期会出现好多[123123,1],这代表了源字符串的一个字符，却要占用10个左右的字节进行表示，对这种情况，直接插入字符，节省差异数据

- *入参*
	- {object} diff 差异对象
	- {string} o 源字符串，从中取需要的
- *返回*
	- {object} newDiff 新差异对象，优化之后的

#### 执行逻辑

-	`algoWrap` 计算差异
	-	最初调用 `ChunkLCS` ,初始化参数 `ChunkLCS( 100, 0, o, n )`
		-	若满足 lcsLimit 条件,调用 `lcsAdapter` 计算差异并返回
		-	若不满足
			-	调用 `chunkSplit` 寻找 最(较)大公共字符串, 并对其前缀和后缀分别 递归调用 `ChunkLCS` 计算差异
			-	对计算完成的 前缀和后缀 调用 `mergeBlock` 合并差异
	-	得到完整差异后, 调用 `miniLcsBlock` 进行数据优化合并

