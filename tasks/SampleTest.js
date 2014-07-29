var diff = require('./lib/newChunk');

var validStr = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890 ,./\\\'\"<>[]{}()=-_+!@#$%^&*';

Test_1();


function Test_1() {
    var s = [];
    //最初的原始字符串
    var options = {
        initLen : 100000,
        partLen : 30,
        partCir : 10,
        partTime: 1000,
        chunkSize: 20
    };
    s.push( getRndStr( options.initLen ) );
    for ( var i = 0; i < options.partTime ; i++)
        s.push( chgRndStr( s[i], options.partLen, options.partCir ) );

    var d = [];
    //差异数组
var beginT = new Date();
    for ( var i = 0; i < options.partTime ; i++ ) {
        d.push( JSON.stringify(diff( s[i], s[i+1], options.chunkSize )) );
    }
var endT = new Date();
    var m = [];
    //合并后数据
    m.push( s[0] );
    for ( var i = 0; i < options.partTime ; i++ ) {
        m.push( mergeDiff( m[i], options.chunkSize, JSON.parse(d[i]) ) );
    }


    var result = true;
    for ( var i = 1; i <= options.partTime ; i++ ) {
        if ( s[i].toString()!=m[i].toString() )
            break;
    }
    console.log('Complete %d/%d',i-1,options.partTime);
    console.log('Diff %d次 %d\%/per Time: %d ms',options.partTime, options.partLen * options.partCir / options.initLen * 100, endT.getTime()-beginT.getTime())
}



function getRndStr(length, notin) {
    //随机产生一个长度为length的字符串，生成数组为validStr
    var retStr = '';
    length = length || 10;
    notin = notin || '';
    for ( var i = 0, len = validStr.length; i < length ; i ++) {
        var r = parseInt( Math.random() * len );
        var chr = validStr.charAt( r );

        if ( notin.indexOf( chr ) !== -1 ) retStr += 'x';
        else retStr += chr;
    }
    return retStr;
}

function chgRndStr( source, length, times ) {
    //对source字符串 随机取一段length的长度改变成另外一串，重复times次
    //保证被替换串不在元length长度内
    var LEN = source.length;
    for ( var t = 0 ; t < times ; t ++ ) {
        var start = parseInt( Math.random() * ( LEN - (length >> 1) ) );
        var end = (start + length) > LEN -1 ? LEN -1 : (start + length) ;
        source = source.substring(0,start) + getRndStr(end-start, source.substring(start,end-1) ) +  source.substring(end,LEN);
        //console.log( '"' + source+ '"',start,end  );
    }
    return source;
}

function mergeDiff(o, chunkSize, diff) {
    var _diff  = diff.diff,
        len    = _diff.length,
        _hash  = diff.hash,
        retStr = '';

    for ( var i = 0 ; i < len ; i++ ) {
        var diffItem = _diff[i];
        if ( diffItem.length == 1) {
            retStr += _hash[ diffItem[ 0 ] ] ;
        }
        else {
            retStr += o.substr( diffItem[ 0 ] * chunkSize, diffItem[ 1 ] * chunkSize ) ;
        }
    }
    return retStr;
}