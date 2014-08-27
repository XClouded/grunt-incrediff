module.exports = ChunkExt;
ChunkExt.merge = mergeDiff;
function ChunkExt(o, n, chunkSize, noIndex) {
    var originHash = {},    /*o字符串分块后每块的hash标记，MT使用md5，
                            但javascript的object本身就维护了一个hashmap为啥还用别的散列计算呢。。。*/
        diffRecord = [],    /*记录n字符串相对于o串的差异，按照每个block存储*/
        diffHash = {},    /*在生成diffSequence时辅助记录新增子字符串的hashMap*/
        diffSequence = {'hash':[],'diff':[]},   /*把diffRecord中的连续块合并后存储*/
        i;
    var hashPrefix = '_ChunkHash_';

        generateOriginBlock(o, chunkSize, originHash);
      //  console.log(originHash);

        generateDiffBlock(originHash, n, chunkSize, diffRecord);
      //  console.log(diffRecord);

        concatDiffBlock(diffRecord, diffSequence, noIndex);
      //  console.log(diffSequence);

        diffSequence.chunkSize = chunkSize;

        return diffSequence;

    //由o原始字符串生成对应block的hashmap
    /**
     * @description 由o原始字符串按照chunkSize分块大小生成对应块的hashmap，用来标记块是否存在
     * @param {string} o 原始字符串
     * @param {number} chunkSize 分块大小
     * @param {object} originHash hashmap记录
     */
    function generateOriginBlock(o, chunkSize, originHash) {
        var _hashID = 0,     //分块标号
            _startPos = 0,  //每块起始position
            _blockStr,
            len = o.length;

        while ( _startPos < len ) {
            _blockStr = o.substr( _startPos, chunkSize );   //取当前文本块

            originHash[ hashPrefix+_blockStr ] = originHash[ hashPrefix+_blockStr ] || [];    //若该hash不存在则新建数组
            originHash[ hashPrefix+_blockStr ].push( _hashID );                    //把分块标号放进去

            _hashID ++ ;
            _startPos += chunkSize; //每次右移一个chunkSize
        }
    }

    //产生差异diff,按block分隔
    /**
     * @description 对n按照rsync的思想进行滑动块查询，如果在originHash中查询到了就是未被修改，没查询到就当做新增一个字节然后继续，把生成的差异数据存入diffRecord
     * @param {object} originHash hashmap记录
     * @param {string} n 目标新字符串
     * @param {number} chunkSize 分块大小
     * @param {object} diffRecord 差异数据
     */
    function generateDiffBlock(originHash, n, chunkSize, diffRecord) {
        var _hashID,
            _startPos = 0,
            _blockStr,
            _addStr = [],
            priorHashID = -1,
            len = n.length;

        while ( _startPos < len ) {
            _blockStr = n.substr( _startPos, chunkSize);    //取当前文本块
            if ( originHash[ hashPrefix+_blockStr ] ) {
                //如果存在hash记录,即该块(99%)不为新增块
                //先把_addStr的字符串全输出到diffRecord中,然后寻找originHash中对应hashID
                if ( _addStr.length ) {
                    diffRecord.push( _addStr.join('') );
                    _addStr.length = 0;
                }
                _hashID = getCorrectHashID( _blockStr, priorHashID);
                diffRecord.push( _hashID );

                priorHashID = _hashID;
                _startPos += chunkSize;
            }
            else {
                //为新增字符,放到_addStr里先存着
                //_addStr += n.charAt( _startPos );
                _addStr.push( n.charAt( _startPos ) );
                _startPos += 1;
            }
        }
        //循环结束再把剩余_addStr输出一下
        if ( _addStr.length ) {
            diffRecord.push( _addStr.join('') );
            _addStr.length = 0;
        }
    }

    /*寻找最优分块hashID,毕竟不是LCS的O(N^2)复杂度,做不到最优,
    采用这个O(N)的遍历来寻找一个相对最优的*/
    /**
     * @description 寻找最优分块hashID,由于复杂度原因，不可能做到绝对最优，采用这个O(N)的遍历来寻找一个相对最优的，找一个距离上次正确匹配最相近的匹配块
     * @param {string} curStr 需要查找的块
     * @param {number} priorHashID 最近一次成功匹配
     * @return {number} 返回最优匹配块号
     */
    function getCorrectHashID(curStr, priorHashID) {
        var _curHashs = originHash[ hashPrefix+curStr ],
            len = _curHashs.length,
            _curHashID,
            i;

        if ( len === 1 ) {
            return _curHashs[ 0 ];
        }
        else {
            //整体就是寻找一个hashID，距离priorHashID距离最近
            //可以改成二分查找，但是一般的len<10，几乎没意义
            for ( i = 0 ; i < len ; i++ ) {
                _curHashID = _curHashs[i];
                if ( _curHashID > priorHashID ) {
                    break;
                }
            }

            if ( i === len ) {
                return _curHashs[ len - 1 ];
            }
            else if ( i === 0 ) {
                return _curHashs[ 0 ];
            }
            else {
                return (( _curHashs[ i ] + _curHashs[ i-1 ] )>> 1) > priorHashID ? _curHashs[ i-1 ] : _curHashs[ i ] ;
            }
        }
    }

    //把diffHash的相邻块合并
    /**
     * @description 把相邻的 数组标记块 或者 相邻的字符 连接起来，节省空间
     * @param {object} diff 差异数组，[[0,1],[1,1],'2','3']
     * @param {object} seq 连接之后存储在这里,会被处理成 [[0,2], '23']
     * @param {boolean} noIndex TRUE时不适用hash存储字符串，FALSE时使用
     */
    function concatDiffBlock(diff, seq, noIndex) {
        var len = diff.length,
            d,
            _hashID = 0,
            _lastHashID = -2,
            _count = 0,
            _strHashIDCount = 0,
            i;
        for ( i = 0 ; i < len ; i ++) {
            d = diff[i];
            if ( typeof d === 'string') {
                //先把_count记录的填回去,然后再加入d字符串
                if ( _count ) seq.diff.push( [_hashID, _count] );
                _count = 0;

                if ( noIndex ) {
                    seq.diff.push( d );
                }
                else {
                    if ( typeof diffHash[ hashPrefix + d ] === 'undefined') {
                        diffHash[ hashPrefix + d ] = _strHashIDCount++;
                        seq.hash[ diffHash[ hashPrefix + d ] ] = d;
                    }
                    seq.diff.push( [ diffHash[ hashPrefix + d ] ] );
                }


            }
            else {
                //是否连续,不连续则填回去,初始化_count
                if ( _lastHashID + 1 !== d ) {
                    if ( _count ) seq.diff.push( [_hashID, _count] );
                    _count = 0;
                }
                if ( !_count ) {
                    _hashID = d;
                }
                _lastHashID = d;
                _count ++;
            }
        }
        if ( _count ) seq.diff.push( [_hashID, _count] );
    }
}

function mergeDiff(o, chunkSize, diff) {
    var len = diff.diff.length,
        hash = diff.hash,
        diffItem,
        retStr = [],
        i;
        chunkSize = diff.chunkSize || chunkSize;
    for ( i = 0 ; i < len ; i++ ) {
        diffItem = diff.diff[i];
        if ( typeof diffItem === 'string' ) {
            retStr.push( diffItem );
        }
        else if ( diffItem.length == 1) {
            retStr.push( hash[ diffItem[ 0 ] ] );
        }
        else {
            retStr.push( o.substr( diffItem[ 0 ] * chunkSize, diffItem[ 1 ] * chunkSize ) );
        }
    }
    return retStr.join('');
}