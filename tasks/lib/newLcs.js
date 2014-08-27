module.exports = lcsDiff;
lcsDiff.merge = mergeDiff;
function lcsDiff(o, n) {
    /**
     * @description 时间、空间复杂度均为O(N^2)，在 dp 中存储编辑距离， 在 step 中存储具体路径，然后进行一些处理把差异规则化
     * @param {string} o 源字符串
     * @param {string} n 新字符串
     * @return {object} 差异数据对象
     */
    var OP_ADD = 1, OP_DEL = 2, OP_MOD = 3, OP_EQUAL = 0;

    var oLen = o.length, nLen = n.length;
    var id   = String.prototype.charAt;

    var dp   = init2DArray( oLen+1, nLen+1, true);
    //dp 已初始化好，dp需要把 第一行列 初始化好
    var step = init2DArray( oLen+1, nLen+1 );

    //初始化 step
    for( var i = 1; i <= oLen ; i++ )
        step[ i ][0] = OP_DEL;
    for( var j = 1; j <= nLen ; j++ )
        step[0][ j ] = OP_ADD;

    //动态规划 在step中生成路径
    for ( var i = 1 ; i <= oLen ; i++ ) {
        for ( var j = 1 ; j <= nLen ; j++ ) {
            var InEqual = id.call( o, i-1 ) !== id.call( n, j-1 ) ? 1 : 0;
            var eleArr  = [
                    dp[ i-1 ][ j ] + 0  ,   //删除
                    dp[ i ][ j-1 ] + 1  ,   //新增
                    dp[ i-1 ][ j-1 ] + InEqual    // 0:相同不变, 1:不同修改
                ];
            //路径记录
            switch( minimum( eleArr ) ) {       //在数组中找到最小的元素的序号
                case 0:
                    dp[i][j]   = eleArr[ 0 ];   //删除
                    step[i][j] = OP_DEL;
                    break;
                case 1:
                    dp[i][j]   = eleArr[ 1 ];   //新增
                    step[i][j] = OP_ADD;
                    break;
                case 2:
                    dp[i][j]   = eleArr[ 2 ];   //修改 或 不变
                    step[i][j] = InEqual ? OP_MOD : OP_EQUAL;
                    break;
            }
        }
    }


    //解析路径(跟着走一遍)
    var infoPaths = buildPaths( oLen, nLen, o, n, step );
    //转换成差异队列
    var diffQueue = buildDiff(infoPaths);

    //合并差异队列
    return { diff: concatDiff(diffQueue), chunkSize: 1 };

    /**
     * @description 进行动态规划时的 数组初始化
     * @param {number} I 数组一维大小，源字符串长度
     * @param {number} J 数组二维大小，新字符串长度
     * @param {boolean} dp TRUE: 还要额外执行数据初始化，FALSE: 只建立二维数组
     * @return {array} ret 动态规划数组
     */
    function init2DArray(I, J, dp) {
        var ret = [];
        for ( var i = 0 ; i < I; i ++ ) {
            ret[ i ] = new Array(J);
            if (dp) ret[ i ][ 0 ] = i;
        }
        if (dp) {
            for ( var j = 0 ; j < J ; j++ ) {
                ret[ 0 ][ j ] = j;
            }
        }
        return ret;
    }

    /**
     * @description 寻找arg这个数组中最小的那个
     * @param {array} arg 被查询的数组
     * @return {number} 最小元素的index
     */
    function minimum(arg) {
        var min = 0;
        for ( var i = 0; i < arg.length; i++ ) {
            if ( arg[i] < arg[ min ] ) min = i;
        }
        return min;
    }

    /**
     * @description 由于路径是逆序记录在二维数组中的，需要重新遍历路径才能得到一维的编辑路径
     * @param {number} i 数组一维大小，源字符串长度
     * @param {number} j 数组二维大小，新字符串长度
     * @param {string} o 源字符串
     * @param {string} n 新字符串
     * @param {object} step 路径二维数组
     * @return {array} infoQueue 路径一维数据，MOD/EQUAL/DEL/ADD
     */
    function buildPaths(i, j, o, n, step) {
        var infoQueue = [];
        var id = String.prototype.charAt;
        var OP_ADD = 1, OP_DEL = 2, OP_MOD = 3, OP_EQUAL = 0;

        //从数组 [oLen][nLen] -> 一直走到 [0][0] break

        while ( true ) {
            if ( !i && !j ) break;
            switch( step[i][j] ) {
                case OP_MOD:
                    infoQueue.unshift( {
                        type: OP_MOD,
                        data: [ id.call(o, i-1), id.call(n, j-1) ]
                    } )
                    i -= 1; j -= 1;
                    break;
                case OP_EQUAL:
                    infoQueue.unshift( {
                        type: OP_EQUAL,
                        data: null
                    } )
                    i -= 1; j -= 1;
                    break;
                case OP_DEL:
                    infoQueue.unshift( {
                        type: OP_DEL,
                        data: [ id.call(o, i-1) ]   //其实并不用关心del哪个元素
                    } )
                    i -= 1;
                    break;
                case OP_ADD:
                    infoQueue.unshift( {
                        type: OP_ADD,
                        data: [ id.call(n, j-1) ]
                    } )
                    j -= 1;
                    break;
            }
        }

        return infoQueue;
    }

    /**
     * @description 处理之前构造的一维路径数组,把MOD/EUQALL/DEL/ADD,转换成 和newChunk一样的形式
     * @param {array} infoPaths 构造的一维路径数组
     * @return {array} diffQueue 基本差异数组,还没有优化过
     */
    function buildDiff(infoPaths) {
        var originIndex = 0;
        var diffQueue = [];
        var OP_ADD = 1, OP_DEL = 2, OP_MOD = 3, OP_EQUAL = 0;

        for ( var i = 0, len = infoPaths.length; i < len ; i ++ ) {
            var info = infoPaths[ i ];

            switch( info.type ) {
                case OP_ADD:
                    diffQueue.push( info.data[ 0 ] );
                    break;
                case OP_DEL:
                    originIndex ++;
                    break;
                case OP_EQUAL:
                    diffQueue.push( [ originIndex, 1 ] );
                    originIndex ++;
                    break;
                case OP_MOD:
                    diffQueue.push( info.data[ 1 ] );
                    originIndex ++;
                    break;
            }
        }

        return diffQueue;
    }

    /**
     * @description 把生成的差异数组中符合一定条件的相邻项进行合并,同newChunk中的concatDiffBlock,合并相邻 数组或相邻字符
     * @param {array} diffQueue 基本差异数组,还没有优化过
     * @return {array} sequence 优化完成的数组
     */
    function concatDiff(diffQueue) {
        var countIndex     = 0;
        var lastMatchIndex = -2;
        var matchIndex     = 0;
        var sequence       = [];
        var countChar      = 0;
        var preChar        = '';

        for ( var i = 0, len = diffQueue.length; i < len ; i ++ ) {
            var d = diffQueue[ i ];

            if ( typeof d === 'string' ) {
                //回填 分块信息
                if ( countIndex ) {
                    sequence.push( [ matchIndex, countIndex ] );
                }
                countIndex = 0;

                //记录字串
                preChar += d;
                countChar ++;
            }
            else {
                //回填 字串
                if ( countChar ) {
                    sequence.push( preChar );
                }
                preChar = '';
                countChar = 0;

                //记录 分块信息
                if ( lastMatchIndex + 1 !== d[ 0 ] ) {
                    if ( countIndex ) {
                        sequence.push( [ matchIndex, countIndex ] );
                    }
                    countIndex = 0;
                }
                if ( !countIndex )
                    matchIndex = d[ 0 ];
                lastMatchIndex = d[ 0 ];
                countIndex ++;
            }
        }
        //回填
        if ( countIndex ) {
            sequence.push( [ matchIndex, countIndex ] );
        }
        if ( countChar ) {
            sequence.push( preChar );
        }

        return sequence;
    }
}



function mergeDiff(o, diff) {
    var len = diff.length,
        diffItem,
        retStr = [],
        i;
        chunkSize = 1;
    for ( i = 0 ; i < len ; i++ ) {
        diffItem = diff[i];
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