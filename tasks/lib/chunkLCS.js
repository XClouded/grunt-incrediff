var chunkFunc = require('./newChunk');
var lcsFunc = require('./newLcs');

module.exports = algoWrap;
algoWrap.merge = mergeDiff;

'use strict';

/**
 * @description 对外调用做的一个包裹函数,添加了 diff, chunkSize 等通用属性(后来做了点数组优化,增加一个合并小块的过程)
 * @param {string} o 源字符串
 * @param {string} n 新字符串
 * @return {object} 差异数据对象
 */
function algoWrap (o, n) {
    var ret = ChunkLCS( 100, 0, o, n );
    var diffSequence = {'hash':[],'diff':[], chunkSize: 1};
    ret = miniLcsBlock(ret, o);
    concatDiffBlock(ret, diffSequence, true);
    return diffSequence;
}

/**
 * @description 递归调用的主函数,进入后,先试用chunk算法分出 最(较大,非绝对最大)大公共字串,及其前缀和后缀,然后对其前缀和后缀字符串递归调用该函数
 * @param {number} lcsLimit 执行lcs算法的阀值
 * @param {number} preStart 递归调用时指明后缀的开始位置
 * @param {object} arguments[2] 分情况，1个的话 是 chunkSplit生成的对象，2个的话是2个一旧一新的字符串
 * @return {object} 指定块的差异数据对象
 */
function ChunkLCS(lcsLimit, preStart) {
    var o, n;
    var arg = arguments;
//console.log('arg',arg)
    switch( arg.length ) {
        case 3:
            o = arg[2][0];
            n = arg[2][1];
            break;
        case 4:
            o = arg[2];
            n = arg[3];
            break;
    }

    var oLen = o.length;
    var nLen = n.length;

    //达到要求使用LCS
    if ( oLen * nLen <= lcsLimit * lcsLimit ) {
        return lcsAdapter( o, n, preStart );
    }

    //RSYync分块
    var chunked = chunkSplit( o, n, preStart );
    var resultBlock = [];
    //分不了块？
    if ( chunked.noFound ) {
        return lcsAdapter( o, n, preStart );
        //先这么处理，后续考虑全量修改
    }
    else {

//console.log('BLOCK 中间块', chunked.midBlock);
//console.log('BLOCK 前置块', chunked.preBlock);

        var preBlock = ChunkLCS( lcsLimit, preStart, chunked.preBlock );
        resultBlock = mergeBlock( resultBlock, preBlock );

        resultBlock = mergeBlock( resultBlock, [chunked.midBlock] );

        var subStart = chunked.midBlock[ 0 ] + chunked.midBlock[ 1 ];

//console.log('BLOCK 后置块', chunked.preBlock);

        var subBlock = ChunkLCS( lcsLimit, subStart , chunked.subBlock );
        resultBlock = mergeBlock( resultBlock, subBlock );
    }
//console.log(resultBlock)
    return resultBlock;

}

//调用chunk算法计算的封装
function getChunkDiff(o, n, chunkSize) {
    return chunkFunc( o, n, chunkSize, true ).diff;
}

//调用lcs算法计算的封装
function getLcsDiff(o, n) {
    return lcsFunc( o, n ).diff;
}

/**
 * @description 对指定的 源数据块o，和 新数据块n，执行最(较)大公共块计算,并返回含有前缀,公共,后缀信息的对象
 * @param {string} o 源数据'块'
 * @param {string} n 新数据'块'
 * @param {number} preStart 递归调用时指明后缀的开始位置
 * @return {object} splitInfo 分隔之后的信息
 */
function chunkSplit(o, n, preStart) {

    var minChunkSize = 12;

    var chunkData = getChunkDiff(o, n, minChunkSize);
    var chunkBlock;
    var maxChunkLen = -1;
    var maxChunkIndex = -1;

    var splitInfo = {};

    //找RSync回来的最长块
    for ( var i = 0, len = chunkData.length ; i < len ; i ++ ) {
        chunkBlock = chunkData[ i ];
        if ( typeof chunkBlock !== 'string' ) {
            if ( chunkBlock[1] * minChunkSize > maxChunkLen ) {
                maxChunkLen = chunkBlock[1] * minChunkSize;
                maxChunkIndex = i;
            }
        }
    }

    //找不到
    if ( maxChunkIndex === -1 ) {
//console.log('找不到公共块')
        //console.log(chunkData)
        splitInfo.noFound = true;
        //全量？？
        //理论上 是  公共块 比 minChunkSize 小 ， 会造成这样 ，然后就杂么办？全量吧
    }
    else {
        //前中后 分开
        var dLen = chunkData[ maxChunkIndex ][ 1 ] * minChunkSize;

        var dStart = chunkData[ maxChunkIndex ][ 0 ] * minChunkSize;
        var dEnd = dStart + dLen;

        var dnStart = n.indexOf( o.substring( dStart, dEnd ) );
        var dnEnd = dnStart + dLen;

        splitInfo.midBlock = [ dStart + preStart, dLen ];

        splitInfo.preBlock = [
            o.substring( 0, dStart ) ,
            n.substring( 0, dnStart )
        ];

        splitInfo.subBlock = [
            o.substring( dEnd, o.length ) ,
            n.substring( dnEnd, n.length )
        ];

        //console.log('pre', splitInfo.preBlock)
        //console.log('sub', splitInfo.subBlock)
    }

    return splitInfo;

}

/**
 * @description lcs算法适配器，需要适配 preStart的预制数，必须加上，否则会错乱
 * @param {string} o 源数据'块'
 * @param {string} n 新数据'块'
 * @param {number} preStart 递归调用时指明后缀的开始位置
 * @return {object} lcsDiff 经过preStart修正的 差异数据
 */
function lcsAdapter(o, n, preStart) {
    var lcsDiff = getLcsDiff(o, n);
    var lcsBlock;
    for ( var i = 0, len = lcsDiff.length ; i < len ; i ++ ) {
        lcsBlock = lcsDiff[ i ];
        if ( typeof lcsBlock !== 'string' ) {
            lcsBlock[ 0 ] += preStart;
        }
    }
//console.log('lcs算法', '旧',o,'新', n, '差异', lcsDiff )
    return lcsDiff;
}

//把2个差异合并， 考虑队末队首相连
/**
 * @description 由于chunkSplit进行了前中后的拆分，这是重新组装的函数，并且要考虑两个差分数组拼接时连接处是否可以合并的问题
 * @param {object} source 被组装的前面部分
 * @param {object} addition 被组装的后面部分
 * @return {object} source 组装好的结果
 */
function mergeBlock(source, addition) {
    var sLen = source.length;
    var aLen = addition.length;

//console.log('合并 source', source)
//console.log('合并 addition', addition)

    if ( sLen === 0 )
        return addition;
    if ( aLen === 0 )
        return source;

    var sLast = source[ sLen-1 ];
    var aFirst = addition[ 0 ];

    if ( typeof sLast !== 'string' && typeof aFirst !== 'string' ) {

        if ( sLast[ 0 ] + sLast[ 1 ] === aFirst[ 0 ] ) {

            sLast[ 1 ] += aFirst[ 1 ];
            addition.shift();

        }

    }
    else if ( typeof sLast === 'string' && typeof aFirst === 'string' ) {

        sLast += aFirst;
        addition.shift();

    }

    source = source.concat( addition );
//console.log('合并 merge', source )
    return source;

}

//把lcs之后长度小于4的块都处理成字符
/**
 * @description 后期发现的一个问题, 本算法能精确到字节级别,那么即chunkSize分块大小===1,所以后期会出现好多[123123,1],这代表了源字符串的一个字符，却要占用10个左右的字节进行表示，对这种情况，直接插入字符，节省差异数据
 * @param {object} diff 差异对象
 * @param {string} o 源字符串，从中取需要的
 * @return {object} newDiff 新差异对象，优化之后的
 */
function miniLcsBlock(diff, o) {
    var newDiff = [];
    var i, len, d;
    for( i=0, len=diff.length; i<len; i++ ) {
        d = diff[i];
        if ( typeof d === 'string' ) {
            newDiff.push( d );
        }
        else if ( d.length === 2 && d[1] <= 8 ) {
            newDiff.push( o.substr(d[0], d[1]) );
        }
        else {
            newDiff.push( d );
        }
    }
    return newDiff;
}
//把diffHash的相邻块合并
function concatDiffBlock(diff, seq, noIndex) {
    var len = diff.length,
        d,
        preStr = '',
        i;
    for ( i = 0 ; i < len ; i ++) {
        d = diff[i];
        if ( typeof d === 'string') {
            preStr += d;
        }
        else {
            if ( preStr.length ) {
                seq.diff.push( preStr );
                preStr = '';
            }
            seq.diff.push( d );
        }
    }
    if ( preStr.length ) {
        seq.diff.push( preStr );
    }
}


function mergeDiff(o, chunkSize,  diff) {
    var len = diff.diff.length,
        diffItem,
        retStr = [],
        i;
    chunkSize = 1;
    for ( i = 0 ; i < len ; i++ ) {
        diffItem = diff.diff[i];
        if ( typeof diffItem === 'string' ) {
            retStr.push( diffItem );
        }
        else if ( diffItem.length === 1) {
            retStr.push( hash[ diffItem[ 0 ] ] );
        }
        else {
            retStr.push( o.substr( diffItem[ 0 ] * chunkSize, diffItem[ 1 ] * chunkSize ) );
        }
    }
    return retStr.join('');
}

// var fs = require( 'fs' )
// var origin = fs.readFileSync('app_all.min.1.3.61.css','utf8')
// var newstr = fs.readFileSync('app_all.min.1.3.7.css','utf8')

// var origin = "123456789";
// var newstr = "3xad567890";

// var bt = (new Date()).getTime();
// var result =algoWrap( origin, newstr )
// var et = (new Date()).getTime();

// console.log(result)
// console.log(et-bt, JSON.stringify(result).length)
// console.log( newstr=== mergeDiff(origin,1,result) )

