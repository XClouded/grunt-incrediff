var chunkFunc = require('./newChunk');
var lcsFunc = require('./newLCS');
var fs = require('fs')

function lChunkLCS(o, n, lcsLimit, preStart) {
	var oLen = o.length;
	var nLen = n.length;

	if ( oLen * nLen <= lcsLimit * lcsLimit ) {
		return lcsAdapter( o, n, preStart );
	}
	var chunked = ChunkSplit( o, n, preStart );

	if ( chunked.length === 0 ) {
		return '呵呵?';
		//公共块太小。。呵呵
	}
	else {
		var beforeBlock = lChunkLCS( chunked.beforeBlock[0], chunked.beforeBlock[1], lcsLimit, preStart );
		//TODO 合并
		//TODO 合并  mid 大块
		var afterBlock = lChunkLCS( chunked.afterBlock[0], chunked.afterBlock[1], lcsLimit, preStart );
		//TODO 合并 
	}

	return '合并结果';

}

function getChunkDiff(o, n, chunkSize, noIndex) {
	return chunkFunc( o, n, chunkSize, noIndex );
}

function getLcsDiff(o, n) {
	return lcsFunc(o, n);
}

function ChunkSplit(o, n, preStart) {
	var minChunkSize = 20;
	var splitInfo = {  };

	var maxChunkLen = -1;
	var maxIndex = -1;

	var chunkDiffData = (getChunkDiff(o, n, minChunkSize, true)).diff;

	for ( var i = 0, len = chunkDiffData.length ; i < len ; i ++ ) {
		var d = chunkDiffData[ i ];

		if ( typeof d !== 'string' ) {
			var dLen = d[1] * minChunkSize;

			if ( dLen > maxChunkLen ) {
				maxChunkLen = dLen;
				maxIndex = i;
			}
		}
	}

	if ( maxIndex === -1 ) {
		//呵呵   全量，等会儿再说
		//理论上 是  公共块 比 minChunkSize 小 ， 会造成这样 ，然后就杂么办？全量吧
	}
	else {
		var dLen = chunkDiffData[ maxIndex ][1] * minChunkSize;
		var dStart = chunkDiffData[ maxIndex ][0] * minChunkSize;
		var dEnd = dStart + dLen;

		var dnStart = n.indexOf( o.substring( dStart, dEnd ) );
		var dnEnd = dnStart + dLen ;

		splitInfo.block = [ dStart + 1 + preStart, dLen ];
		splitInfo.beforeBlock = [ 
			o.substring( 0, dStart ),
			n.substring( 0, dnStart )
		];

		splitInfo.afterBlock = [ 
			o.substring( dEnd, o.length ),
			n.substring( dnEnd, n.length )
		];

	}

	return splitInfo;
}


function lcsAdapter(o, n, preStart) {

}
















var origin = fs.readFileSync('app_all.4.js','utf8')
var newstr = fs.readFileSync('app_all.41.js','utf8')

lChunkLCS( origin, newstr, 100, 0, 0 );