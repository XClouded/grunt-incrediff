/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

 (function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
 // replace all simple value tokens with ']' characters. Third, we delete all
 // open brackets that follow a colon or comma or that begin the text. Finally,
 // we look to see that the remaining characters are only whitespace or ']' or
 // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

 if (/^[\],:{}\s]*$/
 .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
 .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
 .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
 }
 }());/**
 * History.js Zepto Adapter
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

// Closure
(function(window,undefined){
	"use strict";

	// Localise Globals
	var
		History = window.History = window.History||{},
		Zepto = window.Zepto;

	// Check Existence
	if ( typeof History.Adapter !== 'undefined' ) {
		throw new Error('History.js Adapter has already been loaded...');
	}

	// Add the Adapter
	History.Adapter = {
		/**
		 * History.Adapter.bind(el,event,callback)
		 * @param {Element|string} el
		 * @param {string} event - custom and standard events
		 * @param {function} callback
		 * @return {void}
		 */
		bind: function(el,event,callback){
			new Zepto(el).bind(event,callback);
		},

		/**
		 * History.Adapter.trigger(el,event)
		 * @param {Element|string} el
		 * @param {string} event - custom and standard events
		 * @return {void}
		 */
		trigger: function(el,event){
			new Zepto(el).trigger(event);
		},

		/**
		 * History.Adapter.extractEventData(key,event,extra)
		 * @param {string} key - key for the event data to extract
		 * @param {string} event - custom and standard events
		 * @return {mixed}
		 */
		extractEventData: function(key,event){
			// Zepto Native
			var result = (event && event[key]) || undefined;

			// Return
			return result;
		},

		/**
		 * History.Adapter.onDomLoad(callback)
		 * @param {function} callback
		 * @return {void}
		 */
		onDomLoad: function(callback) {
			new Zepto(callback);
		}
	};

	// Try and Initialise History
	if ( typeof History.init !== 'undefined' ) {
		History.init();
	}

})(window);
/**
 * History.js HTML4 Support
 * Depends on the HTML5 Support
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function(window,undefined){
	"use strict";

	// ========================================================================
	// Initialise

	// Localise Globals
	var
		document = window.document, // Make sure we are using the correct document
		setTimeout = window.setTimeout||setTimeout,
		clearTimeout = window.clearTimeout||clearTimeout,
		setInterval = window.setInterval||setInterval,
		History = window.History = window.History||{}; // Public History Object

	// Check Existence
	if ( typeof History.initHtml4 !== 'undefined' ) {
		throw new Error('History.js HTML4 Support has already been loaded...');
	}


	// ========================================================================
	// Initialise HTML4 Support

	// Initialise HTML4 Support
	History.initHtml4 = function(){
		// Initialise
		if ( typeof History.initHtml4.initialized !== 'undefined' ) {
			// Already Loaded
			return false;
		}
		else {
			History.initHtml4.initialized = true;
		}


		// ====================================================================
		// Properties

		/**
		 * History.enabled
		 * Is History enabled?
		 */
		History.enabled = true;


		// ====================================================================
		// Hash Storage

		/**
		 * History.savedHashes
		 * Store the hashes in an array
		 */
		History.savedHashes = [];

		/**
		 * History.isLastHash(newHash)
		 * Checks if the hash is the last hash
		 * @param {string} newHash
		 * @return {boolean} true
		 */
		History.isLastHash = function(newHash){
			// Prepare
			var oldHash = History.getHashByIndex(),
				isLast;

			// Check
			isLast = newHash === oldHash;

			// Return isLast
			return isLast;
		};

		/**
		 * History.isHashEqual(newHash, oldHash)
		 * Checks to see if two hashes are functionally equal
		 * @param {string} newHash
		 * @param {string} oldHash
		 * @return {boolean} true
		 */
		History.isHashEqual = function(newHash, oldHash){
			newHash = encodeURIComponent(newHash).replace(/%25/g, "%");
			oldHash = encodeURIComponent(oldHash).replace(/%25/g, "%");
			return newHash === oldHash;
		};

		/**
		 * History.saveHash(newHash)
		 * Push a Hash
		 * @param {string} newHash
		 * @return {boolean} true
		 */
		History.saveHash = function(newHash){
			// Check Hash
			if ( History.isLastHash(newHash) ) {
				return false;
			}

			// Push the Hash
			History.savedHashes.push(newHash);

			// Return true
			return true;
		};

		/**
		 * History.getHashByIndex()
		 * Gets a hash by the index
		 * @param {integer} index
		 * @return {string}
		 */
		History.getHashByIndex = function(index){
			// Prepare
			var hash = null;

			// Handle
			if ( typeof index === 'undefined' ) {
				// Get the last inserted
				hash = History.savedHashes[History.savedHashes.length-1];
			}
			else if ( index < 0 ) {
				// Get from the end
				hash = History.savedHashes[History.savedHashes.length+index];
			}
			else {
				// Get from the beginning
				hash = History.savedHashes[index];
			}

			// Return hash
			return hash;
		};


		// ====================================================================
		// Discarded States

		/**
		 * History.discardedHashes
		 * A hashed array of discarded hashes
		 */
		History.discardedHashes = {};

		/**
		 * History.discardedStates
		 * A hashed array of discarded states
		 */
		History.discardedStates = {};

		/**
		 * History.discardState(State)
		 * Discards the state by ignoring it through History
		 * @param {object} State
		 * @return {true}
		 */
		History.discardState = function(discardedState,forwardState,backState){
			//History.debug('History.discardState', arguments);
			// Prepare
			var discardedStateHash = History.getHashByState(discardedState),
				discardObject;

			// Create Discard Object
			discardObject = {
				'discardedState': discardedState,
				'backState': backState,
				'forwardState': forwardState
			};

			// Add to DiscardedStates
			History.discardedStates[discardedStateHash] = discardObject;

			// Return true
			return true;
		};

		/**
		 * History.discardHash(hash)
		 * Discards the hash by ignoring it through History
		 * @param {string} hash
		 * @return {true}
		 */
		History.discardHash = function(discardedHash,forwardState,backState){
			//History.debug('History.discardState', arguments);
			// Create Discard Object
			var discardObject = {
				'discardedHash': discardedHash,
				'backState': backState,
				'forwardState': forwardState
			};

			// Add to discardedHash
			History.discardedHashes[discardedHash] = discardObject;

			// Return true
			return true;
		};

		/**
		 * History.discardedState(State)
		 * Checks to see if the state is discarded
		 * @param {object} State
		 * @return {bool}
		 */
		History.discardedState = function(State){
			// Prepare
			var StateHash = History.getHashByState(State),
				discarded;

			// Check
			discarded = History.discardedStates[StateHash]||false;

			// Return true
			return discarded;
		};

		/**
		 * History.discardedHash(hash)
		 * Checks to see if the state is discarded
		 * @param {string} State
		 * @return {bool}
		 */
		History.discardedHash = function(hash){
			// Check
			var discarded = History.discardedHashes[hash]||false;

			// Return true
			return discarded;
		};

		/**
		 * History.recycleState(State)
		 * Allows a discarded state to be used again
		 * @param {object} data
		 * @param {string} title
		 * @param {string} url
		 * @return {true}
		 */
		History.recycleState = function(State){
			//History.debug('History.recycleState', arguments);
			// Prepare
			var StateHash = History.getHashByState(State);

			// Remove from DiscardedStates
			if ( History.discardedState(State) ) {
				delete History.discardedStates[StateHash];
			}

			// Return true
			return true;
		};


		// ====================================================================
		// HTML4 HashChange Support

		if ( History.emulated.hashChange ) {
			/*
			 * We must emulate the HTML4 HashChange Support by manually checking for hash changes
			 */

			/**
			 * History.hashChangeInit()
			 * Init the HashChange Emulation
			 */
			History.hashChangeInit = function(){
				// Define our Checker Function
				History.checkerFunction = null;

				// Define some variables that will help in our checker function
				var lastDocumentHash = '',
					iframeId, iframe,
					lastIframeHash, checkerRunning,
					startedWithHash = Boolean(History.getHash());

				// Handle depending on the browser
				if ( History.isInternetExplorer() ) {
					// IE6 and IE7
					// We need to use an iframe to emulate the back and forward buttons

					// Create iFrame
					iframeId = 'historyjs-iframe';
					iframe = document.createElement('iframe');

					// Adjust iFarme
					// IE 6 requires iframe to have a src on HTTPS pages, otherwise it will throw a
					// "This page contains both secure and nonsecure items" warning.
					iframe.setAttribute('id', iframeId);
					iframe.setAttribute('src', '#');
					iframe.style.display = 'none';

					// Append iFrame
					document.body.appendChild(iframe);

					// Create initial history entry
					iframe.contentWindow.document.open();
					iframe.contentWindow.document.close();

					// Define some variables that will help in our checker function
					lastIframeHash = '';
					checkerRunning = false;

					// Define the checker function
					History.checkerFunction = function(){
						// Check Running
						if ( checkerRunning ) {
							return false;
						}

						// Update Running
						checkerRunning = true;

						// Fetch
						var
							documentHash = History.getHash(),
							iframeHash = History.getHash(iframe.contentWindow.document);

						// The Document Hash has changed (application caused)
						if ( documentHash !== lastDocumentHash ) {
							// Equalise
							lastDocumentHash = documentHash;

							// Create a history entry in the iframe
							if ( iframeHash !== documentHash ) {
								//History.debug('hashchange.checker: iframe hash change', 'documentHash (new):', documentHash, 'iframeHash (old):', iframeHash);

								// Equalise
								lastIframeHash = iframeHash = documentHash;

								// Create History Entry
								iframe.contentWindow.document.open();
								iframe.contentWindow.document.close();

								// Update the iframe's hash
								iframe.contentWindow.document.location.hash = History.escapeHash(documentHash);
							}

							// Trigger Hashchange Event
							History.Adapter.trigger(window,'hashchange');
						}

						// The iFrame Hash has changed (back button caused)
						else if ( iframeHash !== lastIframeHash ) {
							//History.debug('hashchange.checker: iframe hash out of sync', 'iframeHash (new):', iframeHash, 'documentHash (old):', documentHash);

							// Equalise
							lastIframeHash = iframeHash;
							
							// If there is no iframe hash that means we're at the original
							// iframe state.
							// And if there was a hash on the original request, the original
							// iframe state was replaced instantly, so skip this state and take
							// the user back to where they came from.
							if (startedWithHash && iframeHash === '') {
								History.back();
							}
							else {
								// Update the Hash
								History.setHash(iframeHash,false);
							}
						}

						// Reset Running
						checkerRunning = false;

						// Return true
						return true;
					};
				}
				else {
					// We are not IE
					// Firefox 1 or 2, Opera

					// Define the checker function
					History.checkerFunction = function(){
						// Prepare
						var documentHash = History.getHash()||'';

						// The Document Hash has changed (application caused)
						if ( documentHash !== lastDocumentHash ) {
							// Equalise
							lastDocumentHash = documentHash;

							// Trigger Hashchange Event
							History.Adapter.trigger(window,'hashchange');
						}

						// Return true
						return true;
					};
				}

				// Apply the checker function
				History.intervalList.push(setInterval(History.checkerFunction, History.options.hashChangeInterval));

				// Done
				return true;
			}; // History.hashChangeInit

			// Bind hashChangeInit
			History.Adapter.onDomLoad(History.hashChangeInit);

		} // History.emulated.hashChange


		// ====================================================================
		// HTML5 State Support

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/*
			 * We must emulate the HTML5 State Management by using HTML4 HashChange
			 */

			/**
			 * History.onHashChange(event)
			 * Trigger HTML5's window.onpopstate via HTML4 HashChange Support
			 */
			History.onHashChange = function(event){
				//History.debug('History.onHashChange', arguments);

				// Prepare
				var currentUrl = ((event && event.newURL) || History.getLocationHref()),
					currentHash = History.getHashByUrl(currentUrl),
					currentState = null,
					currentStateHash = null,
					currentStateHashExits = null,
					discardObject;

				// Check if we are the same state
				if ( History.isLastHash(currentHash) ) {
					// There has been no change (just the page's hash has finally propagated)
					//History.debug('History.onHashChange: no change');
					History.busy(false);
					return false;
				}

				// Reset the double check
				History.doubleCheckComplete();

				// Store our location for use in detecting back/forward direction
				History.saveHash(currentHash);

				// Expand Hash
				if ( currentHash && History.isTraditionalAnchor(currentHash) ) {
					//History.debug('History.onHashChange: traditional anchor', currentHash);
					// Traditional Anchor Hash
					History.Adapter.trigger(window,'anchorchange');
					History.busy(false);
					return false;
				}

				// Create State
				currentState = History.extractState(History.getFullUrl(currentHash||History.getLocationHref()),true);

				// Check if we are the same state
				if ( History.isLastSavedState(currentState) ) {
					//History.debug('History.onHashChange: no change');
					// There has been no change (just the page's hash has finally propagated)
					History.busy(false);
					return false;
				}

				// Create the state Hash
				currentStateHash = History.getHashByState(currentState);

				// Check if we are DiscardedState
				discardObject = History.discardedState(currentState);
				if ( discardObject ) {
					// Ignore this state as it has been discarded and go back to the state before it
					if ( History.getHashByIndex(-2) === History.getHashByState(discardObject.forwardState) ) {
						// We are going backwards
						//History.debug('History.onHashChange: go backwards');
						History.back(false);
					} else {
						// We are going forwards
						//History.debug('History.onHashChange: go forwards');
						History.forward(false);
					}
					return false;
				}

				// Push the new HTML5 State
				//History.debug('History.onHashChange: success hashchange');
				History.pushState(currentState.data,currentState.title,encodeURI(currentState.url),false);

				// End onHashChange closure
				return true;
			};
			History.Adapter.bind(window,'hashchange',History.onHashChange);

			/**
			 * History.pushState(data,title,url)
			 * Add a new State to the history object, become it, and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.pushState = function(data,title,url,queue){
				//History.debug('History.pushState: called', arguments);

				// We assume that the URL passed in is URI-encoded, but this makes
				// sure that it's fully URI encoded; any '%'s that are encoded are
				// converted back into '%'s
				url = encodeURI(url).replace(/%25/g, "%");

				// Check the State
				if ( History.getHashByUrl(url) ) {
					throw new Error('History.js does not support states with fragment-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.pushState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.pushState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy
				History.busy(true);

				// Fetch the State Object
				var newState = History.createStateObject(data,title,url),
					newStateHash = History.getHashByState(newState),
					oldState = History.getState(false),
					oldStateHash = History.getHashByState(oldState),
					html4Hash = History.getHash(),
					wasExpected = History.expectedStateId == newState.id;

				// Store the newState
				History.storeState(newState);
				History.expectedStateId = newState.id;

				// Recycle the State
				History.recycleState(newState);

				// Force update of the title
				History.setTitle(newState);

				// Check if we are the same State
				if ( newStateHash === oldStateHash ) {
					//History.debug('History.pushState: no change', newStateHash);
					History.busy(false);
					return false;
				}

				// Update HTML5 State
				History.saveState(newState);

				// Fire HTML5 Event
				if(!wasExpected)
					History.Adapter.trigger(window,'statechange');

				// Update HTML4 Hash
				if ( !History.isHashEqual(newStateHash, html4Hash) && !History.isHashEqual(newStateHash, History.getShortUrl(History.getLocationHref())) ) {
					History.setHash(newStateHash,false);
				}
				
				History.busy(false);

				// End pushState closure
				return true;
			};

			/**
			 * History.replaceState(data,title,url)
			 * Replace the State and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.replaceState = function(data,title,url,queue){
				//History.debug('History.replaceState: called', arguments);

				// We assume that the URL passed in is URI-encoded, but this makes
				// sure that it's fully URI encoded; any '%'s that are encoded are
				// converted back into '%'s
				url = encodeURI(url).replace(/%25/g, "%");

				// Check the State
				if ( History.getHashByUrl(url) ) {
					throw new Error('History.js does not support states with fragment-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.replaceState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.replaceState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy
				History.busy(true);

				// Fetch the State Objects
				var newState        = History.createStateObject(data,title,url),
					newStateHash = History.getHashByState(newState),
					oldState        = History.getState(false),
					oldStateHash = History.getHashByState(oldState),
					previousState   = History.getStateByIndex(-2);

				// Discard Old State
				History.discardState(oldState,newState,previousState);

				// If the url hasn't changed, just store and save the state
				// and fire a statechange event to be consistent with the
				// html 5 api
				if ( newStateHash === oldStateHash ) {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;
	
					// Recycle the State
					History.recycleState(newState);
	
					// Force update of the title
					History.setTitle(newState);
					
					// Update HTML5 State
					History.saveState(newState);

					// Fire HTML5 Event
					//History.debug('History.pushState: trigger popstate');
					History.Adapter.trigger(window,'statechange');
					History.busy(false);
				}
				else {
					// Alias to PushState
					History.pushState(newState.data,newState.title,newState.url,false);
				}

				// End replaceState closure
				return true;
			};

		} // History.emulated.pushState



		// ====================================================================
		// Initialise

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/**
			 * Ensure initial state is handled correctly
			 */
			if ( History.getHash() && !History.emulated.hashChange ) {
				History.Adapter.onDomLoad(function(){
					History.Adapter.trigger(window,'hashchange');
				});
			}

		} // History.emulated.pushState

	}; // History.initHtml4

	// Try to Initialise History
	if ( typeof History.init !== 'undefined' ) {
		History.init();
	}

})(window);
/**
 * History.js Core
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function(window,undefined){
	"use strict";

	// ========================================================================
	// Initialise

	// Localise Globals
	var
		console = window.console||undefined, // Prevent a JSLint complain
		document = window.document, // Make sure we are using the correct document
		navigator = window.navigator, // Make sure we are using the correct navigator
		sessionStorage = window.sessionStorage||false, // sessionStorage
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		setInterval = window.setInterval,
		clearInterval = window.clearInterval,
		JSON = window.JSON,
		alert = window.alert,
		History = window.History = window.History||{}, // Public History Object
		history = window.history; // Old History Object

	try {
		sessionStorage.setItem('TEST', '1');
		sessionStorage.removeItem('TEST');
	} catch(e) {
		sessionStorage = false;
	}

	// MooTools Compatibility
	JSON.stringify = JSON.stringify||JSON.encode;
	JSON.parse = JSON.parse||JSON.decode;

	// Check Existence
	if ( typeof History.init !== 'undefined' ) {
		throw new Error('History.js Core has already been loaded...');
	}

	// Initialise History
	History.init = function(options){
		// Check Load Status of Adapter
		if ( typeof History.Adapter === 'undefined' ) {
			return false;
		}

		// Check Load Status of Core
		if ( typeof History.initCore !== 'undefined' ) {
			History.initCore();
		}

		// Check Load Status of HTML4 Support
		if ( typeof History.initHtml4 !== 'undefined' ) {
			History.initHtml4();
		}

		// Return true
		return true;
	};


	// ========================================================================
	// Initialise Core

	// Initialise Core
	History.initCore = function(options){
		// Initialise
		if ( typeof History.initCore.initialized !== 'undefined' ) {
			// Already Loaded
			return false;
		}
		else {
			History.initCore.initialized = true;
		}


		// ====================================================================
		// Options

		/**
		 * History.options
		 * Configurable options
		 */
		History.options = History.options||{};

		/**
		 * History.options.hashChangeInterval
		 * How long should the interval be before hashchange checks
		 */
		History.options.hashChangeInterval = History.options.hashChangeInterval || 100;

		/**
		 * History.options.safariPollInterval
		 * How long should the interval be before safari poll checks
		 */
		History.options.safariPollInterval = History.options.safariPollInterval || 500;

		/**
		 * History.options.doubleCheckInterval
		 * How long should the interval be before we perform a double check
		 */
		History.options.doubleCheckInterval = History.options.doubleCheckInterval || 500;

		/**
		 * History.options.disableSuid
		 * Force History not to append suid
		 */
		History.options.disableSuid = History.options.disableSuid || false;

		/**
		 * History.options.storeInterval
		 * How long should we wait between store calls
		 */
		History.options.storeInterval = History.options.storeInterval || 1000;

		/**
		 * History.options.busyDelay
		 * How long should we wait between busy events
		 */
		History.options.busyDelay = History.options.busyDelay || 250;

		/**
		 * History.options.debug
		 * If true will enable debug messages to be logged
		 */
		History.options.debug = History.options.debug || false;

		/**
		 * History.options.initialTitle
		 * What is the title of the initial state
		 */
		History.options.initialTitle = History.options.initialTitle || document.title;

		/**
		 * History.options.html4Mode
		 * If true, will force HTMl4 mode (hashtags)
		 */
		History.options.html4Mode = History.options.html4Mode || false;

		/**
		 * History.options.delayInit
		 * Want to override default options and call init manually.
		 */
		History.options.delayInit = History.options.delayInit || false;


		// ====================================================================
		// Interval record

		/**
		 * History.intervalList
		 * List of intervals set, to be cleared when document is unloaded.
		 */
		History.intervalList = [];

		/**
		 * History.clearAllIntervals
		 * Clears all setInterval instances.
		 */
		History.clearAllIntervals = function(){
			var i, il = History.intervalList;
			if (typeof il !== "undefined" && il !== null) {
				for (i = 0; i < il.length; i++) {
					clearInterval(il[i]);
				}
				History.intervalList = null;
			}
		};


		// ====================================================================
		// Debug

		/**
		 * History.debug(message,...)
		 * Logs the passed arguments if debug enabled
		 */
		History.debug = function(){
			if ( (History.options.debug||false) ) {
				History.log.apply(History,arguments);
			}
		};

		/**
		 * History.log(message,...)
		 * Logs the passed arguments
		 */
		History.log = function(){
			// Prepare
			var
				consoleExists = !(typeof console === 'undefined' || typeof console.log === 'undefined' || typeof console.log.apply === 'undefined'),
				textarea = document.getElementById('log'),
				message,
				i,n,
				args,arg
				;

			// Write to Console
			if ( consoleExists ) {
				args = Array.prototype.slice.call(arguments);
				message = args.shift();
				if ( typeof console.debug !== 'undefined' ) {
					console.debug.apply(console,[message,args]);
				}
				else {
					console.log.apply(console,[message,args]);
				}
			}
			else {
				message = ("\n"+arguments[0]+"\n");
			}

			// Write to log
			for ( i=1,n=arguments.length; i<n; ++i ) {
				arg = arguments[i];
				if ( typeof arg === 'object' && typeof JSON !== 'undefined' ) {
					try {
						arg = JSON.stringify(arg);
					}
					catch ( Exception ) {
						// Recursive Object
					}
				}
				message += "\n"+arg+"\n";
			}

			// Textarea
			if ( textarea ) {
				textarea.value += message+"\n-----\n";
				textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
			}
			// No Textarea, No Console
			else if ( !consoleExists ) {
				alert(message);
			}

			// Return true
			return true;
		};


		// ====================================================================
		// Emulated Status

		/**
		 * History.getInternetExplorerMajorVersion()
		 * Get's the major version of Internet Explorer
		 * @return {integer}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 * @author James Padolsey <https://gist.github.com/527683>
		 */
		History.getInternetExplorerMajorVersion = function(){
			var result = History.getInternetExplorerMajorVersion.cached =
					(typeof History.getInternetExplorerMajorVersion.cached !== 'undefined')
				?	History.getInternetExplorerMajorVersion.cached
				:	(function(){
						var v = 3,
								div = document.createElement('div'),
								all = div.getElementsByTagName('i');
						while ( (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->') && all[0] ) {}
						return (v > 4) ? v : false;
					})()
				;
			return result;
		};

		/**
		 * History.isInternetExplorer()
		 * Are we using Internet Explorer?
		 * @return {boolean}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 */
		History.isInternetExplorer = function(){
			var result =
				History.isInternetExplorer.cached =
				(typeof History.isInternetExplorer.cached !== 'undefined')
					?	History.isInternetExplorer.cached
					:	Boolean(History.getInternetExplorerMajorVersion())
				;
			return result;
		};

		/**
		 * History.emulated
		 * Which features require emulating?
		 */

		if (History.options.html4Mode) {
			History.emulated = {
				pushState : true,
				hashChange: true
			};
		}

		else {

			History.emulated = {
				pushState: !Boolean(
					window.history && window.history.pushState && window.history.replaceState
					&& !(
						(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i).test(navigator.userAgent) /* disable for versions of iOS before version 4.3 (8F190) */
						|| (/AppleWebKit\/5([0-2]|3[0-2])/i).test(navigator.userAgent) /* disable for the mercury iOS browser, or at least older versions of the webkit engine */
					)
				),
				hashChange: Boolean(
					!(('onhashchange' in window) || ('onhashchange' in document))
					||
					(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8)
				)
			};
		}

		/**
		 * History.enabled
		 * Is History enabled?
		 */
		History.enabled = !History.emulated.pushState;

		/**
		 * History.bugs
		 * Which bugs are present
		 */
		History.bugs = {
			/**
			 * Safari 5 and Safari iOS 4 fail to return to the correct state once a hash is replaced by a `replaceState` call
			 * https://bugs.webkit.org/show_bug.cgi?id=56249
			 */
			setHash: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * Safari 5 and Safari iOS 4 sometimes fail to apply the state change under busy conditions
			 * https://bugs.webkit.org/show_bug.cgi?id=42940
			 */
			safariPoll: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * MSIE 6 and 7 sometimes do not apply a hash even it was told to (requiring a second call to the apply function)
			 */
			ieDoubleCheck: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8),

			/**
			 * MSIE 6 requires the entire hash to be encoded for the hashes to trigger the onHashChange event
			 */
			hashEscape: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 7)
		};

		/**
		 * History.isEmptyObject(obj)
		 * Checks to see if the Object is Empty
		 * @param {Object} obj
		 * @return {boolean}
		 */
		History.isEmptyObject = function(obj) {
			for ( var name in obj ) {
				if ( obj.hasOwnProperty(name) ) {
					return false;
				}
			}
			return true;
		};

		/**
		 * History.cloneObject(obj)
		 * Clones a object and eliminate all references to the original contexts
		 * @param {Object} obj
		 * @return {Object}
		 */
		History.cloneObject = function(obj) {
			var hash,newObj;
			if ( obj ) {
				hash = JSON.stringify(obj);
				newObj = JSON.parse(hash);
			}
			else {
				newObj = {};
			}
			return newObj;
		};


		// ====================================================================
		// URL Helpers

		/**
		 * History.getRootUrl()
		 * Turns "http://mysite.com/dir/page.html?asd" into "http://mysite.com"
		 * @return {String} rootUrl
		 */
		History.getRootUrl = function(){
			// Create
			var rootUrl = document.location.protocol+'//'+(document.location.hostname||document.location.host);
			if ( document.location.port||false ) {
				rootUrl += ':'+document.location.port;
			}
			rootUrl += '/';

			// Return
			return rootUrl;
		};

		/**
		 * History.getBaseHref()
		 * Fetches the `href` attribute of the `<base href="...">` element if it exists
		 * @return {String} baseHref
		 */
		History.getBaseHref = function(){
			// Create
			var
				baseElements = document.getElementsByTagName('base'),
				baseElement = null,
				baseHref = '';

			// Test for Base Element
			if ( baseElements.length === 1 ) {
				// Prepare for Base Element
				baseElement = baseElements[0];
				baseHref = baseElement.href.replace(/[^\/]+$/,'');
			}

			// Adjust trailing slash
			baseHref = baseHref.replace(/\/+$/,'');
			if ( baseHref ) baseHref += '/';

			// Return
			return baseHref;
		};

		/**
		 * History.getBaseUrl()
		 * Fetches the baseHref or basePageUrl or rootUrl (whichever one exists first)
		 * @return {String} baseUrl
		 */
		History.getBaseUrl = function(){
			// Create
			var baseUrl = History.getBaseHref()||History.getBasePageUrl()||History.getRootUrl();

			// Return
			return baseUrl;
		};

		/**
		 * History.getPageUrl()
		 * Fetches the URL of the current page
		 * @return {String} pageUrl
		 */
		History.getPageUrl = function(){
			// Fetch
			var
				State = History.getState(false,false),
				stateUrl = (State||{}).url||History.getLocationHref(),
				pageUrl;

			// Create
			pageUrl = stateUrl.replace(/\/+$/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/\./).test(part) ? part : part+'/';
			});

			// Return
			return pageUrl;
		};

		/**
		 * History.getBasePageUrl()
		 * Fetches the Url of the directory of the current page
		 * @return {String} basePageUrl
		 */
		History.getBasePageUrl = function(){
			// Create
			var basePageUrl = (History.getLocationHref()).replace(/[#\?].*/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/[^\/]$/).test(part) ? '' : part;
			}).replace(/\/+$/,'')+'/';

			// Return
			return basePageUrl;
		};

		/**
		 * History.getFullUrl(url)
		 * Ensures that we have an absolute URL and not a relative URL
		 * @param {string} url
		 * @param {Boolean} allowBaseHref
		 * @return {string} fullUrl
		 */
		History.getFullUrl = function(url,allowBaseHref){
			// Prepare
			var fullUrl = url, firstChar = url.substring(0,1);
			allowBaseHref = (typeof allowBaseHref === 'undefined') ? true : allowBaseHref;

			// Check
			if ( /[a-z]+\:\/\//.test(url) ) {
				// Full URL
			}
			else if ( firstChar === '/' ) {
				// Root URL
				fullUrl = History.getRootUrl()+url.replace(/^\/+/,'');
			}
			else if ( firstChar === '#' ) {
				// Anchor URL
				fullUrl = History.getPageUrl().replace(/#.*/,'')+url;
			}
			else if ( firstChar === '?' ) {
				// Query URL
				fullUrl = History.getPageUrl().replace(/[\?#].*/,'')+url;
			}
			else {
				// Relative URL
				if ( allowBaseHref ) {
					fullUrl = History.getBaseUrl()+url.replace(/^(\.\/)+/,'');
				} else {
					fullUrl = History.getBasePageUrl()+url.replace(/^(\.\/)+/,'');
				}
				// We have an if condition above as we do not want hashes
				// which are relative to the baseHref in our URLs
				// as if the baseHref changes, then all our bookmarks
				// would now point to different locations
				// whereas the basePageUrl will always stay the same
			}

			// Return
			return fullUrl.replace(/\#$/,'');
		};

		/**
		 * History.getShortUrl(url)
		 * Ensures that we have a relative URL and not a absolute URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getShortUrl = function(url){
			// Prepare
			var shortUrl = url, baseUrl = History.getBaseUrl(), rootUrl = History.getRootUrl();

			// Trim baseUrl
			if ( History.emulated.pushState ) {
				// We are in a if statement as when pushState is not emulated
				// The actual url these short urls are relative to can change
				// So within the same session, we the url may end up somewhere different
				shortUrl = shortUrl.replace(baseUrl,'');
			}

			// Trim rootUrl
			shortUrl = shortUrl.replace(rootUrl,'/');

			// Ensure we can still detect it as a state
			if ( History.isTraditionalAnchor(shortUrl) ) {
				shortUrl = './'+shortUrl;
			}

			// Clean It
			shortUrl = shortUrl.replace(/^(\.\/)+/g,'./').replace(/\#$/,'');

			// Return
			return shortUrl;
		};

		/**
		 * History.getLocationHref(document)
		 * Returns a normalized version of document.location.href
		 * accounting for browser inconsistencies, etc.
		 *
		 * This URL will be URI-encoded and will include the hash
		 *
		 * @param {object} document
		 * @return {string} url
		 */
		History.getLocationHref = function(doc) {
			doc = doc || document;

			// most of the time, this will be true
			if (doc.URL === doc.location.href)
				return doc.location.href;

			// some versions of webkit URI-decode document.location.href
			// but they leave document.URL in an encoded state
			if (doc.location.href === decodeURIComponent(doc.URL))
				return doc.URL;

			// FF 3.6 only updates document.URL when a page is reloaded
			// document.location.href is updated correctly
			if (doc.location.hash && decodeURIComponent(doc.location.href.replace(/^[^#]+/, "")) === doc.location.hash)
				return doc.location.href;

			if (doc.URL.indexOf('#') == -1 && doc.location.href.indexOf('#') != -1)
				return doc.location.href;
			
			return doc.URL || doc.location.href;
		};


		// ====================================================================
		// State Storage

		/**
		 * History.store
		 * The store for all session specific data
		 */
		History.store = {};

		/**
		 * History.idToState
		 * 1-1: State ID to State Object
		 */
		History.idToState = History.idToState||{};

		/**
		 * History.stateToId
		 * 1-1: State String to State ID
		 */
		History.stateToId = History.stateToId||{};

		/**
		 * History.urlToId
		 * 1-1: State URL to State ID
		 */
		History.urlToId = History.urlToId||{};

		/**
		 * History.storedStates
		 * Store the states in an array
		 */
		History.storedStates = History.storedStates||[];

		/**
		 * History.savedStates
		 * Saved the states in an array
		 */
		History.savedStates = History.savedStates||[];

		/**
		 * History.noramlizeStore()
		 * Noramlize the store by adding necessary values
		 */
		History.normalizeStore = function(){
			History.store.idToState = History.store.idToState||{};
			History.store.urlToId = History.store.urlToId||{};
			History.store.stateToId = History.store.stateToId||{};
		};

		/**
		 * History.getState()
		 * Get an object containing the data, title and url of the current state
		 * @param {Boolean} friendly
		 * @param {Boolean} create
		 * @return {Object} State
		 */
		History.getState = function(friendly,create){
			// Prepare
			if ( typeof friendly === 'undefined' ) { friendly = true; }
			if ( typeof create === 'undefined' ) { create = true; }

			// Fetch
			var State = History.getLastSavedState();

			// Create
			if ( !State && create ) {
				State = History.createStateObject();
			}

			// Adjust
			if ( friendly ) {
				State = History.cloneObject(State);
				State.url = State.cleanUrl||State.url;
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByState(State)
		 * Gets a ID for a State
		 * @param {State} newState
		 * @return {String} id
		 */
		History.getIdByState = function(newState){

			// Fetch ID
			var id = History.extractId(newState.url),
				str;

			if ( !id ) {
				// Find ID via State String
				str = History.getStateString(newState);
				if ( typeof History.stateToId[str] !== 'undefined' ) {
					id = History.stateToId[str];
				}
				else if ( typeof History.store.stateToId[str] !== 'undefined' ) {
					id = History.store.stateToId[str];
				}
				else {
					// Generate a new ID
					while ( true ) {
						id = (new Date()).getTime() + String(Math.random()).replace(/\D/g,'');
						if ( typeof History.idToState[id] === 'undefined' && typeof History.store.idToState[id] === 'undefined' ) {
							break;
						}
					}

					// Apply the new State to the ID
					History.stateToId[str] = id;
					History.idToState[id] = newState;
				}
			}

			// Return ID
			return id;
		};

		/**
		 * History.normalizeState(State)
		 * Expands a State Object
		 * @param {object} State
		 * @return {object}
		 */
		History.normalizeState = function(oldState){
			// Variables
			var newState, dataNotEmpty;

			// Prepare
			if ( !oldState || (typeof oldState !== 'object') ) {
				oldState = {};
			}

			// Check
			if ( typeof oldState.normalized !== 'undefined' ) {
				return oldState;
			}

			// Adjust
			if ( !oldState.data || (typeof oldState.data !== 'object') ) {
				oldState.data = {};
			}

			// ----------------------------------------------------------------

			// Create
			newState = {};
			newState.normalized = true;
			newState.title = oldState.title||'';
			newState.url = History.getFullUrl(oldState.url?oldState.url:(History.getLocationHref()));
			newState.hash = History.getShortUrl(newState.url);
			newState.data = History.cloneObject(oldState.data);

			// Fetch ID
			newState.id = History.getIdByState(newState);

			// ----------------------------------------------------------------

			// Clean the URL
			newState.cleanUrl = newState.url.replace(/\??\&_suid.*/,'');
			newState.url = newState.cleanUrl;

			// Check to see if we have more than just a url
			dataNotEmpty = !History.isEmptyObject(newState.data);

			// Apply
			if ( (newState.title || dataNotEmpty) && History.options.disableSuid !== true ) {
				// Add ID to Hash
				newState.hash = History.getShortUrl(newState.url).replace(/\??\&_suid.*/,'');
				if ( !/\?/.test(newState.hash) ) {
					newState.hash += '?';
				}
				newState.hash += '&_suid='+newState.id;
			}

			// Create the Hashed URL
			newState.hashedUrl = History.getFullUrl(newState.hash);

			// ----------------------------------------------------------------

			// Update the URL if we have a duplicate
			if ( (History.emulated.pushState || History.bugs.safariPoll) && History.hasUrlDuplicate(newState) ) {
				newState.url = newState.hashedUrl;
			}

			// ----------------------------------------------------------------

			// Return
			return newState;
		};

		/**
		 * History.createStateObject(data,title,url)
		 * Creates a object based on the data, title and url state params
		 * @param {object} data
		 * @param {string} title
		 * @param {string} url
		 * @return {object}
		 */
		History.createStateObject = function(data,title,url){
			// Hashify
			var State = {
				'data': data,
				'title': title,
				'url': url
			};

			// Expand the State
			State = History.normalizeState(State);

			// Return object
			return State;
		};

		/**
		 * History.getStateById(id)
		 * Get a state by it's UID
		 * @param {String} id
		 */
		History.getStateById = function(id){
			// Prepare
			id = String(id);

			// Retrieve
			var State = History.idToState[id] || History.store.idToState[id] || undefined;

			// Return State
			return State;
		};

		/**
		 * Get a State's String
		 * @param {State} passedState
		 */
		History.getStateString = function(passedState){
			// Prepare
			var State, cleanedState, str;

			// Fetch
			State = History.normalizeState(passedState);

			// Clean
			cleanedState = {
				data: State.data,
				title: passedState.title,
				url: passedState.url
			};

			// Fetch
			str = JSON.stringify(cleanedState);

			// Return
			return str;
		};

		/**
		 * Get a State's ID
		 * @param {State} passedState
		 * @return {String} id
		 */
		History.getStateId = function(passedState){
			// Prepare
			var State, id;

			// Fetch
			State = History.normalizeState(passedState);

			// Fetch
			id = State.id;

			// Return
			return id;
		};

		/**
		 * History.getHashByState(State)
		 * Creates a Hash for the State Object
		 * @param {State} passedState
		 * @return {String} hash
		 */
		History.getHashByState = function(passedState){
			// Prepare
			var State, hash;

			// Fetch
			State = History.normalizeState(passedState);

			// Hash
			hash = State.hash;

			// Return
			return hash;
		};

		/**
		 * History.extractId(url_or_hash)
		 * Get a State ID by it's URL or Hash
		 * @param {string} url_or_hash
		 * @return {string} id
		 */
		History.extractId = function ( url_or_hash ) {
			// Prepare
			var id,parts,url, tmp;

			// Extract
			
			// If the URL has a #, use the id from before the #
			if (url_or_hash.indexOf('#') != -1)
			{
				tmp = url_or_hash.split("#")[0];
			}
			else
			{
				tmp = url_or_hash;
			}
			
			parts = /(.*)\&_suid=([0-9]+)$/.exec(tmp);
			url = parts ? (parts[1]||url_or_hash) : url_or_hash;
			id = parts ? String(parts[2]||'') : '';

			// Return
			return id||false;
		};

		/**
		 * History.isTraditionalAnchor
		 * Checks to see if the url is a traditional anchor or not
		 * @param {String} url_or_hash
		 * @return {Boolean}
		 */
		History.isTraditionalAnchor = function(url_or_hash){
			// Check
			var isTraditional = !(/[\/\?\.]/.test(url_or_hash));

			// Return
			return isTraditional;
		};

		/**
		 * History.extractState
		 * Get a State by it's URL or Hash
		 * @param {String} url_or_hash
		 * @return {State|null}
		 */
		History.extractState = function(url_or_hash,create){
			// Prepare
			var State = null, id, url;
			create = create||false;

			// Fetch SUID
			id = History.extractId(url_or_hash);
			if ( id ) {
				State = History.getStateById(id);
			}

			// Fetch SUID returned no State
			if ( !State ) {
				// Fetch URL
				url = History.getFullUrl(url_or_hash);

				// Check URL
				id = History.getIdByUrl(url)||false;
				if ( id ) {
					State = History.getStateById(id);
				}

				// Create State
				if ( !State && create && !History.isTraditionalAnchor(url_or_hash) ) {
					State = History.createStateObject(null,null,url);
				}
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByUrl()
		 * Get a State ID by a State URL
		 */
		History.getIdByUrl = function(url){
			// Fetch
			var id = History.urlToId[url] || History.store.urlToId[url] || undefined;

			// Return
			return id;
		};

		/**
		 * History.getLastSavedState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastSavedState = function(){
			return History.savedStates[History.savedStates.length-1]||undefined;
		};

		/**
		 * History.getLastStoredState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastStoredState = function(){
			return History.storedStates[History.storedStates.length-1]||undefined;
		};

		/**
		 * History.hasUrlDuplicate
		 * Checks if a Url will have a url conflict
		 * @param {Object} newState
		 * @return {Boolean} hasDuplicate
		 */
		History.hasUrlDuplicate = function(newState) {
			// Prepare
			var hasDuplicate = false,
				oldState;

			// Fetch
			oldState = History.extractState(newState.url);

			// Check
			hasDuplicate = oldState && oldState.id !== newState.id;

			// Return
			return hasDuplicate;
		};

		/**
		 * History.storeState
		 * Store a State
		 * @param {Object} newState
		 * @return {Object} newState
		 */
		History.storeState = function(newState){
			// Store the State
			History.urlToId[newState.url] = newState.id;

			// Push the State
			History.storedStates.push(History.cloneObject(newState));

			// Return newState
			return newState;
		};

		/**
		 * History.isLastSavedState(newState)
		 * Tests to see if the state is the last state
		 * @param {Object} newState
		 * @return {boolean} isLast
		 */
		History.isLastSavedState = function(newState){
			// Prepare
			var isLast = false,
				newId, oldState, oldId;

			// Check
			if ( History.savedStates.length ) {
				newId = newState.id;
				oldState = History.getLastSavedState();
				oldId = oldState.id;

				// Check
				isLast = (newId === oldId);
			}

			// Return
			return isLast;
		};

		/**
		 * History.saveState
		 * Push a State
		 * @param {Object} newState
		 * @return {boolean} changed
		 */
		History.saveState = function(newState){
			// Check Hash
			if ( History.isLastSavedState(newState) ) {
				return false;
			}

			// Push the State
			History.savedStates.push(History.cloneObject(newState));

			// Return true
			return true;
		};

		/**
		 * History.getStateByIndex()
		 * Gets a state by the index
		 * @param {integer} index
		 * @return {Object}
		 */
		History.getStateByIndex = function(index){
			// Prepare
			var State = null;

			// Handle
			if ( typeof index === 'undefined' ) {
				// Get the last inserted
				State = History.savedStates[History.savedStates.length-1];
			}
			else if ( index < 0 ) {
				// Get from the end
				State = History.savedStates[History.savedStates.length+index];
			}
			else {
				// Get from the beginning
				State = History.savedStates[index];
			}

			// Return State
			return State;
		};
		
		/**
		 * History.getCurrentIndex()
		 * Gets the current index
		 * @return (integer)
		*/
		History.getCurrentIndex = function(){
			// Prepare
			var index = null;
			
			// No states saved
			if(History.savedStates.length < 1) {
				index = 0;
			}
			else {
				index = History.savedStates.length-1;
			}
			return index;
		};

		// ====================================================================
		// Hash Helpers

		/**
		 * History.getHash()
		 * @param {Location=} location
		 * Gets the current document hash
		 * Note: unlike location.hash, this is guaranteed to return the escaped hash in all browsers
		 * @return {string}
		 */
		History.getHash = function(doc){
			var url = History.getLocationHref(doc),
				hash;
			hash = History.getHashByUrl(url);
			return hash;
		};

		/**
		 * History.unescapeHash()
		 * normalize and Unescape a Hash
		 * @param {String} hash
		 * @return {string}
		 */
		History.unescapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Unescape hash
			result = decodeURIComponent(result);

			// Return result
			return result;
		};

		/**
		 * History.normalizeHash()
		 * normalize a hash across browsers
		 * @return {string}
		 */
		History.normalizeHash = function(hash){
			// Prepare
			var result = hash.replace(/[^#]*#/,'').replace(/#.*/, '');

			// Return result
			return result;
		};

		/**
		 * History.setHash(hash)
		 * Sets the document hash
		 * @param {string} hash
		 * @return {History}
		 */
		History.setHash = function(hash,queue){
			// Prepare
			var State, pageUrl;

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.setHash: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.setHash,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Log
			//History.debug('History.setHash: called',hash);

			// Make Busy + Continue
			History.busy(true);

			// Check if hash is a state
			State = History.extractState(hash,true);
			if ( State && !History.emulated.pushState ) {
				// Hash is a state so skip the setHash
				//History.debug('History.setHash: Hash is a state so skipping the hash set with a direct pushState call',arguments);

				// PushState
				History.pushState(State.data,State.title,State.url,false);
			}
			else if ( History.getHash() !== hash ) {
				// Hash is a proper hash, so apply it

				// Handle browser bugs
				if ( History.bugs.setHash ) {
					// Fix Safari Bug https://bugs.webkit.org/show_bug.cgi?id=56249

					// Fetch the base page
					pageUrl = History.getPageUrl();

					// Safari hash apply
					History.pushState(null,null,pageUrl+'#'+hash,false);
				}
				else {
					// Normal hash apply
					document.location.hash = hash;
				}
			}

			// Chain
			return History;
		};

		/**
		 * History.escape()
		 * normalize and Escape a Hash
		 * @return {string}
		 */
		History.escapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Escape hash
			result = window.encodeURIComponent(result);

			// IE6 Escape Bug
			if ( !History.bugs.hashEscape ) {
				// Restore common parts
				result = result
					.replace(/\%21/g,'!')
					.replace(/\%26/g,'&')
					.replace(/\%3D/g,'=')
					.replace(/\%3F/g,'?');
			}

			// Return result
			return result;
		};

		/**
		 * History.getHashByUrl(url)
		 * Extracts the Hash from a URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getHashByUrl = function(url){
			// Extract the hash
			var hash = String(url)
				.replace(/([^#]*)#?([^#]*)#?(.*)/, '$2')
				;

			// Unescape hash
			hash = History.unescapeHash(hash);

			// Return hash
			return hash;
		};

		/**
		 * History.setTitle(title)
		 * Applies the title to the document
		 * @param {State} newState
		 * @return {Boolean}
		 */
		History.setTitle = function(newState){
			// Prepare
			var title = newState.title,
				firstState;

			// Initial
			if ( !title ) {
				firstState = History.getStateByIndex(0);
				if ( firstState && firstState.url === newState.url ) {
					title = firstState.title||History.options.initialTitle;
				}
			}

			// Apply
			try {
				document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
			}
			catch ( Exception ) { }
			document.title = title;

			// Chain
			return History;
		};


		// ====================================================================
		// Queueing

		/**
		 * History.queues
		 * The list of queues to use
		 * First In, First Out
		 */
		History.queues = [];

		/**
		 * History.busy(value)
		 * @param {boolean} value [optional]
		 * @return {boolean} busy
		 */
		History.busy = function(value){
			// Apply
			if ( typeof value !== 'undefined' ) {
				//History.debug('History.busy: changing ['+(History.busy.flag||false)+'] to ['+(value||false)+']', History.queues.length);
				History.busy.flag = value;
			}
			// Default
			else if ( typeof History.busy.flag === 'undefined' ) {
				History.busy.flag = false;
			}

			// Queue
			if ( !History.busy.flag ) {
				// Execute the next item in the queue
				clearTimeout(History.busy.timeout);
				var fireNext = function(){
					var i, queue, item;
					if ( History.busy.flag ) return;
					for ( i=History.queues.length-1; i >= 0; --i ) {
						queue = History.queues[i];
						if ( queue.length === 0 ) continue;
						item = queue.shift();
						History.fireQueueItem(item);
						History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
					}
				};
				History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
			}

			// Return
			return History.busy.flag;
		};

		/**
		 * History.busy.flag
		 */
		History.busy.flag = false;

		/**
		 * History.fireQueueItem(item)
		 * Fire a Queue Item
		 * @param {Object} item
		 * @return {Mixed} result
		 */
		History.fireQueueItem = function(item){
			return item.callback.apply(item.scope||History,item.args||[]);
		};

		/**
		 * History.pushQueue(callback,args)
		 * Add an item to the queue
		 * @param {Object} item [scope,callback,args,queue]
		 */
		History.pushQueue = function(item){
			// Prepare the queue
			History.queues[item.queue||0] = History.queues[item.queue||0]||[];

			// Add to the queue
			History.queues[item.queue||0].push(item);

			// Chain
			return History;
		};

		/**
		 * History.queue (item,queue), (func,queue), (func), (item)
		 * Either firs the item now if not busy, or adds it to the queue
		 */
		History.queue = function(item,queue){
			// Prepare
			if ( typeof item === 'function' ) {
				item = {
					callback: item
				};
			}
			if ( typeof queue !== 'undefined' ) {
				item.queue = queue;
			}

			// Handle
			if ( History.busy() ) {
				History.pushQueue(item);
			} else {
				History.fireQueueItem(item);
			}

			// Chain
			return History;
		};

		/**
		 * History.clearQueue()
		 * Clears the Queue
		 */
		History.clearQueue = function(){
			History.busy.flag = false;
			History.queues = [];
			return History;
		};


		// ====================================================================
		// IE Bug Fix

		/**
		 * History.stateChanged
		 * States whether or not the state has changed since the last double check was initialised
		 */
		History.stateChanged = false;

		/**
		 * History.doubleChecker
		 * Contains the timeout used for the double checks
		 */
		History.doubleChecker = false;

		/**
		 * History.doubleCheckComplete()
		 * Complete a double check
		 * @return {History}
		 */
		History.doubleCheckComplete = function(){
			// Update
			History.stateChanged = true;

			// Clear
			History.doubleCheckClear();

			// Chain
			return History;
		};

		/**
		 * History.doubleCheckClear()
		 * Clear a double check
		 * @return {History}
		 */
		History.doubleCheckClear = function(){
			// Clear
			if ( History.doubleChecker ) {
				clearTimeout(History.doubleChecker);
				History.doubleChecker = false;
			}

			// Chain
			return History;
		};

		/**
		 * History.doubleCheck()
		 * Create a double check
		 * @return {History}
		 */
		History.doubleCheck = function(tryAgain){
			// Reset
			History.stateChanged = false;
			History.doubleCheckClear();

			// Fix IE6,IE7 bug where calling history.back or history.forward does not actually change the hash (whereas doing it manually does)
			// Fix Safari 5 bug where sometimes the state does not change: https://bugs.webkit.org/show_bug.cgi?id=42940
			if ( History.bugs.ieDoubleCheck ) {
				// Apply Check
				History.doubleChecker = setTimeout(
					function(){
						History.doubleCheckClear();
						if ( !History.stateChanged ) {
							//History.debug('History.doubleCheck: State has not yet changed, trying again', arguments);
							// Re-Attempt
							tryAgain();
						}
						return true;
					},
					History.options.doubleCheckInterval
				);
			}

			// Chain
			return History;
		};


		// ====================================================================
		// Safari Bug Fix

		/**
		 * History.safariStatePoll()
		 * Poll the current state
		 * @return {History}
		 */
		History.safariStatePoll = function(){
			// Poll the URL

			// Get the Last State which has the new URL
			var
				urlState = History.extractState(History.getLocationHref()),
				newState;

			// Check for a difference
			if ( !History.isLastSavedState(urlState) ) {
				newState = urlState;
			}
			else {
				return;
			}

			// Check if we have a state with that url
			// If not create it
			if ( !newState ) {
				//History.debug('History.safariStatePoll: new');
				newState = History.createStateObject();
			}

			// Apply the New State
			//History.debug('History.safariStatePoll: trigger');
			History.Adapter.trigger(window,'popstate');

			// Chain
			return History;
		};


		// ====================================================================
		// State Aliases

		/**
		 * History.back(queue)
		 * Send the browser history back one item
		 * @param {Integer} queue [optional]
		 */
		History.back = function(queue){
			//History.debug('History.back: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.back: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.back,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.back(false);
			});

			// Go back
			history.go(-1);

			// End back closure
			return true;
		};

		/**
		 * History.forward(queue)
		 * Send the browser history forward one item
		 * @param {Integer} queue [optional]
		 */
		History.forward = function(queue){
			//History.debug('History.forward: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.forward: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.forward,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.forward(false);
			});

			// Go forward
			history.go(1);

			// End forward closure
			return true;
		};

		/**
		 * History.go(index,queue)
		 * Send the browser history back or forward index times
		 * @param {Integer} queue [optional]
		 */
		History.go = function(index,queue){
			//History.debug('History.go: called', arguments);

			// Prepare
			var i;

			// Handle
			if ( index > 0 ) {
				// Forward
				for ( i=1; i<=index; ++i ) {
					History.forward(queue);
				}
			}
			else if ( index < 0 ) {
				// Backward
				for ( i=-1; i>=index; --i ) {
					History.back(queue);
				}
			}
			else {
				throw new Error('History.go: History.go requires a positive or negative integer passed.');
			}

			// Chain
			return History;
		};


		// ====================================================================
		// HTML5 State Support

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/*
			 * Provide Skeleton for HTML4 Browsers
			 */

			// Prepare
			var emptyFunction = function(){};
			History.pushState = History.pushState||emptyFunction;
			History.replaceState = History.replaceState||emptyFunction;
		} // History.emulated.pushState

		// Native pushState Implementation
		else {
			/*
			 * Use native HTML5 History API Implementation
			 */

			/**
			 * History.onPopState(event,extra)
			 * Refresh the Current State
			 */
			History.onPopState = function(event,extra){
				// Prepare
				var stateId = false, newState = false, currentHash, currentState;

				// Reset the double check
				History.doubleCheckComplete();

				// Check for a Hash, and handle apporiatly
				currentHash = History.getHash();
				if ( currentHash ) {
					// Expand Hash
					currentState = History.extractState(currentHash||History.getLocationHref(),true);
					if ( currentState ) {
						// We were able to parse it, it must be a State!
						// Let's forward to replaceState
						//History.debug('History.onPopState: state anchor', currentHash, currentState);
						History.replaceState(currentState.data, currentState.title, currentState.url, false);
					}
					else {
						// Traditional Anchor
						//History.debug('History.onPopState: traditional anchor', currentHash);
						History.Adapter.trigger(window,'anchorchange');
						History.busy(false);
					}

					// We don't care for hashes
					History.expectedStateId = false;
					return false;
				}

				// Ensure
				stateId = History.Adapter.extractEventData('state',event,extra) || false;

				// Fetch State
				if ( stateId ) {
					// Vanilla: Back/forward button was used
					newState = History.getStateById(stateId);
				}
				else if ( History.expectedStateId ) {
					// Vanilla: A new state was pushed, and popstate was called manually
					newState = History.getStateById(History.expectedStateId);
				}
				else {
					// Initial State
					newState = History.extractState(History.getLocationHref());
				}

				// The State did not exist in our store
				if ( !newState ) {
					// Regenerate the State
					newState = History.createStateObject(null,null,History.getLocationHref());
				}

				// Clean
				History.expectedStateId = false;

				// Check if we are the same state
				if ( History.isLastSavedState(newState) ) {
					// There has been no change (just the page's hash has finally propagated)
					//History.debug('History.onPopState: no change', newState, History.savedStates);
					History.busy(false);
					return false;
				}

				// Store the State
				History.storeState(newState);
				History.saveState(newState);

				// Force update of the title
				History.setTitle(newState);

				// Fire Our Event
				History.Adapter.trigger(window,'statechange');
				History.busy(false);

				// Return true
				return true;
			};
			History.Adapter.bind(window,'popstate',History.onPopState);

			/**
			 * History.pushState(data,title,url)
			 * Add a new State to the history object, become it, and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.pushState = function(data,title,url,queue){
				//History.debug('History.pushState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.pushState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.pushState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.pushState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End pushState closure
				return true;
			};

			/**
			 * History.replaceState(data,title,url)
			 * Replace the State and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.replaceState = function(data,title,url,queue){
				//History.debug('History.replaceState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.replaceState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.replaceState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.replaceState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End replaceState closure
				return true;
			};

		} // !History.emulated.pushState


		// ====================================================================
		// Initialise

		/**
		 * Load the Store
		 */
		if ( sessionStorage ) {
			// Fetch
			try {
				History.store = JSON.parse(sessionStorage.getItem('History.store'))||{};
			}
			catch ( err ) {
				History.store = {};
			}

			// Normalize
			History.normalizeStore();
		}
		else {
			// Default Load
			History.store = {};
			History.normalizeStore();
		}

		/**
		 * Clear Intervals on exit to prevent memory leaks
		 */
		History.Adapter.bind(window,"unload",History.clearAllIntervals);

		/**
		 * Create the initial State
		 */
		History.saveState(History.storeState(History.extractState(History.getLocationHref(),true)));

		/**
		 * Bind for Saving Store
		 */
		if ( sessionStorage ) {
			// When the page is closed
			History.onUnload = function(){
				// Prepare
				var	currentStore, item, currentStoreString;

				// Fetch
				try {
					currentStore = JSON.parse(sessionStorage.getItem('History.store'))||{};
				}
				catch ( err ) {
					currentStore = {};
				}

				// Ensure
				currentStore.idToState = currentStore.idToState || {};
				currentStore.urlToId = currentStore.urlToId || {};
				currentStore.stateToId = currentStore.stateToId || {};

				// Sync
				for ( item in History.idToState ) {
					if ( !History.idToState.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.idToState[item] = History.idToState[item];
				}
				for ( item in History.urlToId ) {
					if ( !History.urlToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.urlToId[item] = History.urlToId[item];
				}
				for ( item in History.stateToId ) {
					if ( !History.stateToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.stateToId[item] = History.stateToId[item];
				}

				// Update
				History.store = currentStore;
				History.normalizeStore();

				// In Safari, going into Private Browsing mode causes the
				// Session Storage object to still exist but if you try and use
				// or set any property/function of it it throws the exception
				// "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to
				// add something to storage that exceeded the quota." infinitely
				// every second.
				currentStoreString = JSON.stringify(currentStore);
				try {
					// Store
					sessionStorage.setItem('History.store', currentStoreString);
				}
				catch (e) {
					if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
						if (sessionStorage.length) {
							// Workaround for a bug seen on iPads. Sometimes the quota exceeded error comes up and simply
							// removing/resetting the storage can work.
							sessionStorage.removeItem('History.store');
							sessionStorage.setItem('History.store', currentStoreString);
						} else {
							// Otherwise, we're probably private browsing in Safari, so we'll ignore the exception.
						}
					} else {
						throw e;
					}
				}
			};

			// For Internet Explorer
			History.intervalList.push(setInterval(History.onUnload,History.options.storeInterval));

			// For Other Browsers
			History.Adapter.bind(window,'beforeunload',History.onUnload);
			History.Adapter.bind(window,'unload',History.onUnload);

			// Both are enabled for consistency
		}

		// Non-Native pushState Implementation
		if ( !History.emulated.pushState ) {
			// Be aware, the following is only for native pushState implementations
			// If you are wanting to include something for all browsers
			// Then include it above this if block

			/**
			 * Setup Safari Fix
			 */
			if ( History.bugs.safariPoll ) {
				History.intervalList.push(setInterval(History.safariStatePoll, History.options.safariPollInterval));
			}

			/**
			 * Ensure Cross Browser Compatibility
			 */
			if ( navigator.vendor === 'Apple Computer, Inc.' || (navigator.appCodeName||'') === 'Mozilla' ) {
				/**
				 * Fix Safari HashChange Issue
				 */

				// Setup Alias
				History.Adapter.bind(window,'hashchange',function(){
					History.Adapter.trigger(window,'popstate');
				});

				// Initialise Alias
				if ( History.getHash() ) {
					History.Adapter.onDomLoad(function(){
						History.Adapter.trigger(window,'hashchange');
					});
				}
			}

		} // !History.emulated.pushState


	}; // History.initCore

	// Try to Initialise History
	if (!History.options || !History.options.delayInit) {
		History.init();
	}

})(window);
(function (w) {
    var ua = navigator.userAgent,
        head = document.getElementsByTagName("head")[0],
        bridge = w.bridge,
        g_config = {
            WindVane: {
                url: "http://a.tbcdn.cn/g/mtb/lib-windvane/1.2.4/windvane.js",
                api: {
                    'getLocation': function (cb) {
                        w.WindVane.api.geolocation.get(function (data) {
                            var la = data.coords.latitude,
                                lo = data.coords.longitude;
                            cb({latitude: la, longitude: lo});
                        }, cb, {
                            'enableHighAcuracy': true //精度
                        })
                    },
                    'confirm': function (param, cb) {//todo
                        var r = confirm(param.message),
                            msg = r ? {"ok": true} : {"ok": false};
                        cb && cb(msg);
                    },
                    'share': function (param) {
                        w.WindVane.api.base.showShareMenu(null, function (e) {
                            //todo 错误监控
                        }, {
                            image: param.image,
                            url: param.url,
                            title: param.title,
                            text: param.content
                        });
                    },
                    'login': function (param, cb) {
                        if (param.f == 1 || !lib.login.isLogin()) {
                            lib.login.goLogin({hideType: "reload"});
                        } else {
                            cb({success: true});
                        }
                    },
                    'pushWindow': function (param) {
                        window.location.href = param.url;
                    },
                    'alert': function (param, cb) {
                        alert(param.title ? param.title + '\n' : '' + param.message);
                    }
                }
            },
            Alipay: {
                api: {
                    'getLocation': function (cb) {
                        w.AlipayJSBridge.call("getLocation", function (data) {
                            cb({latitude: data.latitude, longitude: data.longitude});
                        });
                    },
                    'getNetworkType':function(cb){
                        w.AlipayJSBridge.call("getNetworkType", function (data) {
                            cb(data);
                        });
                    },
                    'share': function (param) {
                        var temp = param;
                        param = {
                            'channels': [
                                {
                                    name: 'Weibo', //新浪微博,图片不鞥超过145(?,分享后发现图片无效)所以不能用截屏
                                    param: {
                                        title: temp.title,
                                        content: temp.wb_content || temp.content,
                                        imageUrl: temp.wb_image,
                                        captureScreen: false, //分享当前屏幕截图(和imageUrl同时存在时，imageUrl > captureScreen)
                                        url: temp.url //分享跳转的url，当添加此参数时，分享的图片大小不能超过32K
                                    }
                                },
                                {
                                    name: 'LaiwangContacts', //来往好友
                                    param: {
                                        title: temp.title,
                                        content: temp.content,
                                        imageUrl: temp.image,
                                        captureScreen: true, //分享当前屏幕截图(和imageUrl同时存在时，imageUrl > captureScreen)
                                        url: temp.url //分享跳转的url
                                    }
                                },
                                // 来往不让分享到动态 会被删
                                // {
                                //     name: 'LaiwangTimeline', //来往好友圈
                                //     param: {
                                //         title: temp.title,
                                //         content: temp.content,
                                //         imageUrl: temp.image,
                                //         captureScreen: true, //分享当前屏幕截图(和imageUrl同时存在时，imageUrl > captureScreen)
                                //         url: temp.url //分享跳转的url
                                //     }
                                // },
                                {
                                    name: 'Weixin', //微信
                                    param: {
                                        title: temp.title,
                                        content: temp.content,
                                        imageUrl: temp.image,
                                        captureScreen: true, //分享当前屏幕截图(和imageUrl同时存在时，imageUrl > captureScreen)
                                        url: temp.url //分享跳转的url
                                    }
                                },
                                {
                                    name: 'WeixinTimeLine', //微信朋友圈
                                    param: {
                                        title: temp.title,
                                        content: temp.content,
                                        imageUrl: temp.image,
                                        captureScreen: true, //分享当前屏幕截图(和imageUrl同时存在时，imageUrl > captureScreen)
                                        url: temp.url //分享跳转的url
                                    }
                                },
                                {
                                    name: 'SMS', //短信
                                    param: {
                                        content: temp.content
                                    }
                                },
                                {
                                    name: 'CopyLink', //复制链接
                                    param: {
                                        url: temp.url
                                    }
                                }
                            ]
                        }
                        w.AlipayJSBridge.call("share", param);
                    },
                    'login': function (param, cb) {
                        w.AlipayJSBridge.call("login", cb);
                    },
                    'scan': function (param, cb) {
                        w.AlipayJSBridge.call('scan', param, cb);
                    },
                    'tradePay': function (param, cb) {
                        w.AlipayJSBridge.call('tradePay', param, cb);
                    },
                    'pushWindow': function (param) {
                        var _temp = {};
                        if (param.showToolBar) {
                            _temp.showToolBar = param.showToolBar;
                            _temp.closeButtonText = param.closeButtonText || '关闭'
                        }
                        _temp.showLoading = false;
                        _temp.showTitleBar = param.showTitleBar || false;

                        w.AlipayJSBridge.call('pushWindow', {
                            url: param.url,
                            param: _temp
                        });
                    },
                    'confirm': function (param, cb) {
                        w.AlipayJSBridge.call('confirm', param, cb);
                    },
                    'alert': function (param, cb) {
                        w.AlipayJSBridge.call('showAlert', param, cb);
                    },
                    'toast': function (param) {
                        w.AlipayJSBridge.call("toast", param);
                    },
                    showTitlebar: function () {
                        w.AlipayJSBridge.call('showTitlebar');
                    },
                    hideTitlebar: function (param, cb) {
                        w.AlipayJSBridge.call('hideTitlebar', param, cb);
                    },
                    closeWebview: function (param, cb) {
                        w.AlipayJSBridge.call('closeWebview', param, cb);
                    },
                    showLoading: function (param, cb) {
                        w.AlipayJSBridge.call('showLoading', param, cb);
                    },
                    hideLoading: function (param, cb) {
                        w.AlipayJSBridge.call('hideLoading', param, cb);
                    },
                    setOptionMenu: function (param, cb) {
                        w.AlipayJSBridge.call('setOptionMenu', param, cb);
                    },
                    hideOptionMenu: function () {
                        w.AlipayJSBridge.call("hideOptionMenu");
                    },
                    showOptionMenu: function () {
                        w.AlipayJSBridge.call("showOptionMenu");
                    },
                    setTitle: function (param) {
                        w.AlipayJSBridge.call("setTitle", param);
                    }
                }
            },
            other: {
                url: "http://a.tbcdn.cn/g/mtb/lib-windvane/1.2.4/windvane.js",
                'api': {
                    'login': function (param, cb) {
                        if (param.f == 1 || !lib.login.isLogin()) {
                            lib.login.goLogin({
                                widget: true,
                                hideType: 'reload'
                            });
                        } else {
                            cb({success: true});
                        }
                    },
                    'pushWindow': function (param) {
                        window.location.href = param.url;
                    },
                    'alert': function (param, cb) {
                        alert(param.message);
                    },
                    'confirm': function (param, cb) {//todo
                        var r = confirm(param.message),
                            msg = r ? {"ok": true} : {"ok": false};
                        cb && cb(msg);
                    }
                }
            }
        };

    var temp = {
        init: function () {
            var self = this,
                core = {
                    WindVane: 'WindVane',
                    Alipay: 'AlipayClient'//'AliApp\\(AP\/([\\d\.]+)\\)'
                },
                matched = 'other';
            for (var i in core) {
                var reg = new RegExp(core[i]);
                if(ua.match(reg)) {
                    matched = i;
                }
            }
            self.setEntry(matched);
            self.cfg && self.getScript();
        },
        cfg: null,
        setEntry: function (n) {
            var self = this;
            n = n || 'other';
            self.entry = n;
            self.cfg = g_config[n];
        },
        sta: "",
        queue: [],
        entry: '',
        push: function () {
            var self = this,
                arg = arguments;

            if (!self.sta && self.entry == 'Alipay') {
                try {
                    window.AlipayJSBridge.call('getNetworkType', function (result) {
                        self.sta = "ready";
                        self.exeHandlers();
                    });
                } catch (e) {
                }
            }

            if (arg.length) {
                self.queue.push(arg);
                self.sta == "ready" && self.exeCommand(arg);
            }
        },
        supportFunc: function (func) {
            var self = this,
                cfg = self.cfg,
                apiList;

            try {
                apiList = cfg.api || {};
            } catch (e) {
                console.log(e);
            }
            return apiList && apiList[func] ? true : false;

        },
        getScript: function () {
            var self = this,
                done = false,
                cfg = self.cfg;
            if (cfg["url"]) {
                var domscript = document.createElement("script");
                domscript.type = "text/javascript";
                domscript.async = true;
                domscript.src = cfg["url"];
                domscript.onload = domscript.onreadystatechange = function () {
                    if (!done && (!this.readyState ||
                        this.readyState === "loaded" || this.readyState === "complete")) {
                        done = true;
                        if (head && domscript.parentNode) {
                            head.removeChild(domscript);
                        }
                        self.sta = "ready";
                        self.exeHandlers();
                    }
                };
                head.appendChild(domscript);
            } else if (self.entry == 'Alipay') {
                document.addEventListener('AlipayJSBridgeReady', function () {
                    self.sta = "ready";
                    self.exeHandlers();
                }, false);
            }
        },
        exeCommand: function (ar) {
            var self = this,
                cfg = self.cfg,
                apiList = cfg.api,
                len = ar.length,
                func,
                param,
                cb;

            if (!apiList) return;
            if (len) {
                func = ar[0];
                len == 2 && (cb = ar[1]);
                len == 3 && (param = ar[1]) && (cb = ar[2]);
            }
            //force fresh
            if (func == 'login' && !param) {
                param = {};
            }
            try {
                if (self.supportFunc(func)) {
                    param ? apiList[func].call(self, param, cb) : apiList[func].call(self, cb);
                } else {
                    console.log("目前不支持" + func);
                }
            } catch (e) {
                console.log(e);
            }
        },
        exeHandlers: function () {
            var self = this,
                item,
                queue = self.queue;

            if (self.sta != "ready") return;

            while (item = queue.shift()) {
                self.exeCommand(item);
            }
        },
        isBridgeEnviroment: function () {
            return this.entry && this.entry != 'other' ? true : false;
        }
    };
    if (bridge && bridge.length) {
        temp.queue = bridge;
    }
    w.bridge = temp;
    w.bridge.init();
})(window);

/**
 * @Descript: H5-core, dd全局对象方法,lib,ui,模板引擎
 */

;
(function (window) {
    var doc = window.document;
    window.dd = window.dd || {};
    dd.lib = dd.lib || {};
    dd.ui = dd.ui || {};
    dd.app = dd.app || {};
    dd.config = {};
    dd.common = dd.common || {}; //公共业务
    dd.mtop_platform = 9;//不同平台,默认值是PC，wap默认是9，容错情况下
    /*dd.app.group = {};*/
    dd.event = {}; //事件命名
    dd.device = {}; //设备检测
    dd.navi = {
        'forward': false, //是否前进(左至右)
        'back': false, //是否后退(右至左)
        'hand': false, //是否手动触发事件(非浏览器前进后退)
        'alias': {
            shop_details: 'store'
            /*'index': 'group/index',
             'my': 'group/my'*/
        }
    };

    var bridge = window.bridge;

    //set webp mh5init.js
    MH5.webp.detectAndSetCookie();

    var ua = navigator.userAgent,
        platform = navigator.platform;

    /*
     * device
     * @version 设备系统版本
     * @needtouch 优化过click的设备，需要touch事件 ???
     */
    (function (device) {
        //平台&浏览器
        //舆情反馈搜集
        var sw = screen.width, sh = screen.height;
        var radio = window.devicePixelRatio || 1;
        sw *= radio;
        sh *= radio;
        device.rl = sw + "x" + sh;

        if (/Android/.test(ua)) {
            device.isAndroid = true;

            if (/UCBrowser/.test(ua)) {
                device.isUc = true;
            }

            if (/SCH-I959/.test(ua)) {
                device.isGalaxyS4 = true;
            }
            if (/m040/gi.test(ua)) {
                device.notSuppprtFixed = true;
            }
        } else if (/iPhone|iPod|iPad/.test(platform)) {
            device.isIos = true;
        }


        //设备系统版本
        var iosv = ua.match(/iPhone\s+OS\s+([\d_]+)/),
            androidv = ua.match(/Android\s+([\d.]+)/);

        var _iv_arr = iosv && iosv[1].split('_'),
            _av_arr = androidv && androidv[1].split('.');

        var _d_iv_arr = iosv && _iv_arr.splice(1, 3);


        device.version = {
            'ios': iosv && parseFloat(_iv_arr + '.' + _d_iv_arr.join(''), 10),
            'android': androidv && parseFloat(_av_arr.splice(0, 1) + '.' + _av_arr.join(''))
        }

        //ios 5.11以下容器滚动很烂，等同android处理
        if (!device.isAndroid) {
            if (device.version.ios && device.version.ios > 5.11) {
                device.iosStyle = true;
            }
        }

        //TODO: 删除
        device.needtouch = device.isGalaxyS4 ? true : false;

        //TODO: 删除
        var native_scroll = false;
        if (!device.isAndroid && !device.isIos) {
            native_scroll = true;
        }

        if (device.isIos && device.version.ios > 5) {
            native_scroll = true;
        }

        if (device.isAndroid && device.version.android > 4) {
            native_scroll = true;
        }

        device.nativeScroll = native_scroll;

        bridge.push("getNetworkType", function(result){
            dd.device.nw = result.networkType;
        });
    })(dd.device);

    dd._monitor_id = +new Date();
    dd.sendImage = function (v, pid) {
        var host = "//gm.mmstat.com/tddhv.1.1.1",
            temp = [],
            link;
        for (var i in v) {
            if (v.hasOwnProperty(i)) {
                temp.push(i + "=" + v[i]);
            }
        }
        var img = document.createElement('img');
        if (temp.length) {
            pid && temp.push("pid=" + pid);
            dd._monitor_id && temp.push("tid=" + dd._monitor_id);
            link = host + "?" + temp.join("&");
        }
        if (link) {
            img.src = link.toLowerCase();
            img.onload = img.onerror = function () {
                img.parentNode.removeChild(img);
            }
            document.body.appendChild(img);
        }
    };

    /*
     * hybrid兼容设置
     */
    (function (w, dd) {
        var bridge = w.bridge;

        if (bridge.entry != 'Alipay') {
            $("body").addClass("web-page");
            dd._env = "webPage";
        } else {
            bridge.push("showTitlebar");
        }
        if (bridge.supportFunc("setTitle")) {
            $('#J_page').addClass("hide_title_bar");
            dd._hideTitleBar = true;
        }
        document.addEventListener("optionMenu", function () {
            var url = History.getState().url,
                id = url && dd.lib.getUriParam(url, 'ddid'),
                current;
            id = id || 'index';
            if (current = dd._menuHandler[id]) {
                current.context[current.handler]();
            }
        }, false);
    })(window, dd);
    /*
     * 事件配置
     */
    dd.event = {
        /*
         * touchend 用于安卓及pc，click事件对于不同设备和docuemtn版本的bug太多，iscroll兼容问题
         * click用于ios，extend by fastClick
         */
        'click': 'click',
        'touchmoveHandler': function (e) { //addEventListener removeEventListener
            //if (dd.device.isAndroid /*&& !dd.device.nativeScroll*/ ) {
            //e.preventDefault();
            //}
        },
        'stoptouchmoveHandler': function (e) {
            e.preventDefault();
        }
    }

    /****ui****/

    /*
     * 页面切换动画时长
     */
    dd.ui.appinterval = 300;

    /*
     * 公共模板
     * load 加载
     * error 错误模板，重试
     */
    dd.ui.tpl = {
        load: '<div class="core_loading"><i></i><span>努力加载中...</span></div>',
        error: '<div class="no_content J_retry"><i></i><%=msg%> 点击重试</div>',
        none: '<div class="no_content"><i></i><%=msg%></div>',
        geo: '<div class="core_loading"><i></i><span>正在定位...</span></div>'
    }


    //ui

    /*
     * dd.ui.toast
     * loading+(mtop)错误提示
     * 如果参数带view，则查询和替换loading模板为全局错误提示，附带模块重载，依赖view.wrap, view.initHandler
     */
    var toast_wrap = $('#J_toast'),
        toast_loading = $('#J_toast_loading'),
        supportToast = bridge.supportFunc("toast"),
        supportLoading = bridge.supportFunc("showLoading"),
        toast_tips = $('#J_toast_tips'),
        c_timer;


    dd.ui.toast = function (data, view) {
        toast_loading.hide();
        supportToast && toast_wrap.hide() && bridge.push("hideLoading");
        var str,
            showAlert = function (m, t) {
                supportToast ? bridge.push("toast", {
                    content: m,
                    type: t || 'none',
                    duration: 3000
                }) : toast_tips.html('<span>' + m + '</span>').show();
            };

        if (!data) return;
        if (typeof data == 'string') {
            showAlert(data);
            str = data;
        } else if (data.ret) {
            str = data.ret[0].split('::')[1];
            if (/SESSION/.test(str)) {
                str = '网络问题，请登录';
                bridge.supportFunc("login") ? bridge.push("login", {f: 1}, function (result) {
                }) : showAlert('网络问题', '请登录');
            } else {
                showAlert(str, 'fail');
            }
        } else {
            str = '网络问题，请重试';
            showAlert(str, 'fail');
        }

        //check loading
        if (view && view.wrap && view.wrap.find('.core_loading').length) {
            //替换错误loading
            str = str || '网络问题';
            view.wrap.find('.core_loading').replaceWith(dd.ui.tmpl(dd.ui.tpl.error, {
                msg: str
            }));
            view.wrap.find('.J_retry').on('click', function () {
                if (view && view.initHandler) {
                    //重试
                    view.initHandler.call(view)
                }
            });
            return;
        } else {
            //view && view.wrap && view.wrap.find('.J_pullUp').length && view.wrap.find('.J_pullUp').removeClass('async');
            if (view && view._scroll) {
                var scroll_el = view._scroll.scrollEl;
                var pullUp_el = view.wrap.find('.J_pullUp');
                if (pullUp_el.length) {
                    pullUp_el.addClass('dn');
                    pullUp_el.removeClass('async');
                    setTimeout(function () {
                        pullUp_el.removeClass('dn');
                    }, 1000)
                }
            }
            !supportToast && toast_wrap.show();
        }

        if (c_timer) {
            clearTimeout(c_timer);
        }
        c_timer = setTimeout(function () {
            if (supportLoading) {
                bridge.push("hideLoading");
            } else {
                toast_wrap.hide();
            }
        }, 3000);

    };
    dd.ui.toast.loading = function () {
        if (supportLoading) {
            bridge.push("showLoading");
        } else {
            toast_tips.hide();
            toast_wrap.show();
            toast_loading.show();
        }
    }
    dd.ui.toast.hide = function () {
        if (supportLoading) {
            bridge.push("hideLoading");
        } else {
            toast_wrap.hide();
        }
    }


    dd.ui._scroll = function (options) {
        var _this = this;
        var wrap = options.wrap,
            pullUpAction = options.pullUpAction;

        var $wrap = $(wrap);

        var $page = $wrap.parents('.sp_pages'),
            page = $page[0] && $page[0].id;

        var _event = 'scroll.' + page;

        var scroll_el = !dd.device.iosStyle ? $(window) : $wrap;

        var page_height = _getPageHeight(),
            scroll_height = _getScrollHeight(),
            load_threshold = 100,
            scroll_y_max = _getScrollMax();

        var pullup_el = $wrap.find('.J_pullUp');

        if (pullUpAction) {
            scroll_el.off(_event).on(_event, function () {
                _bind();
            });
        }

        function _bind() {
            var _this = this;

            if (_this.load_disable) {
                return
            }

            //翻页完毕或请求中
            if (pullup_el.hasClass('dn') || pullup_el.hasClass('async')) {
                return;
            }

            var scroll_top = !dd.device.iosStyle ? doc.body.scrollTop : $wrap[0].scrollTop;

            //大于指定高度
            if (scroll_top > scroll_y_max && scroll_y_max > 0) {
                pullup_el.addClass('async');
                pullUpAction();
            }
        }


        _lazyload();

        function _lazyload() {
            var lazys = $wrap.find('.J_lazy');
            if (lazys.length) {
                lazys.lazyload({
                    'container': !dd.device.iosStyle ? window : $wrap
                    /*
                     'threshold': 50*/
                });
            }
        }

        function _getPageHeight() {
            return !dd.device.iosStyle ? $(window).height() : $page[0].clientHeight
        }

        function _getScrollHeight() {
            return !dd.device.iosStyle ? doc.body.scrollHeight : $wrap[0].scrollHeight
        }

        function _getScrollMax() {
            return scroll_height - page_height - load_threshold
        }

        return {
            scrollEl: scroll_el,
            //刷新滚动配置状态
            refresh: function () {
                if (!pullup_el) {
                    return
                }

                if (pullup_el.hasClass('async')) {
                    pullup_el.removeClass('async');
                }

                page_height = _getPageHeight();

                scroll_height = _getScrollHeight();
                scroll_y_max = _getScrollMax();

                _lazyload();
            },
            //滚动时不监听加载
            disable: function () {
                _this.load_disable = true;
                doc.addEventListener('touchmove', dd.event.stoptouchmoveHandler, false);

                scroll_el.off(_event);
            },
            //滚动时监听加载
            enable: function () {
                _this.load_disable = false;
                doc.removeEventListener('touchmove', dd.event.stoptouchmoveHandler, false);

                if (pullUpAction) {
                    scroll_el.off(_event).on(_event, function () {
                        _bind();
                    });
                }
            }/*,
             //touchmove不可用
             touchDisable: function() {
             document.addEventListener('touchmove', dd.event.stoptouchmoveHandler, false);
             },
             //touchmove可用
             touchEnable: function() {
             document.removeEventListener('touchmove', dd.event.stoptouchmoveHandler, false);
             }*/
        }

    }

    /**/
    var dialogtpl = '<div class="J_dialog_wrap" style="position: fixed;left: 0;bottom: 0;width: 100%;height:100%;z-index:99;"><div class="pop_mask J_wrap_mask" style=""></div>' +
        '<div class="dialog_pop J_wrap_dialog <%=cls%>" id="">' +
        '<div class="">' +
        '<div class="dialog_close_wrap J_dialog_close"><i class="pop_close_icon"></i></div>' +
        '<div class="pop_wrap" id=""><div class="">' +
        '<h2><%=title%></h2>' +
        '<div class="J_scroll pop_scroll_wrap" style="<%if(iheight){%>height:<%=maxheight%>px;<%}else{%><%if(maxheight){%>max-height:<%=maxheight%>px<%}else{%>height:<%=height%>px<%}}%>"><div class="dialog_content J_dialog_content"><%=content%></div></div>' +
        '<%if(bottom){%><div class="pop_bottom"><%=bottom%></div><%}%>' +
        '</div></div>' +
        '</div></div></div>';
    dd.ui.dialog = function (options) {
        var wrap = options.wrap,
            cls = options.cls || '',
            type = options.type || 'html', //暂只支持html
            title = options.title || '',
            content = options.content || '',
            bottom = options.bottom || '',
            maxheight = options.maxheight || '150', //内容区最大高度
            height = options.height || '150', //高度固定
            callback = options.callback;

        var $wrap = $(wrap);

        //var popscroll;

        var tpl = dd.ui.tmpl(dialogtpl, {
            'cls': cls,
            'title': title,
            'content': content,
            'bottom': bottom,
            'height': height,
            'maxheight': maxheight,
            'iheight': dd.device.isAndroid && dd.device.version.android < 4 ? true : false //
        });

        if ($wrap.find('.J_wrap_mask').length) {
            $wrap.find('.J_dialog_wrap').remove();
        }

        //popscroll && popscroll.destroy();

        $wrap.append(tpl);

        /*if (dd.device.isAndroid && dd.device.version.android < 4) {
         popscroll = new IScroll($wrap.find('.J_scroll')[0], {
         useTransition: false
         });
         }*/

        $wrap.find('.J_dialog_close, .J_wrap_mask').on('click', function () {
            /*$wrap.find('.J_wrap_mask').hide();
             $wrap.find('.J_wrap_dialog').hide();*/
            $wrap.find('.J_dialog_wrap').remove();
        });

        callback && callback();

        return {
            'setTitle': function (str) {
                $wrap.find('.J_dialog_wrap h2').html(str)
            },

            'hide': function () {
                $wrap.find('.J_dialog_wrap').remove();
            },
            'wrap': $wrap.find('.J_dialog_wrap')
        }
    }

    /*
     * select组件
     * @param {object} options 构造参数
     *      options.datasource {object} 数据源
     *      options.type {string} radio|checkbox 单选或者多选，默认为单选
     */
    function Select(options) {

    }

    Select.prototype = {
        init: function () {

        }
    }

    dd.ui.select = Select;

    /*
     * dd.ui.alipay 支付宝
     * anroid2.3 iframe高度问题，不支持滚动
     * @param {string} title - 标题
     * @param {string} alipayUrl - 支付宝H5 url
     * @param {object} successFunc - 完成回调
     * @param {object} backFunc - 不做操作回调
     */
    var alipay_wrap = $('#J_alipay'),
        tpl_alipay = $('#J_tpl_alipay');
    dd.ui.alipay = function (options) {
        var data = {
            'title': options.title || "支付",
            'optionMenu': options.optionMenu || "支付完成",
            'alipayUrl': options.alipayUrl,
            'isAlipay': bridge.entry == 'Alipay' ? 'true' : 'false'
        };
        var tpl = dd.ui.tmpl(tpl_alipay.html(), data);
        alipay_wrap.show().html(tpl);
        $("#J_page").hide();
        alipay_wrap.find("iframe").on("load", function () {
            alipay_wrap.find(".core_loading").hide();
        });

        window.scrollTo(0, 0);
        //返回
        alipay_wrap.find('#J_alipay_back').on('click', function () {
            $("#J_page").show();
            options.backFunc && options.backFunc();
            alipay_wrap.hide().empty();
        });

        //支付完成 
        alipay_wrap.find('#J_pay_success').on('click', function () {
            $("#J_page").show();
            options.successFunc && options.successFunc();
            alipay_wrap.hide().empty();
        });
    }


    /**** lib ****/

    /*
     * hash参数分割, from(_ backbone)
     */
    var _ArrayProto = Array.prototype,
        _nativeMap = _ArrayProto.map;
    dd.lib.extractHashParams = function (reg, fragment) {
        var params = reg.exec(fragment).slice(1);
        return _map(params, function (param) {
            return param ? decodeURIComponent(param) : null;
        });
    };

    function _map(obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        if (_nativeMap && obj.map === _nativeMap) return obj.map(iterator, context);
        each(obj, function (value, index, list) {
            results.push(iterator.call(context, value, index, list));
        });
        return results;
    };

    /*
     * 从state url中获取参数值
     */
    dd.lib.getUriParam = function (uri, param) {
        // Create
        var basePageUrl = (uri).replace(/[#\?].*/, '').replace(/[^\/]+$/,function (part, index, string) {
            return (/[^\/]$/).test(part) ? '' : part;
        }).replace(/\/+$/, '') + '/';

        var _uri = uri.replace(basePageUrl, '');

        var reg = new RegExp('(^|&?)' + param + '=([^&|#]*)(&|#|$)'); // 'i'
        var r = _uri.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return null;
    };

    /*
     * 过滤精度计算的误差，toFixed三位数
     */
    dd.lib.num2Fixed = function (num, bit) {
        var bit = bit || 3;
        if (String(num).indexOf('.') > 0) {
            return parseFloat(num.toFixed(bit));
        } else {
            return num;
        }
    }

    /*
     * 经纬度距离计算
     * @param {string} geo - 定位位置参数
     * @param {string} point - 目标位置参数
     */
    dd.lib.geoDistance = function (geo, point) {
        //目标位置
        var x1 = parseFloat(point.longitude); //longitude
        var y1 = parseFloat(point.latitude); //latitude

        //定位位置
        var x2 = parseFloat(geo.longitude) || 0;
        var y2 = parseFloat(geo.latitude) || 0;

        if (x1 == 0 || y1 == 0 || x2 == 0 || y2 == 0) {
            return 0;
        } else {
            return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) * 100000;
        }

    }

    /*
     * 检测localstorage
     */
    dd.lib.localStorageDetect = function () {
        try {
            if (window.localStorage == 'undefined') {
                return false;
            } else {
                var key = 'testSupportKey';
                window.localStorage.setItem(key, '1');
                var value = window.localStorage.getItem(key);
                window.localStorage.removeItem(key);
                return '1' == value;
            }
        } catch (e) {
        }
        return false;
    }

    /*
     * 记录是否支持localstorage
     */
    dd.lib.isSuppLocalStorage = dd.lib.localStorageDetect();

    /**
     * 内存（变量）
     * hold: default_address, city_list, current_city
     */
    var memCacheObj = {};
    dd.lib.memCache = {
        set: function (key, value) {
            memCacheObj['dd_' + key] = value;
        },
        get: function (key) {
            return memCacheObj['dd_' + key];
        },
        removeValue: function (key) {
            delete memCacheObj['dd_' + key];
        }
    };


    /*
     * 本地存储，不支持localStorage则降级为dd.lib.memCache
     * 敏感信息慎用本地存储，建议用dd.lib.memCache
     */
    dd.lib.localStorage = {
        set: function (key, value) {
            if (dd.lib.isSuppLocalStorage) {
                localStorage.setItem('dd_' + key, JSON.stringify(value));
            } else {
                dd.lib.memCache.set(key, value);
            }
        },
        get: function (key) {
            if (dd.lib.isSuppLocalStorage) {
                var v = window.localStorage['dd_' + key]
                return v && v != 'undefined' ? JSON.parse(v) : null;
            } else {
                return dd.lib.memCache.get(key)
            }
        },
        removeValue: function (key) {
            if (dd.lib.isSuppLocalStorage) {
                localStorage.removeItem('dd_' + key);
            } else {
                dd.lib.memCache.removeValue(key);
            }
        }
    };

    /*
     * 本地存储时间对比，清理
     */
    dd.lib.cache_t = window.dd_cache_t || '1404012343';
    var cache_t = dd.lib.localStorage.get('cache_t');
    if (!cache_t || cache_t !== dd.lib.cache_t) {
        dd.lib.localStorage.removeValue('inorder_data');
        dd.lib.localStorage.set('cache_t', dd.lib.cache_t);
    }

    /*
     * dd.lib.ddState 页面切换 push back replace
     * @options
     * @param {object} options.push - 页面从右到左切换
     * @options.push {string} ddid - 要push的页面标识，必填
     * @options.push {object} obj - 数据对象，其中：obj.referer - 来源的页面标识（选填）
     *
     * @param {object} options.back - 页面从左到右切换,并删减crumbs记录
     * @options.back {string} ddid - 要back的页面标识，选填，multi为false时后退到crumbs里的倒数第二条记录
     * @options.back {object} obj - 数据对象(选填)
     *
     * @param {object} options.replace - 页面从右到左切换，replace当前state，并重置crumbs记录
     * @options.replace {string} ddid - 要replace的页面标识，必填
     * @options.replace {object} obj - 数据对象(选填)
     */
    dd.crumbs = dd.lib.localStorage.get('crumbs') || []; //面包屑数组
    dd.lib.ddState = function (options) {
        var push = options.push,
            back = options.back,
            replace = options.replace;

        dd.navi.hand = true;

        if (push) {
            dd.navi.forward = true;
            History.replaceState(push.obj, '淘点点', '?_ddid=' + push.ddid + dd.config.url_track);
        } else if (back) {
            crumbsPop(back.ddid, back.multi);
            var _ddid = dd.crumbs[dd.crumbs.length - 1];
            dd.navi.alias[_ddid] && (_ddid = dd.navi.alias[_ddid]);
            dd.navi.back = true;
            History.replaceState(back.obj, '淘点点', '?_ddid=' + _ddid + dd.config.url_track);

        } else if (replace) {
            dd.navi.forward = true;
            History.replaceState(replace.obj, '淘点点', '?_ddid=' + replace.ddid + dd.config.url_track);
            dd.crumbs = [replace.ddid];
            dd.lib.localStorage.set('crumbs', [replace.ddid]);
        }

    };

    /*
     * 获取平台数据
     */
    (function (win, device) {
        var platform, ttidList;
        if (ua.match(/Alipay/i)) {
            platform = 'alipay';
        } else if (ua.match(/tbmenu/i)) {
            platform = "dd";
        } else if (ua.match(/taobao/i)) {
            platform = 'tb';
        } else if (device.isAndroid || device.isIos) {
            platform = 'wap';
        } else {
            platform = 'pc';
        }

        var _ttid = dd.lib.getUriParam(location.search, 'ttid');

        $.ajax({
            url: 'http://market.m.taobao.com/market/diandian/platform-config.php',
            dataType: 'jsonp',
            success: function (data) {
                var dd_app_ttid = data.dd_app_ttid,
                    dd_banner_cfg = data.dd_banner_cfg,
                    dd_plat_cfg = data.dd_plat_cfg;

                try {
                    if (_ttid) {
                        if (ttidList = dd_app_ttid) {
                            for (var i in ttidList) {
                                if (ttidList[i] == _ttid) {
                                    platform = i;
                                }
                            }
                        }
                    }

                    if (platform) {
                        platform = platform.toLowerCase();
                        if (dd_plat_cfg) {
                            dd.mtop_platform = isNaN(dd_plat_cfg[platform]) ? '' : dd_plat_cfg[platform];
                        }
                        if (dd_banner_cfg) {
                            dd.mtop_banner_request = dd_banner_cfg[platform] || dd_banner_cfg['wap'];
                        }
                        $(document).trigger("cfgReady");
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        });
    })(window, dd.device);

    /*
     * dd.lib.crumbsPop 页面back切换面包屑截取
     * @param {string} ddid - 切入的页面标识
     * @param {boolean} multi - 是否多步back
     */
    function crumbsPop(ddid, multi) {

        if (dd.crumbs.length <= 1) {
            //load的view
            dd.crumbs = [ddid];
            dd.lib.localStorage.set('crumbs', [ddid]);
        } else {
            if (!multi) {
                //单步后退
                dd.crumbs.pop();
                dd.lib.localStorage.set('crumbs', dd.crumbs);
            } else {
                //多步后退

                //验证面包屑是否含目标ddid
                var reg = new RegExp('^(' + ddid + ')($|\/)');
                var index;
                for (var i = 0, len = dd.crumbs.length; i < len; i++) {
                    if (reg.test(dd.crumbs[i])) {
                        index = i + 1;
                    }
                }

                if (index) {
                    //能定位到面包屑
                    for (var i = 0, len = dd.crumbs.length - index; i < len; i++) {
                        dd.crumbs.pop();
                        dd.lib.localStorage.set('crumbs', dd.crumbs);
                    }
                } else {
                    //无法定位到
                    dd.crumbs = [ddid];
                    dd.lib.localStorage.set('crumbs', dd.crumbs);
                }
            }
        }
    }

    /*
     * 拦截点击
     */
    dd.lib.preventAllClick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }

    /*
     * webp判定+cdn后缀
     */
    dd.lib.imgSuffix = function () {
        return 'true' == MH5.cookie.getCookie("supportWebp") ? '_.webp' : '';
    }();


    /*
     * 调用设备地址识别
     * uri: tel:, email:
     */
    dd.lib.deviceUri = function (uri) {
        if ($('#J_deviceuri_iframe')) {
            $('#J_deviceuri_iframe').remove();
        }
        $('body').append('<iframe src="' + uri + '" id="J_deviceuri_iframe"></iframe>');
    };

    /*
     * native跳转的schema转换为ddid
    */
    (function(){
        dd.lib.translateNativeSchema2Ddid = function(uri){
            var schema = uri.replace(/^taobaocoupon:\/\//, ''),
                schema_arr = schema.split('?'),
                schema_cls = schema_arr[0],
                schema_param_obj = {};

            if (schema_arr[1]) {
                var _paramarr = schema_arr[1].split('&');
                $.each(_paramarr, function (k, v) {
                    var _v = v.split('=');
                    schema_param_obj[_v[0]] = _v[1];
                });
            }

            var ddid;console.log(schema_param_obj)

            switch (schema_cls) {
                case 'index':
                    ddid = 'index';
                    break;
                case 'dd':
                    ddid = 'dian';
                    break;
                case 'waimai':
                    ddid = 'delivery';
                    break;
                case 'me':
                    ddid = 'my';
                    break;
                case 'dd':
                    ddid = 'dian';
                    break;
                case 'myreserve':
                    ddid = 'my_reserve';
                    break;
                case 'reserve':
                    ddid = 'reserve_shops';
                    break;
                case 'reservedetail':
                    ddid = 'reserve_datelist/' + schema_param_obj.shopid;
                    break;
                case 'storecoupondetail':
                    ddid = 'evoucher/' + schema_param_obj.id + '/' + (schema_param_obj.storeid || '');
                    break;
                case 'mycoupondetail':
                    ddid = 'my_evoucher_details/' + schema_param_obj.id;
                    break;
                case 'menu':
                    if (schema_param_obj.takeoutid) {
                        ddid = 'carte/delivery/' + schema_param_obj.takeoutid
                    } else {
                        ddid = 'carte/dian/' + schema_param_obj.id
                    }
                    break;
                case 'store':
                    ddid = 'store/' + schema_param_obj.id
                    break;
                default:
                    ddid = 'index';
            }

            return ddid;
        }
    })();


    /*
     * history后退到最近一次指定的ddid或者白名单列表中的ddid
     */
    (function () {
        dd.lib.go_back = function (cb) {
            var h = window.History,
                current_index = h.getCurrentIndex(),
                last_index,
                stopped = false,
                saveStates = h.savedStates,
                whileList = ['delivery'],
                ddid = arguments[0];
            for (var i = current_index; i >= 0; i--) {
                var state = saveStates[i],
                    d = state.data,
                    pageId = d.page && d.page.replace(/^\s*|\s$/, '');
                if (pageId && !stopped) {
                    if (ddid && ddid == pageId) {
                        last_index = i;
                        stopped = true;
                    } else {
                        for (var j = 0; j < whileList.length; j++)
                            if (pageId == whileList[j]) {
                                last_index = i;
                                stopped = true;
                            }
                    }
                }
            }
            if (!isNaN(last_index)) {
                var search_state = saveStates[last_index],
                    search_ttid = search_state.data.page;
                $("#J_page").find(".sp_pages").each(function (index, ele) {
                    if ($(ele).attr("data-ddid") == search_ttid) {
                        $(ele).removeAttr("data-ddid");
                    }
                });
                var temp = [];
                for (var i = 0; i < saveStates.length; i++) {
                    i < last_index && temp.push(saveStates[i]);
                }
                h.savedStates = temp;
                h.pushState(search_state.data, '淘点点', '?_ddid=' + search_ttid);
            } else {
                cb && cb();
            }
        }
    })();


    /*
     * 定位
     * 客户端windvane定位， html5定位
     * 定位成功后请求 mtop.life.diandian.getCityList 获取城市信息，记录city_list，geo_location
     * 成功/失败 回调，@params：options.callback
     */
    (function (w) {
        var g_timer,
            wv_timer,
            g_pos = {};

        w.bridge = w.bridge || [];
        var bridge = w.bridge;
        //todo
        dd.lib.getH5Geo = function (options) {
            if (bridge.isBridgeEnviroment()) {
                bridge.push("getLocation", wvGeo);
                //windvane定位超时
                wv_timer = setTimeout(function () {
                    html5GetLocation();
                }, 5000);
            } else {
                html5GetLocation();
            }
            $(document).one('setOnH5Geo', function (e, data) {
                if (options && options.callback) {
                    options.callback(g_pos, data);
                }
            });
        }

        //bridge定位
        function wvGeo() {
            var args = arguments[0];
            if (args) {
                g_pos.latitude = args.latitude;
                g_pos.longitude = args.longitude;
            }
            wv_timer && clearTimeout(wv_timer);
            geoHandler();
        }

        //html5定位
        function html5GetLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(html5LocationSuccess, html5LocationError, {
                    // 指示浏览器获取高精度的位置，默认为false
                    enableHighAcuracy: true,
                    // 指定获取地理位置的超时时间，默认不限时，单位为毫秒
                    timeout: 4000,
                    // 最长有效期，在重复获取地理位置时，此参数指定多久再次获取位置。
                    maximumAge: 1000 * 60 * 15 //5分钟
                });

                //支持geolocation但是webview的chromeclient设置不足，5.1秒后超时
                g_timer = setTimeout(function () {
                    geoError();
                }, 4500);
            } else {
                //不支持html5定位
                geoError('无法定位');
            }
        }

        //html5定位出错
        function html5LocationError(error) {
            switch (error.code) {
                case error.TIMEOUT:
                    //默认已做超时处理
                    //geoError();
                    break;
                case error.POSITION_UNAVAILABLE:
                    geoError('无法获取定位信息');
                    break;
                case error.PERMISSION_DENIED:
                    geoError('请在手机"设置"中开启定位服务');
                    break;
                case error.UNKNOWN_ERROR:
                    geoError('未知错误');
                    break;
                default:
                    geoError('无法定位');
            }
        }

        //定位成功
        function html5LocationSuccess(position) {
            g_timer && clearTimeout(g_timer);
            var coords = position.coords;
            g_pos.latitude = coords.latitude;
            g_pos.longitude = coords.longitude;
            geoHandler();
        }

        //错误信息
        function geoError(str) {
            g_timer && clearTimeout(g_timer);

            dd.ui.toast(str);
            geoHandler();
        }

        //定位处理
        function geoHandler() {
            getCityList()
        }

        //获取城市列表数据
        function getCityList() {
            lib.mtop.request({
                api: 'mtop.life.diandian.getCityList',
                v: '2.0',
                data: {
                    'x': g_pos.longitude,
                    'y': g_pos.latitude
                },
                extParam: {}
            }, function (data) {
                var _data = data.data;
                dd.lib.memCache.set('city_list', _data.cityList);
                //防止重复请求重置
                if (!dd.lib.localStorage.get('current_city')) {
                    dd.lib.localStorage.set('current_city', _data.location);
                }
                if (_data.location) {
                    dd.lib.memCache.set('geo_location', _data.location);
                }
                $(document).trigger('setOnH5Geo', data);
            }, function (data) {
                dd.ui.toast(data);
                $(document).trigger('setOnH5Geo', data);
            });
        }
    })
        (window);

    /*
     * Lazy Load - jQuery plugin for lazy loading images
     *
     * Copyright (c) 2007-2013 Mika Tuupola
     *
     * Licensed under the MIT license:
     *   http://www.opensource.org/licenses/mit-license.php
     *
     * Project home:
     *   http://www.appelsiini.net/projects/lazyload
     *
     * Version:  1.8.5
     * @modify: [src=""] ==> [style="background-image:url()"]
     */
    //;
    (function ($, window, document, undefined) {
        var $window = $(window);

        $.fn.lazyload = function (options) {
            var elements = this;
            var $container;
            var settings = {
                threshold: 0,
                failure_limit: 0,
                event: "scroll",
                effect: "show",
                container: window,
                data_attribute: "original",
                skip_invisible: true,
                appear: null,
                load: null
            };

            function update() {
                var counter = 0;

                elements.each(function () {
                    var $this = $(this);
                    if (settings.skip_invisible && $this.css("display") === "none") {
                        return;
                    }
                    if ($.abovethetop(this, settings) ||
                        $.leftofbegin(this, settings)) {
                        /* Nothing. */
                    } else if (!$.belowthefold(this, settings) && !$.rightoffold(this, settings)) {
                        $this.trigger("appear");
                        /* if we found an image we'll load, reset the counter */
                        counter = 0;
                    } else {
                        if (++counter > settings.failure_limit) {
                            return false;
                        }
                    }
                });

            }

            if (options) {
                /* Maintain BC for a couple of versions. */
                if (undefined !== options.failurelimit) {
                    options.failure_limit = options.failurelimit;
                    delete options.failurelimit;
                }
                if (undefined !== options.effectspeed) {
                    options.effect_speed = options.effectspeed;
                    delete options.effectspeed;
                }

                $.extend(settings, options);
            }

            /* Cache container as jQuery as object. */
            $container = (settings.container === undefined ||
                settings.container === window) ? $window : $(settings.container);

            /* Fire one scroll event per scroll. Not one scroll event per image. */
            if (0 === settings.event.indexOf("scroll")) {
                $container.on(settings.event, function (event) {
                    return update();
                });
            }

            this.each(function () {
                var self = this;
                var $self = $(self);

                self.loaded = false;

                /* When appear is triggered load original image. */
                $self.one("appear", function () {
                    if (!this.loaded) {
                        if (settings.appear) {
                            var elements_left = elements.length;
                            settings.appear.call(self, elements_left, settings);
                        }
                        $("<img />")
                            .on("load", function () {
                                $self
                                    .hide()
                                    .css('backgroundImage', 'url(' + $self.data(settings.data_attribute) + ')')[settings.effect](settings.effect_speed);
                                self.loaded = true;

                                /* Remove image from array so it is not looped next time. */
                                var temp = $.grep(elements, function (element) {
                                    return !element.loaded;
                                });
                                elements = $(temp);

                                if (settings.load) {
                                    var elements_left = elements.length;
                                    settings.load.call(self, elements_left, settings);
                                }
                            })
                            .attr("src", $self.data(settings.data_attribute));
                    }
                });

                /* When wanted event is triggered load original image */
                /* by triggering appear.                              */
                if (0 !== settings.event.indexOf("scroll")) {
                    $self.on(settings.event, function (event) {
                        if (!self.loaded) {
                            $self.trigger("appear");
                        }
                    });
                }
            });

            /* Check if something appears when window is resized. */
            $window.on("resize", function (event) {
                update();
            });

            /* With IOS5 force loading images when navigating with back button. */
            /* Non optimal workaround. */
            if ((/iphone|ipod|ipad.*os 5/gi).test(navigator.appVersion)) {
                $window.on("pageshow", function (event) {
                    // if (event.originalEvent.persisted) {
                    event = event.originalEvent || event;
                    if (event.persisted) {
                        elements.each(function () {
                            $(this).trigger("appear");
                        });
                    }
                });
            }

            /* Force initial check if images should appear. */
            /*$(window).on("load", function() {
             update();
             });*/
            update();

            return this;
        };

        /* Convenience methods in jQuery namespace.           */
        /* Use as  $.belowthefold(element, {threshold : 100, container : window}) */

        $.belowthefold = function (element, settings) {
            var fold;

            if (settings.container === undefined || settings.container === window) {
                fold = $window.height() + $window[0].scrollY;
            } else {
                fold = $(settings.container).offset().top + $(settings.container).height();
            }

            return fold <= $(element).offset().top - settings.threshold;
        };

        $.rightoffold = function (element, settings) {
            var fold;

            if (settings.container === undefined || settings.container === window) {
                fold = $window.width() + $window[0].scrollX;
            } else {
                fold = $(settings.container).offset().left + $(settings.container).width();
            }

            return fold <= $(element).offset().left - settings.threshold;
        };

        $.abovethetop = function (element, settings) {
            var fold;

            if (settings.container === undefined || settings.container === window) {
                fold = $window[0].scrollY;
            } else {
                fold = $(settings.container).offset().top;
            }

            return fold >= $(element).offset().top + settings.threshold + $(element).height();
        };

        $.leftofbegin = function (element, settings) {
            var fold;

            if (settings.container === undefined || settings.container === window) {
                fold = $window[0].scrollX;
            } else {
                fold = $(settings.container).offset().left;
            }

            return fold >= $(element).offset().left + settings.threshold + $(element).width();
        };

        $.inviewport = function (element, settings) {
            return !$.rightoffold(element, settings) && !$.leftofbegin(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
        };

        /* Custom selectors for your convenience.   */
        /* Use as $("img:below-the-fold").something() or */
        /* $("img").filter(":below-the-fold").something() which is faster */

        $.extend($.fn, {
            "below-the-fold": function (a) {
                return $.belowthefold(a, {
                    threshold: 0
                });
            },
            "above-the-top": function (a) {
                return !$.belowthefold(a, {
                    threshold: 0
                });
            },
            "right-of-screen": function (a) {
                return $.rightoffold(a, {
                    threshold: 0
                });
            },
            "left-of-screen": function (a) {
                return !$.rightoffold(a, {
                    threshold: 0
                });
            },
            "in-viewport": function (a) {
                return $.inviewport(a, {
                    threshold: 0
                });
            },
            /* Maintain BC for couple of versions. */
            "above-the-fold": function (a) {
                return !$.belowthefold(a, {
                    threshold: 0
                });
            },
            "right-of-fold": function (a) {
                return $.rightoffold(a, {
                    threshold: 0
                });
            },
            "left-of-fold": function (a) {
                return !$.rightoffold(a, {
                    threshold: 0
                });
            }
        });

    })($, window, document);

    /*
     * 模板引擎
     */

    (function () {
        // Simple JavaScript Templating
        // John Resig - http://ejohn.org/ - MIT Licensed
        var cache = {};

        dd.ui.tmpl = function tmpl(str, data) {
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
                cache[str] = cache[str] ||
                    tmpl(document.getElementById(str).innerHTML) :

                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +

                        // Introduce the data as local variables using with(){}
                        "with(obj){p.push('" +

                        // Convert the template into pure JavaScript
                        str
                            .replace(/[\r\t\n]/g, " ")
                            .split("<%").join("\t")
                            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                            .replace(/\t=(.*?)%>/g, "',$1,'")
                            .split("\t").join("');")
                            .split("%>").join("p.push('")
                            .split("\r").join("\\'") + "');}return p.join('');");

            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        };
    })();

    //AlipayJSBridge.call('hideBackButton');

})(window);
/**
 * @Descript: H5 config-各模块公共配置（数据）方法
 */
(function ($, window, dd) {
    var bridge = window.bridge;
    
    var config = dd.config;
    

    /*
     * 支付宝optionmenu 图标
    */
    config.option_menu_icon = {
        share: 'http://g.dd.alicdn.com/tps/i3/TB1xbFoFFXXXXcqaXXXWA_BHXXX-48-48.png'
    }


    /*
     * 分享配置
    */
    config.share = {
        default_img: 'http://g.dd.alicdn.com/tps/i1/TB1SsjQFpXXXXcRcXXXZ1Bf0VXX-640-600.png', //默认下载图
        jump: 'http://m.tdd.la/mjump.html?_jump=' // 分享回跳解析地址
    };


    /*
     * 透传ttid配置(alipay)
     * dd.lib.ddState() 方法里写入
     * TODO: 还有3个模块的History.replaceState有独立调用，需要整合进ddState里并统一引入ttid
    */
    (function(){
        if(bridge.self == 'Alipay') {
            config.url_track = '&ttid='+dd.lib.getUriParam(location.href, 'ttid');
        }else{
            config.url_track = '';
        }
    })();


    /*
    * 首页
    */
    config.index = {
        banner_clientVersion: '3.1.0' //和iOS banner数据一致
    };

    /*
    * 店铺
    */
    config.store = {
        FRONT_PAY_SHOP_TYPE: '12', //前支付店铺
        PAY_SHOP_TYPE_BASE: '5', //基础班店铺
        PAY_SHOP_TYPE_HIGH: '3' //高级版店铺
    }


    /*
     * 购物车
    */
    config.optioncart = {
        'diandefault': '0',  //默认新增
        'dianmod': '1',  //编辑
        'dianadd': '2'   //加菜
    };


    /*
     *
    */
    var carte = config.carte = {};
    carte.resetInorderData = function(){
        return  {
            'carte': {
            },
            'itg': {
            }
        };
    }

    /*
     * 下单相关
    */
    var order = config.order = {};
    order.service_type_base = '0'; //基础版流程
    order.service_type_advance = '1'; //高级版流程
    order.service_type_frontpay = '2'; //前支付流程(基础版快餐类店铺类型)


    /*
    * 我的订单
    */
    var my_order = config.my_order = {};
    my_order.order_is_record = '3' //订单已下单
    my_order.order_not_record = '2' //订单未下单

    my_order.type_high = '1' //高级版订单
    my_order.type_base = '5' //基础版订单

    my_order.ORDER_STATUS_WAIT_BUYER_CONFIRM = '11';
    my_order.ORDER_STATUS_WAIT_BUYER_PAY = '18';
    my_order.ORDER_STATUS_TRADE_SUCCESS = '21';
    my_order.ORDER_STATUS_TRADE_FINISH = '35';


    /*
    * 外卖
    */
    var waimai = config.waimai = {};
    waimai.tip = {};
    waimai.tip.waimai_tip_enable = '1';
    waimai.tip.waimai_tip_distance = '2000';
    //启动switcher配置
    (function(){
        lib.mtop.request({
            api: 'mtop.dd.client.switcher',
            v: '1.0',
            data: {
                'versionid':'3.0.0@ios',
                'ttid':'201200@tbmenu_iphone_3.0.0'
            },
            extParam: {}
        }, function(data) {
            var _data = data.data;
            if (_data) {
                $.each(data.data, function(k,v){
                    waimai.tip[k] = v;
                });
            }
        }, function(data) {
        });
    })();

    // 配送速度
    waimai.speed = {
        slow: '-1', //差
        soso: '0', //一般
        fast: '1' //好
    }

    //根据ServiceType获取fromType
    config.getScanFromTypeByServiceType = function(serviceType){
        var fromType;
        serviceType = serviceType.toString();
        switch (serviceType) {
            case dd.config.order.service_type_base:
                fromType = 4;
                break;
            case dd.config.order.service_type_advance:
                fromType = 2;
                break;
            case dd.config.order.service_type_frontpay:
                fromType = 4;
                break;
            default:
                fromType = 0;
                break;
        }
        return fromType;
    };


})(Zepto, window, window['dd']);
/**
 * @Descript: H5 公共业务-外卖
 */
;
(function ($, window, common) {

    common.delivery = {
        //获取外卖标
        getTags: function (params) {

            var id = params.id,
                callback = params.callback;


            lib.mtop.request({
                api: 'mtop.life.diandian.getTags',
                v: '1.0',
                data: {
                    shopId: id
                }
            }, function (data) {
                callback && callback(data.data)
            }, function (data) {
                //没有默认地址
            });
        }
    }


})(Zepto, window, dd['common']);
/**
 * @Descript: H5 公共业务-订单相关
 */
;
(function ($, window, common) {
    var bridge = window.bridge;
    var _async = false;

    var confirm_async = false;

    common.myOrder = {
        //修改
        modify: function (params) {
            if (_async) {
                return
            }
            _async = true

            dd.ui.toast.loading();

            var orderId = params.orderId,
                type = params.type;

            lib.mtop.request({
                api: 'mtop.life.diandian.myOrderDetail',
                v: '1.0',
                data: {
                    'id': orderId
                }
            }, function (data) {
                var _data = data.data;
                if (_data) {

                    var inorder_data = dd.lib.localStorage.get('inorder_data') || {},
                        storeId = _data.storeInfo.storeId;

                    if (!inorder_data[storeId]) {
                        inorder_data[storeId] = dd.config.carte.resetInorderData();
                    }

                    var carte = inorder_data[storeId]['carte'] = {};
                    //norder_data[storeId].n = {}
                    $.each(_data.items, function (k, v) {

                        v.inOrder = parseInt(v.cnt);
                        v.oriPrice = v.orgPrice;
                        v.itemPrice = v.price;
                        if (v.skuId) {
                            carte[v.itemId + '_' + v.skuId] = v
                        } else {
                            carte[v.itemId] = v
                        }
                    })

                    dd.lib.localStorage.set('inorder_data', inorder_data)

                    $('#J_carte').removeAttr('data-ddid');

                    var cls = type == 'edit' ? 'dianmod_' + orderId : 'dian'; //修改或还吃这些

                    dd.lib.ddState({
                        'push': {
                            'ddid': 'carte/' + cls + '/' + storeId,
                            'obj': {
                                'referer': 'my_order'
                            }
                        }
                    })
                    dd.ui.toast.hide();
                }
                _async = false
            }, function (data) {
                dd.ui.toast(data);
                _async = false
            });
        },

        //加菜
        add: function (param) {
            //加菜先清除对应本地存储数据
            var order_data = dd.lib.localStorage.get('inorder_data');
            delete order_data[param.storeId];
            dd.lib.localStorage.set('inorder_data', order_data);

            dd.lib.ddState({
                'push': {
                    'ddid': 'carte/' + 'dianadd_' + param.orderId + '/' + param.storeId,
                    'obj': {
                        'referer': 'my_order'
                    }
                }
            });
        },


        //基础版下单
        confirmBase: function (params, success, fail) {
            var orderId = params.orderId;

            dd.ui.toast.loading();

            lib.mtop.request({
                api: 'mtop.life.diandian.menuConfirm',
                v: '1.0',
                data: {
                    'extraId': orderId
                }
            }, function (data) {
                var _data = data.data;
                if (_data.result) {
                    success && success();
                }
                dd.ui.toast.hide();
            }, function (data) {
                fail && fail();
                dd.ui.toast(data);
            });
        },
        //高级版下单
        confirmHigh: function (params, success, fail) {
            if (_async) {
                return
            }
            _async = true;

            dd.ui.toast.loading();

            var orderId = params.orderId,
                storeId = params.storeId,
                time = params.time,
                view = params.view,
                ddid = params.ddid,
                fromType = params.fromType || 0;

            //记录之前的定位
            var prePos = {
                'preGpsx': _getPreGpsx(),//经度
                'preGpsy': _getPreGpsy()//纬度
            }

            //更新定位
            dd.lib.getH5Geo({
                'callback': function (pos) {
                    dd.ui.toast.hide();
                    _async = false;

                    //进入扫码
                    bridge.push("scan", {
                        type: 'qr'
                    }, function () {
                        var data = arguments[0];
                        var options = {
                            'from': fromType,
                            'codeUrl': data.qrCode,
                            'ddOrderId': orderId,
                            'preTime': time,
                            'gpsx': pos.longitude || 0,
                            'gpsy': pos.latitude || 0,
                            'preGpsx': prePos.preGpsx,
                            'preGpsy': prePos.preGpsy,
                            'storeId': storeId
                        }

                        _simpleScanCode(options);
                    });
                }
            });

            //记录之前的坐标
            function _getPreGpsx() {
                var geo = dd.lib.memCache.get('geo_location');
                return geo ? geo.longitude : 0
            }

            //记录之前的坐标
            function _getPreGpsy() {
                var geo = dd.lib.memCache.get('geo_location');
                return geo ? geo.latitude : 0
            }

            function _simpleScanCode(options) {
                dd.ui.toast.loading();
                _async = true;

                //return;
                lib.mtop.request({
                    api: 'mtop.life.diandian.simpleScanCode',
                    v: '1.0',
                    data: {
                        'from': options.from,
                        'codeUrl': options.codeUrl,
                        'ddOrderId': options.ddOrderId
                    }
                }, function (data) {
                    var _data = data.data;
                    if (_data.needLogin == '1') {
                        _ecodeScanCode(options);
                        _checkScanCode(options);
                    }
                }, function (data) {
                    dd.ui.toast(data);
                    _async = false;
                    fail && fail();
                });
            }


            function _ecodeScanCode(options) {
                lib.mtop.request({
                    api: 'mtop.life.diandian.ecodeScanCode',
                    v: '1.0',
                    data: {
                        'from': options.from,
                        'codeUrl': options.codeUrl,
                        'ddOrderId': options.ddOrderId,
                        'gpsX': options.gpsx,
                        'gpsY': options.gpsy
                    }
                }, function (data) {
                    var _data = data.data;
                    dd.ui.toast.hide();

                    var code = _data.data.code;
                    if (_data.type == 'diancai-verify' || _data.type == 'reserve') {
                        
                        if (code == '2000') {
                            //成功
                            if (_data.data.soleOutItems) {
                                //部分沽清
                                var titleArray = [];
                                $.each(_data.data.soleOutItems, function (k, v) {
                                    titleArray.push(v.title);
                                });
                                alert('下单成功，以下菜品已沽清\n' + titleArray.join('，'));

                                if (_data.type == 'reserve') {
                                    //预定点菜
                                    _pushReserveDetail(_data.data.reserveOrderId)
                                } else {
                                    _myOrderHandler();
                                }
                                $('#J_my_order').removeAttr('data-ddid');

                            } else {
                                if (_data.type == 'reserve') {
                                    //预定点菜
                                    _pushReserveDetail(_data.data.reserveOrderId)
                                } else {
                                    //
                                    _myOrderHandler();
                                }
                                $('#J_my_order').removeAttr('data-ddid');
                            }

                        } else if (code == '-2005') {
                            //全部沽清 重新点菜
                            alert(_data.data.message);
                            dd.lib.ddState({
                                'push': {
                                    'ddid': 'carte/dian/' + options.storeId,
                                    'obj': {
                                        'referer': 'my_order'
                                    }
                                }
                            })
                            dd.lib.ddState(state_obj);

                        } else {
                            dd.ui.toast(_data.data.message || '发生了一些错误，请稍后再试');
                        }

                        function _myOrderHandler() {
                            dd.lib.memCache.set('confirmType', 3);
                            if (ddid == 'my_order') {
                                _pushOrderDetail();
                            } else if (ddid == 'my_order_details') {
                                //刷新
                                view.initHandler();
                            }
                        }

                        function _pushOrderDetail() {
                            var state_obj = {
                                'push': {
                                    'ddid': 'my_order_details/' + options.ddOrderId,
                                    'obj': {
                                        'referer': 'my_order'
                                    }
                                }
                            };
                            dd.lib.ddState(state_obj);
                        }

                        function _pushReserveDetail(id) {
                            var state_obj = {
                                'push': {
                                    'ddid': 'my_reserve_details/' + id,
                                    'obj': {
                                        'referer': 'my_order'
                                    }
                                }
                            };
                            dd.lib.ddState(state_obj);
                        }
                    } else if(_data.type == 'pay'){
                        //扫码支付
                        if (code == '3000') {
                            dd.lib.memCache.set('pay_detail', _data.data.orderRespDTO);
                            var state_obj = {
                                'push': {
                                    'ddid': 'pay_detail/' + options.storeId,
                                    'obj': {
                                        'referer': 'my_order'
                                    }
                                }
                            };
                            dd.lib.ddState(state_obj);
                        } else {
                            dd.ui.toast(_data.data.message || '发生了一些错误，请稍后再试');
                        }
                    } else {
                        dd.ui.toast('仅限扫码下单');
                    }

                    _async = false;
                    success && success();
                }, function (data) {
                    dd.ui.toast(data);
                    _async = false;
                    fail && fail();
                });
            }

            function _checkScanCode(options) {
                lib.mtop.request({
                    api: 'mtop.life.diandian.checkScanCode',
                    v: '1.0',
                    data: {
                        'gpsx': options.gpsx,
                        'gpsy': options.gpsy,
                        'preGpsy': options.preGpsy,
                        'preGpsx': options.preGpsx,
                        'preTime': options.preTime,
                        'time': Date.now(),
                        'ddOrderId': options.ddOrderId
                    }
                }, function (data) {
                }, function (data) {
                });
            }

        }
    }


})(Zepto, window, dd['common']);
/**
 * @Descript: H5 公共业务-优惠券使用相关
 */
;
(function ($, window, common) {
    common.useEvoucher = {
        //多店铺优惠券使用
        evoucherUse: function(localstores, geo_location) {
            var _this = this;

            //多店铺
            var content_arr = [];

            var d_arr = [], //距离数组
                li_obj = {}; //模板对象

            $.each(localstores, function(k, v) {
                var d = _this._getDistance({
                    'longitude': v.longitude,
                    'latitude': v.latitude
                }, geo_location);

                d_arr.push(d || k);

                var dtext;

                //距离文案
                if (d > 1000) {
                    dtext = d / 1000 > 100 ? '>100千米' : dd.lib.num2Fixed(d / 1000, 1) + '千米'
                } else if (d == 0) {
                    dtext = '';
                } else {
                    dtext = parseInt(d) + '米';
                }

                var li = '<li class="J_pop_store_item" data-storeid="' + v.localstoreId + '"><div class="shop_name"><span>' + dtext + '</span>' + v.localstoreName + '</div><div class="shop_address">' + v.address + '</div></li>';

                li_obj[d || k] = li;
            });

            //距离排序
            d_arr.sort();

            //根据排序组装模板顺序
            $.each(d_arr, function(k, v) {
                content_arr.push(li_obj[v]);
            });

            return content_arr.join('');
        },

        //经纬对比距离算法
        _getDistance: function(point, geo_location) {
            //目标位置
            var x1 = parseFloat(point.longitude); //longitude
            var y1 = parseFloat(point.latitude); //latitude

            //定位位置
            var x2 = parseFloat(geo_location.longitude) || 0;
            var y2 = parseFloat(geo_location.latitude) || 0;
            /*var x2 = 120.02327728271484;
             var y2 = 30.279453277587891;//geo_location.latitude,*/

            if (x1 == 0 || y1 == 0 || x2 == 0 || y2 == 0) {
                return 0;
            } else {
                return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) * 100000;
            }
        }
    }
})(Zepto, window, dd['common']);
/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.11
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
	'use strict';
	var oldOnClick, self = this;


	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
	this.touchBoundary = 10;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	if (!layer || !layer.nodeType) {
		throw new TypeError('Layer must be a document node');
	}

	/** @type function() */
	this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

	/** @type function() */
	this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

	/** @type function() */
	this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

	/** @type function() */
	this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

	/** @type function() */
	this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

	/** @type function() */
	this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

	if (FastClick.notNeeded(layer)) {
		return;
	}

	// Set up event handlers as required
	if (this.deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchmove', this.onTouchMove, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {

	// Don't send a synthetic click to disabled inputs (issue #62)
	case 'button':
	case 'select':
	case 'textarea':
		if (target.disabled) {
			return true;
		}

		break;
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
			return true;
		}

		break;
	case 'label':
	case 'video':
		return true;
	}

	return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
		return true;
	case 'select':
		return !this.deviceIsAndroid;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled && !target.readOnly;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
	'use strict';

	//Issue #159: Android Chrome Select Box does not open with a synthetic click event
	if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
		return 'mousedown';
	}

	return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	// Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
	if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
	if (event.targetTouches.length > 1) {
		return true;
	}

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (this.deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!this.deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			if (touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}

			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0], boundary = this.touchBoundary;

	if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
		return true;
	}

	return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
	'use strict';
	if (!this.trackingClick) {
		return true;
	}

	// If the touch has moved, cancel the click tracking
	if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		this.cancelNextClick = true;
		return true;
	}

	// Reset to prevent wrong click cancel on input (issue #156).
	this.cancelNextClick = false;

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (this.deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];

		// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
		targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (this.deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		if (!this.deviceIsIOS4 || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (this.deviceIsIOS && !this.deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		this.sendClick(targetElement, event);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (this.deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchmove', this.onTouchMove, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
	'use strict';
	var metaViewport;
	var chromeVersion;

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return true;
	}

	// Chrome version - zero for other browsers
	chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

	if (chromeVersion) {

		if (FastClick.prototype.deviceIsAndroid) {
			metaViewport = document.querySelector('meta[name=viewport]');
			
			if (metaViewport) {
				// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
				if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
					return true;
				}
				// Chrome 32 and above with width=device-width or less don't need FastClick
				if (chromeVersion > 31 && window.innerWidth <= window.screen.width) {
					return true;
				}
			}

		// Chrome desktop doesn't need FastClick (issue #15)
		} else {
			return true;
		}
	}

	// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
	if (layer.style.msTouchAction === 'none') {
		return true;
	}

	return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
	'use strict';
	return new FastClick(layer);
};


if (typeof define !== 'undefined' && define.amd) {

	// AMD. Register as an anonymous module.
	define(function() {
		'use strict';
		return FastClick;
	});
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = FastClick.attach;
	module.exports.FastClick = FastClick;
} else {
	window.FastClick = FastClick;
}
/**
 * http://gitlab.alibaba-inc.com/mtb/lib-login/tree/publish/1.1.2
 * 因为FastClick冲突 http://gitlab.alibaba-inc.com/dd/tdd/issues/5
 * _simulateJump和_isAndroidLowVersion的逻辑来自lib-login0.2.9版本
*/

;(function(win, lib, undef){
    var doc = win.document;
    var ua = win.navigator.userAgent;
    var hostname = location.hostname;
    var search = win.location.search;
    var login = lib.login = lib.login || {};

    var HOST_REGEXP = /.*?([^.]+)(?:\.x)?\.(taobao|tmall|etao|alibaba|alipay|aliyun)\.(com|net).*/i;
    var SUB_DOMAIN = (function(){
        var type = hostname.indexOf('x.taobao.net') > 0?'waptest':'m';
        var host = hostname.match(HOST_REGEXP);
        if (host && (host[1] === 'waptest' || host[1] === 'wapa' || host[1] === 'm')) {
            type = host[1];
        }
        return type;
    })();

    login.config = {
        name: 'login.htm',
        mainDomain: 'taobao.com',
        subDomain: SUB_DOMAIN
    }

    function readCookie(name) {
        var matched = new RegExp('(?:^|;\\s*)' + name + '\\=([^;]+)(?:;\\s*|$)').exec(doc.cookie);
        if (matched) {
            return matched[1];
        } else {
            return undef;
        }
    }

    function inApp() {
        return ua.indexOf('AliApp') > 0 ||
            ua.match(/ttid\=[^@]+@[^_]+_[^_]+_[\d\.]+/) ||
            search.match(/ttid\=[^@]+@[^_]+_[^_]+_[\d\.]+/) ||
            ua.indexOf('WindVane') > 0;
    }

    function redirect(redirectUrl, replace) {
        var loginUrl = 'http://' +
            ['login', login.config.subDomain, login.config.mainDomain].join('.') +
            '/' + login.config.name + '?tpl_redirect_url=' + encodeURIComponent(redirectUrl || location.href);

        if (inApp()) {
            if (/Android/.test(ua) && _isAndroidLowVersion()) {
                _simulateJump(loginUrl);
                return;
            }
            location.href = loginUrl;
        } else {
            if (replace) {
                location.replace(loginUrl);
            } else {
                location.href = loginUrl;
            }
        }
    }

    function _simulateJump(loginUrl) {
        var elA = doc.createElement('a');
        var evClick = doc.createEvent('HTMLEvents');

        elA.style.display = 'none';
        elA.href = loginUrl;
        doc.body.appendChild(elA);

        evClick.initEvent('click', false, true);
        elA.dispatchEvent(evClick);
    }

    function _isAndroidLowVersion(){
        if(('' + ua).indexOf('Android 2.3') > -1){
            return true;
        }
        if(('' + ua).indexOf('Android 4.4') > -1){
            return true;
        }
        return false;
        
    };

    login.isLogin = function(callback) {
        if (callback && lib.mtop) {
            lib.mtop.request({
                api: 'mtop.user.getUserSimple',
                v: '1.0',
                data : {'isSec' : 0}
            }, function(json) {
                if (json.retType === lib.mtop.RESPONSE_TYPE.SUCCESS) {
                    callback(true, json);
                } else {
                    callback(undef);
                }
            }, function(json) {
                if (json.retType === lib.mtop.RESPONSE_TYPE.SESSION_EXPIRED) {
                    callback(false);
                } else {
                    callback(undef);
                }
            });
        } else {
            // 判断imewweoriw是老的逻辑，不再做兼容
            //var imeval = readCookie('imewweoriw') || '';
            var nick = this.getUserNick();
            // 新的逻辑，就针对昵称的cookie字典来判断
            return !!nick
        }
    }

    login.getUserNick = function() {
        var nick = '';
        var wapnick = readCookie('_w_tb_nick');
        var tbnick = readCookie('_nk_') || readCookie('snk');
        if (wapnick && wapnick.length > 0 && wapnick != 'null') {
            nick = decodeURIComponent(wapnick); // 中文会encode，需要decode
        } else if (tbnick && tbnick.length > 0 && tbnick != 'null'){
            nick = unescape(unescape(tbnick).replace(/\\u/g, '%u'));
        }
        return nick;
    }

    login.goLogin = function(options) {
        options = options || {};
        options.targetUrl = options.targetUrl || options.redirectUrl || options.rediUrl;

        if (!inApp() && options.widget === true && this.widget) {
            this.widget.showLogin(options);
        } else {
            redirect(options.targetUrl, !inApp() && options.replace);
        }
    }

    login.getNickFromCookie = login.getUserNick;
})(window, window['lib'] || (window['lib'] = {}));
/**
 * @author 不台(butai@taobao.com)
 * @since 2013.5.3
 * @module  login/h5_login
 * @description
 *
 * #背景
 * 目前H5上的登录都是跳转页面的形式，这样存在两个问题：
 * 1、用户体验不好
 * 2、由于WebAPP的一些操作是通过hash的，这样登录后对hash的处理比较难弄
 *
 * #设计思路
 * 1、采用弹出层的形式，登录的bar有父页面控制
 * 2、通过iframe嵌入现有的登录页面
 *
 * ##优点
 * 1、提升用户体验
 * 2、保持登录的一致性、安全性
 *
 * ##缺点
 * 1、兼容性的挑战
 *
 *
 * #主要API
 * 1、 window.lib.login.widget.showLogin(op)
 * op 参数格式：{hideType:'close/reload/changeHash/redirect',targetUrl:'hash/url'}
 * 该参数在隐藏登录浮层时，根据这些参数來处理隐藏后的操作
 * hideType：close - 不做任何操作
 * reload - 执行window.location.reload()
 * changeHash - 执行window.location.hash=targetUrl
 * redirect - 执行window.location.href=url
 *
 * 2、隐藏登录浮层
 *  window.lib.login.widget.hideLogin(refresh)
 * refresh 参数用于判断是否直接关闭，还是关闭后处理相应操作，具体操作根据showlogin的参数决定
 *
 * 3、刷新登录浮层
 *  window.lib.login.widget.reloadIframe()
 *  用于刷新加载的登录页面
 *
 *
 */
;(function (win, lib) {
    lib.login = lib.login || {};

    var i = false;
    var isInit = false;
    var loginUrl = '';
    var hideType = 'close';
    var targetUrl = '';

    //登录模板
    var C_Login = '#J_M_login{position:fixed;width:100%;height:100%;top:0;z-index:99999;background-color:#eee;display:none}#J_header{z-index:99999;background:-webkit-gradient(linear,0 0,0 100%,from(#f8f8f8),to(#e6e6e6));top:0;height:50px;width:100%;position:absolute;-webkit-box-shadow:0 1px 1px 0 #c4c4c4;display:-webkit-box}#J_header section:nth-child(2){text-align:center;-webkit-box-flex:1}#J_header section:nth-child(2) .title{padding-top:15px;text-overflow:ellipsis;height:32px;font-size:18px;font-weight:bold}#J_header .back{margin-top:10px;width:72px;height:30px;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAA8CAYAAACJmDMtAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDkvMjgvMTLDJIlRAAAGXUlEQVR4nO2db0xTZxTGn/u+belaUEwWK8XEjVBm3YwLOgyWLTNuWbbMqczEqcsgIybonERwmxJZNIvAiG7DYJYskT8mtBvihGRLXLJl2acRxQ+CE9QtEmMIhWIyQYTS3ncfbm+tjD9taZXS80tumjTQ9yb3yTnPOffe80pCCESLNWvWSAAkACzgIGIH4Tu8AOT29vb/iUVavXp1NBZWhcMBaAMOje97IjaQAXgAjANw+z5lKKICoFzQSKMKRwcgITc317Rz5873U1JS3tXpdMujsB4RRYaGhn7r6+v7Zfv27Q0ARgCMQRGVACIfgRgUUeq3bt2akpeX95HJZMpnjCVFchHi8eN2u7urqqpyW1pa7gAYhU9E3Gw2R2oNBiXqGCorK7O3bdvWsHDhwrckSUqI1ALEk4Nz/nROTs4HLperqbu7+z4UXyQiFYFU8RgdDseHaWlpnzPGEiPxw8Tcwu12X7fZbK8AuAdgLBJVkV88dru9ID09vYrEM3/R6XTPORyOPCjXnM3WRDMo1ZWhsbGxwGKxfBnNtgAxNzCZTO8BqAMwOpsIJEExzIaTJ0++kZGRQeKJE5KSkjKhVNpSuBFILdX1FRUVa7Oysr6TZTliJ0jEBAyAFG4EYgAStmzZYrbZbNWSJJHniVPCEZDf9xQWFlbo9fqMCJ8TEUOEmsL8qau2tjY3OTl5M6Wu+CbUCMQAJGzcuNG8YsWK42SaiVAE5O/3lJSU1JPvIYDgU5hasj919uzZfXq9/iVKXfGLJD18oCLYCMQB6MvLy9cuXbp0H6UuQiWYCORPXevWrfsGQCIJKL4JvP4zRSAJvpK9paWlNCEhIYPEQwQynYBU36Ovrq5+fcmSJXtJPMREpkthDIBu06ZN5szMzBOyLIMERExkqgjk7zbv2bOnnHOeQuIhJmMyAfm7zadPn85dsGDBZhIPMRWTpTB/t9lqtR6n1EVMZLoqzF+yFxcX1wshqGQnpiUwAvm7zU1NTft0Oh11m4lJmSoCcQD6Y8eOrTWbzdRtJoKCBXxSt5kIGfVVYy0Aw/nz50u1Wm0GpS4iWNSBB7qampoNixcv3kviIUKBwWeeV61a9TWJhwgVtQoTQ0NDg0lJSdRxJmZkYhUmAxg/ePDgp0KIkcCHhQhiJtThCsLpdLoSExOHV65c+ZoQgrrPxJQwxlBbW3sCvjdTBZRRHcM1NTWOy5cv1zJGg8SI4FCVIgCMCyH69+/f/5XL5bpIIiKCIXA+kAAghBDD3d3df69fv/5lrVabTKmMmAjn/JEUFogMYOzKlSuX7HZ7JZlqYiYmCkidyHn/zJkzP7W1tX3HOQeJiJiKyZ4HEgA8QojBQ4cOfdvQ0JC+bNmyt6nJSKgE81aGDMVU38nPzz8yOjraQ6aamIyZhmwKIcS9wcHBOzk5OW8KIbRkqgnOOerq6iY10YGofmj0woULvzY3N3+h0WjIDxGPMFNeEgC8Qoh/T5069X1XV9cPnPPHcV5EjBDMq82qH3Lu3r27orm5+dlFixZleb3eaJ8bMUcJ5dVmFRmAW5blf44ePVrm9XoHyFQTQGjzgdQmY3t9ff0R8kMEENqIO/9N18bGxlar1brcZrN97PF46M59nBFOCvP/L3xNxsOHD9f09fX9TqY6vglnTrS/ybhjx47PWltb6wwGw/NkquOTcJ2waqq7SktLP3G73dSpjlPCver+JmNnZ2fbgQMHihhjIySi+MBXPMmIwH5hAoBnYGDA6fF4+jIzM18FQLc75jGMMQwPD//lcDjqAIzNdrcef2Vmt9t/BICCgoIqAAa6ez8/4Zzj5s2bP0PZQ9UbqR0LBYCxq1ev9vT29l7Pysp6UavVJkfih4m5A+ccbre7Jz8/v0QIcReAJ5ICkgGM3bp163ZHR0dndnZ2utFoTKU3POYHnHNwzkeKi4sLnE5nB5TNd+VI7pkKKEJy9/f39547d+6SxWJ5kJqamqbRaIwASEgxhiRJYIxBo9FgfHy8p6ioqPDatWt/AHgApYiKyr7xEnwzFhljZqvV+sKuXbvesVgsG4xG4zMkothBkiS4XK6LN27c+LOsrKzZ6/V2Qtn6O2rbfgfC4Js5JEmSyXcYoQiMiA1kIcRdIcSgEKIPwDh85bv6B7OtwqZd3LfQfSFEjxDiNsLvOxFPBoGHPb9HhKPyH1fdgjvw0l6mAAAAAElFTkSuQmCC) no-repeat 0 0;background-size:contain;border:0;font-size:12px;overflow:hidden;display:inline-block}.fn_btns{display:inline-block;line-height:28px;padding:0 20px 0 0;vertical-align:top;height:100%}#J_header .rebtn{width:30px;margin-top:10px;min-width:28px;height:30px;font-size:14px;line-height:120%;color:#212121;text-shadow:0 1px 0 white;background-image:-webkit-linear-gradient(-90deg,#fcfcfc 0,#ededed 100%);background-image:linear-gradient(-90deg,#fcfcfc 0,#ededed 100%);background-image:-ms-linear-gradient(-90deg,#fcfcfc 0,#ededed 100%);background-image:-webkit-gradient(linear,50% 0,50% 100%,color-stop(0,#fcfcfc),color-stop(1,#ededed));-webkit-border-radius:4px;border-radius:4px;border:0;-webkit-box-shadow:0 0 1px rgba(0,0,0,0.8),0px 0 0 rgba(255,255,255,0.65),inset 0 0 0 rgba(255,255,255,0.65);box-shadow:0 0 1px rgba(0,0,0,0.8),0px 0 0 rgba(255,255,255,0.65),inset 0 0 0 rgba(255,255,255,0.65)}#J_header .rebtn div{height:30px;background-repeat:no-repeat;background-size:16px 17px;background-position:center;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAiCAYAAAA+stv/AAAFRElEQVRYCa1Xu0trTRDfG4KIiHp8IT5Qj08QFM0HKiqIJoUPBMFoo20uVqJN/BNio1gasFKrlGoVsbKxUNBCfCWIj0pJwDci+s1v75lzz8lbrwOT3bM7u/PbmdnZya/Pz0+RClVXVyt5eXm2wsJCl9VqVYjtxnXv7+9bxOGHh4et6+tr3/n5edg4H6//KxmAmpoatb6+3p2Wlua0WCwKsQDHoo+PDzkMIG9vb77j4+O5s7OzYCxZHosLACeurKx05ebmeiDMirnlMbSsGC0zjz8+Ps6dnJzMxbNITABNTU02ArBEymxkagFmxWiZME6n5U/ZMgC0mNPaPQLw++DgYI+FaX+V+uEoAFBeW1vrp83hZ105FuI7FWJQDALfxOHT01MHQHR3d7sonjzkpi0TAFZO/taVRypWFEW0tLSI0tJSQe6ReEKhkKDAE/v7+yIc/ht7DEQDIEE8Pz/7MjMzXWwZHQB8TgD86enputmNJy4rKxMjIyOCAjKhESjwxObmpqDT6nIMAErB7EbsrwPo6+vz5OTkINqlqY3KBwYGxNDQEG+IqPYRo+UIV6iPawmGb8XOzo5YXl4W2A/E1gAAJoxJAHV1dSqZNRBL+cTEhOjs7MQaBNAs8RY+EhBAuIntALGysmIShVIcjq0iQ5qCLu7JNeVQ/B9xMuVQBhkH8ezR0RG+TWS0LFxhhe+bm5uRZEyCJSUlbPbfNOE1TSb50OLJmZWVJf1tVMpLMfb6+ios5eXlTgo8meGMgqOjo5CdI/6ScixCAkMwo5+MLBkZGXZikxyuGkU7+9w0l8qH3+/3Tk5Oip6eHlFQUBB3CYEUVlVVnff393q0QrqhoQEN/P5dciF2tPgRt7e34vLyUgQCAXk9r66uZBBSQhJWJBG+KtCG6MzOzkY3lYCDXCyC63BF4QYnWUGFJWy2KK+EKfbMwYfdOMOh/w+EXAErVmmMoAIw/T2gvjdmcoe5fpg4aQGUiaQFjNGPTLW2tgakP06UUT1jY2OfTqczhMwLBZaqKljITBQTUc4yS3z9y+FwuOkRcsPldGCFcoS7tbXVbqESS8/T2BYCFRUVSKc/SqTQhWBnhtXz8/PtlqKioihFd3d3oqur68dAdHR0INeoUGpkOqxioVfOa3yhgAZWIMtIH0Wh+8YA7eWGYs38EgT66+vrYdzBvfb2dn1bFiTENgSNPvHNDnxP5pfWxN5Mms4gAPiGh4cFlUc8J5ECIQKlt7fXpU98sYO15Oc/0U77MSHZQSeRD6NhylJebUDKsBXQkvmW+MrIyRR/cHKsxR7MvJSA4Y3AI6cXpSqVz4H5+Xlxc3PDctIqXDiQhfao7pvd3d1NmKJxtYqLi9300NhZMSIf++Abz/zMzIygK4n7H9RLMvrwXFxcuBcWFuQ7DRRYhABlEFo/SO+47+npKfjy8iJLMtpMRcyQIihVI4MNikF4/aanp3HNkejkY2cEgLrOTyBsi4uLgqpXrJGE+IByBoNB9COJFXPLiiGHJ39qagrK8RagYpLlsxEA5JABAUJZXV0VeDaZ2BoMhMe5hVIQWgbAZkdFPT4+DuVQCuX6gxQJAHtIEBQTyvb2tiyxMciETROR8dSQQ8D19/fD51HKMR8LAMYBYgktiomNjQ1xeHhocguEQHzKP19/f9va2sTg4CBXRDgxakv95CwZDwDmERPIAfIek0UE/cmUQFDEGP94QJgqa1lHUIkvGhsbcWIMgxBwYOlzDJgIf8+TsErzS8Qh4q8Q1mBtwv0TWcAElD4i//1EPlbID7iWMDMKj9gnpgkj/Q/RNMlKirb91wAAAABJRU5ErkJggg==)}#J_header section:nth-child(1) a{color:#666;display:inline-block;text-align:center;padding-left:10px;width:62px;height:30px;line-height:30px;text-decoration:none}#J_load span{display:inline-block;width:30px;height:12px;line-height:12px;background:url(http://a.tbcdn.cn/mw/base/styles/component/more/images/loading.gif) 0 0 no-repeat;-webkit-background-size:30px 12px}';
    var T_login = '<div id="J_M_login"><div id="J_header"><section><a href="javascript:window.lib.login.widget.hideLogin()"><div class="back">返回</div></a></section><section><div class="title">淘宝会员登录</div></section><section><div class="fn_btns"><a href="javascript:window.lib.login.widget.reloadIframe()"><div class="rebtn"><div class=" "></div></div></a></div></section></div><div id="J_load" style="position: absolute; text-align: center; top: 80px; left: 50%; height: 40px; width: 160px; margin-left: -80px; "><span></span></div><div id="J_login_frame" style="height: 400px; display: none"><iframe id="J_M_frame" frameborder="0" scrolling="no" width="100%" height="100%"></iframe></div></div>';

    //初始化Login 组件
    lib.login.widget = {
        /**
         * 初始化
         */
        init: function (op) {
            op = op || {};
            hideType = op.hideType || 'close';
            targetUrl = op.targetUrl;

            if (isInit) return;
            isInit = true;
            //初始化domain为一级域名
            try {
                var host = location.host;
                var paths = host.split('.');
                var postfix = paths.pop();
                var domain1 = paths.pop();
                var domain2 = paths.pop();  //环境域名
                document.domain = domain1 + '.' + postfix;
                loginUrl = 'http://login.' + domain2 + '.' + document.domain + '/login.htm?v=0&ttid=h5@iframe';
            } catch (e) {
                console.error(e);
            }

            //初始login模块
            if ($('#J_M_login').length < 1) {
                $('body').append('<style>' + C_Login + '</style>' + T_login);
            }
            $('#J_M_frame')[0].onload = function () {
                //只处理正常的url加载
                if (!$('#J_M_frame').attr('src')) return;
                $('#J_load').css('display', 'none');
                $('#J_login_frame').css('display', 'block');
            };
        },
        /**
         * 刷新登录页面
         *
         */
        reloadIframe: function () {
            $('#J_M_frame').attr('src', loginUrl);
            $('#J_login_frame').css('display', 'none');
            setTimeout(function () {
                if ($('#J_login_frame').css('display') == 'none') {
                    $('#J_load').css('display', 'block');
                }
            }, 300);
        },

        /**
         * 隐藏登录浮层
         * @param refresh
         *
         * refresh 参数用于隐藏后是否操作父页面
         *
         */
        hideLogin: function (refresh) {
            $('body div').eq(0).css('visibility', 'visible');
            $('#J_M_login').animate({
                'translateY': '100%'
            }, 300, 'ease-in', function () {
                $('#J_M_login').css('display', 'none');
                $('#J_load').css('display', 'none');
                $('#J_M_login').css('-webkit-transform', '');
                if (refresh) {
                    if (hideType === 'reload') {
                        window.location.reload();
                    }
                    else if (hideType === 'changeHash' && targetUrl) {
                        window.location.hash = targetUrl
                    }
                    else if (hideType === 'redirect' && targetUrl) {
                        window.location.href = targetUrl;
                    }
                    else if (hideType && hideType.succ) {
                        hideType.succ.call();
                    }
                } else {
                    hideType && hideType.fail && hideType.fail.call();
                }
            })
        },
        /**
         * 弹出登录浮层
         * @param op
         * op 参数格式：{hideType:'close/reload/changeHash/redirect',targetUrl:'hash/url'}
         * 该参数在隐藏登录浮层时，根据这些参数來处理隐藏后的操作
         * hideType：close - 不做任何操作
         * reload - 执行window.location.reload()
         * changeHash - 执行window.location.hash=targetUrl
         * redirect - 执行window.location.href=url
         */
        showLogin: function (op) {
            this.init(op);

            $('#J_M_frame').attr('src', loginUrl);
            $('#J_M_login').css('-webkit-transform', 'translateY(100%)');
            $('#J_M_login').css('display', 'block');
            setTimeout(function () {
                if ($('#J_login_frame').css('display') == 'none') {
                    $('#J_load').css('display', 'block');
                }
            }, 1000);
            setTimeout(function () {
                $('#J_M_login').animate({
                    'translateY': '0'
                }, 400, 'ease-out', function () {
                    $('#J_M_login').css('display') == 'block' && $('body div').eq(0).css('visibility', 'hidden');
                    //fix ios bug
                    i ? $('#J_M_login').css({'height': '100%'}) : $('#J_M_login').css({'height': '101%'});
                    i = !i;
                    $('#J_M_login').css('-webkit-transform', '');
                });
            }, 100);

        }
    };

    window.H5_M = window.H5_M || {};
    window.H5_M.Login = {
        hideLogin : lib.login.widget.hideLogin
    };
})(window, window['lib'] || (window['lib'] = {}));
/**
 * @Descript: H5页面切换 pushState(History.js)
 */
;
(function ($, window, dd) {
    var doc = window.document,
        bridge = window.bridge,
        body = doc.body;

    var defaults = {
        'defaultPage': undefined,
        'dataPage': undefined
    };

    function StatePage(options) {
        this.config = options;
        this.interval = dd.ui.appinterval;
        this.indexpage = undefined;
        this.state_history = undefined;
        this.uname = '_ddid'; //url传参名
    }

    var History = window.History;// Note: We are using a capital H instead of a lower h

    StatePage.prototype = {
        init: function () {
            var _this = this;
            _this.st = 0;
            _this.swipeid = undefined;
            _this.swipe_page = undefined;
            //_this.state_history = location.hash.replace(/^#/, ''),
            _this.state_history = _this.state_now = dd.lib.getUriParam(location.href, this.uname);
            //_this.historyuri = dd.lib.getUrlString(this.uname),
            //_this.state_now = '';

            _this.appMod = undefined;
            _this.isInit = false;
            $('#J_page').on(dd.event.click, '.J_swipe_page', function () {
                //重复点击
                if ($(this).attr('data-swipeid') == _this.state_now) {
                    return;
                }
                _this._swipeClick(this);
            });

            var State = History.getState();

            History.log('initial:', State.data, State.title, State.url);
            this._initPage('onload');

            //监听state
            History.Adapter.bind(window, 'statechange', function () {
                // Note: We are using statechange instead of popstate
                // Log the State
                var State = History.getState(); // Note: We are using History.getState() instead of event.state
                History.log('statechange:', State.data, State.title, State.url);

                body.addEventListener('click', dd.lib.preventAllClick, true);
                _this._stateListener();
            });
            _this._backListener();
        },
        _backListener: function (url) {
            var _this = this;
            var back_timer;
            doc.addEventListener('back', function (e) {
                e.preventDefault();
                var State = History.getState(), url = State.url;
                back_timer && clearTimeout(back_timer);
                back_timer = setTimeout(function () {
                    try {
                        if (_this.modInView) {
                            var back_el = _this.modInView.wrap.find('.hd_back, .bottom_back, #J_search_cancl');

                            if (back_el[0].id == 'J_close_webview' || dd.lib.getUriParam(url, "close")) {
                                //首页或者返回活动页面
                                bridge.push("closeWebview");
                            } else {
                                dd.navi.back = true;
                                dd.lib.ddState({
                                    back: {
                                        'ddid': back_el.data('alt'),
                                        'multi': back_el.data('multi')
                                    }
                                })
                            }
                        } else {
                            bridge.push("closeWebview");
                        }
                    } catch (e) {
                        bridge.push("closeWebview");
                    }

                }, 50);

            }, false);
        },
        //点击切换新页面
        _swipeClick: function (el) {
            var _this = this,
                dataPage = _this.config.dataPage;

            _this.swipeid = $(el).attr('data-swipeid');
            var role = $(el).data('role'),
                alt = $(el).data('alt'),
                multi = $(el).data('multi');

            if (role == 'back') {
                dd.navi.back = true;
                dd.lib.ddState({
                    back: {
                        'ddid': alt,
                        'multi': multi
                    }
                })
                return;
            }

            _this.referer = $(el).data('referer');
            _this.forward = $(el).attr('data-forward');


            dd.lib.ddState({
                'push': {
                    'ddid': _this.swipeid,
                    'obj': {
                        'referer': $(el).data('referer')
                    }
                }
            })
        },
        //初始化页面
        _initPage: function (from) {
            var _this = this;
            var State = History.getState();

            var ddid = dd.lib.getUriParam(State.url, this.uname) || 'index';

            var ddid_cls = ddid.split('/')[0];
            dd.navi.alias[ddid_cls] && (ddid = ddid.replace(ddid_cls, dd.navi.alias[ddid_cls]));

            var _hash = ddid.split('/');

            var page_name = _hash[0];
            var args = _hash.slice(1);

            if (!this.config.dataPage[page_name]) {
                page_name = this.config.defaultPage;
            }

            var pageEl = $('#J_' + page_name);

            var appMod = _this.appMod = this.config.dataPage[page_name];

            if (from == 'onload') {
                pageEl.removeClass('hide');
                var clen = dd.crumbs.length;

                //不在crumbs记录里 初始化
                if (!clen || dd.crumbs[clen - 1] !== ddid) {
                    dd.crumbs = [ddid];
                    dd.lib.localStorage.set('crumbs', dd.crumbs);
                }
            }

            appMod._view = appMod._view || appMod.view();

            //页面（异步）渲染, 修改startUp, 触发setOnPageStartup
            /*var startUp = appMod._view.startUp;
             if(startUp) {
             appMod._view.startUp = function(){
             startUp.apply(appMod._view, arguments);

             setTimeout(function(){
             appMod._view.wrap.trigger('setOnPageStartup');
             },0)
             }
             }*/

            //模块初始化
            setTimeout(function () {
                appMod._view.init.apply(appMod._view, args);
            }, 0)


            //事件绑定
            _this._bindEvents();
            //optionMenu event
            pageEl.attr('data-ddid', _hash[0] ? _hash.join('/') : this.config.defaultPage);

            _this.modInView = appMod._view;

            //页面load时触发，对应的app要在init之后绑定
            if (from == 'onload') {
                //pageEl.show();

                //隐藏活动打开H5后的返回按钮
                var urlclose = dd.lib.getUriParam(History.getState().url, 'close'); //url 标识
                if (urlclose) {
                    _this.modInView.hideBack = true;

                    //依赖 _iScrollInit 或 _scrollInit 定义执行
                    if (_this.modInView._iScrollInit || _this.modInView._scrollInit) {

                        //注入方法
                        var __iScrollInit = _this.modInView._iScrollInit || _this.modInView._scrollInit;
                        _this.modInView._iScrollInit = _this.modInView._scrollInit = function () {
                            __iScrollInit.apply(_this.modInView, arguments);

                            if (_this.modInView.hideBack) {
                                _this.modInView.wrap.find('.hd_back').hide();
                            }

                        }

                    }
                }


                pageEl.removeClass('xr')
                _this.modInView.setBeforePageIn && _this.modInView.setBeforePageIn(ddid);

                setTimeout(function () {
                    _this.modInView.setAfterPageIn && _this.modInView.setAfterPageIn(ddid);
                }, 0)

            }
            if (dd._hideTitleBar && !_this.isInit) {
                _this.isInit = true;
                try {
                    bridge.push(_this.modInView.menuEvent ? "showOptionMenu" : "hideOptionMenu");
                } catch (e) {
                    console.log(e);
                }
            }
        },
        //事件绑定
        _bindEvents: function () {
            var _this = this;
            var context = _this.appMod._view, //view上下文
                wrap = context.wrap,
                menuEvent = context.menuEvent,
                events = context.events;

            //页面（异步）渲染完毕后调用
            //wrap && wrap.on('setOnPageStartup', function(){
            events && $.each(events, function (k, v) {
                context[v[2]] && (v[2] = context[v[2]]);

                var ev = v[0] + '.' + k, //加k 标识私有事件
                    el = v[1];
                wrap.off(ev).on(ev, el, function (e) {
                    v[2].apply(context, [e, this]);
                });
            });
            if (menuEvent) {
                var url = History.getState().url,
                    id = url && dd.lib.getUriParam(url, 'ddid');
                id = id || 'index';
                dd._menuHandler = dd._menuHandler || {};
                dd._menuHandler[id] = {context: context, handler: menuEvent};
            }
        },
        _stateListener: function () {
            var _this = this,
                default_hash = _this.config.defaultPage;
            //hash = location.hash.replace(/^#/, ''),
            //hash = dd.lib.getUrlString('vault'),
            var State = History.getState(),
                url = State.url;
            //var hash = dd.lib.getUriParamdd.lib.getUriParam(State.url, this.uname);
            var hash = dd.lib.getUriParam(url, _this.uname);
            var state_now = _this.state_now = hash ? hash : default_hash,
                state_now_name = state_now.split('/')[0],
                state_now_data = _this.config.dataPage[state_now_name],
                state_history = _this.state_history = (_this.state_history ? (dd.navi.alias[_this.state_history] || _this.state_history) : default_hash);

            var state_history_name = state_history.split('/')[0],
                state_history_data = _this.config.dataPage[state_history_name];

            //TODO: 
            //try {
            if (state_history !== state_now) {

                if (!state_now_data || !state_history_data) {
                    //当前 或 过去 hash无效
                    console.log('hash error');
                    location.reload();
                    return;
                }

                _this.showhash = state_now_name;
                _this.outhash = state_history_name;

                _this._state_now = state_now;
                _this._state_history = state_history;

                _this.pagein = $('#J_' + _this.showhash);
                _this.pageout = $('#J_' + _this.outhash);

                _this.modInView = _this.config.dataPage[_this.showhash]._view;
                _this.modOutView = _this.config.dataPage[_this.outhash]._view;


                //非后退 面包屑push
                if (!dd.navi.back) {
                    dd.crumbs.push(state_now);
                    dd.lib.localStorage.set('crumbs', dd.crumbs)
                }

                //非手动触发一律重置面包屑
                if (!dd.navi.hand) {
                    dd.crumbs = [state_now];
                    dd.lib.localStorage.set('crumbs', dd.crumbs)
                } else {
                    dd.navi.hand = false;
                }

                if (dd.navi.forward) {
                    //前进(点击) 右至左
                    _this._swipePrepare('in');
                    dd.navi.forward = false
                } else if (dd.navi.back) {
                    //back(点击) 左至右
                    _this._swipePrepare('out');
                    dd.navi.back = false;
                } else {

                    if (_this.pagein.hasClass('xr')) {
                        _this._swipePrepare('in');
                    } else {
                        //unbuilt
                        if (_this.pagein.index() < _this.pageout.index()) {
                            //子 ==> 父
                            _this._swipePrepare('out');
                        } else {
                            _this._swipePrepare('in');
                        }

                    }

                }


                this.state_history = state_now;

            } else {
                //理论上不会有这种情况
                //_this.clock = false;
                _this._removeListener();
            }
            /*} catch (e) {
             console.log(e);
             }*/

        },
        //滚粗或插入 预备
        _swipePrepare: function (status) {
            var _this = this;

            //是否当前页replace
            if (this.pagein[0].id == this.pageout[0].id) {
                _this.selfpage = true
            } else {
                _this.selfpage = false;

            }

            //容器ddid与当前state ddid不同 更新容器
            if (status == 'in' || (this.pagein.data('ddid') !== this.state_now)) {
                this._initPage();
            }

            switch (status) {
                case 'out':
                    if (!dd.device.iosStyle) {
                        //先滚动设0
                        window.scrollTo(0, 0);
                    }
                    _this._swipeOut();
                    break;
                case 'in':
                    if (!dd.device.iosStyle) {
                        //记录滚动高度
                        _this.modOutView.scroll_top && (_this.modOutView.scroll_top = doc.body.scrollTop);
                        window.scrollTo(0, 0);
                    }
                    _this._swipeIn();
                    break;
                default:
                    _this._swipeIn();
            }
        },
        //插入
        _swipeIn: function () {
            var _this = this,
                pageshow = _this.pagein,
                pageout = _this.pageout,
                interval = _this.interval;

            var tparam = [_this._state_now, _this._state_history];

            _this.modOutView.setBeforePageOut && _this.modOutView.setBeforePageOut(tparam[0], tparam[1]);
            _this.modInView.setBeforePageIn && _this.modInView.setBeforePageIn(tparam[0], tparam[1]);


            pageout.removeClass('xc');
            pageshow.attr('data-flashin', 'true');
            if (true || pageshow.attr('data-flashin')) {
                //去除动画.by 一杉
                //无动画
                if (_this.showhash !== _this.outhash) {
                    pageout.addClass('hide');
                }
                pageshow.removeClass('xr hide')//.addClass('xc');

                setTimeout(function () {
                    //50 hack for android
                    _this.modOutView.setAfterPageOut && _this.modOutView.setAfterPageOut(tparam[0], tparam[1]);
                    _this._callAfterIn();
                    _this.modInView.setAfterPageIn && _this.modInView.setAfterPageIn(tparam[0], tparam[1]);
                    //更新titleBar内容
                    if (dd._hideTitleBar) {
                        try {
                            if (_this.modInView.wrap.find(".hd_title").find("h2") && !_this.modInView._titleLazy) {
                                bridge.push("setTitle", {
                                    title: _this.modInView.wrap.find(".hd_title").find("h2").html() || "淘点点"
                                });
                            }
                            bridge.push(_this.modInView.menuEvent ? "showOptionMenu" : "hideOptionMenu");
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }, 50)

            } else {
                if (!_this.selfpage) {
                    pageout[0].addEventListener('webkitTransitionEnd', tend, false);
                    pageout.addClass('xl sliding');

                    setTimeout(function () {
                        pageshow.removeClass('hide');
                    }, 50);


                } else {
                    //统一模块group的内部切换
                    pageshow.addClass('xc');

                    _this.modOutView.setAfterPageOut && _this.modOutView.setAfterPageOut(tparam[0], tparam[1]);
                    _this._callAfterIn();
                    _this.modInView.setAfterPageIn && _this.modInView.setAfterPageIn(tparam[0], tparam[1]);
                    //更新titleBar内容
                    if (dd._hideTitleBar) {
                        try {
                            if (_this.modInView.wrap.find(".hd_title").find("h2") && !_this.modInView._titleLazy) {
                                bridge.push("setTitle", {
                                    title: _this.modInView.wrap.find(".hd_title").find("h2").html() || "淘点点"
                                });
                            }
                            bridge.push(_this.modInView.menuEvent ? "showOptionMenu" : "hideOptionMenu");
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }

                function tend(e) {
                    if (e.propertyName && e.propertyName.indexOf('transform') != -1 && Math.round(e.elapsedTime * 100) == 30) {
                        pageout[0].removeEventListener('webkitTransitionEnd', tend, false);

                        if (_this.showhash !== _this.outhash) {
                            if (!_this.selfpage) {
                                pageout.addClass('hide').removeClass('xc xl xr sliding');
                            }
                        }
                        pageout.removeClass('sliding')

                        _this.modOutView.setAfterPageOut && _this.modOutView.setAfterPageOut(tparam[0], tparam[1]);
                        _this._callAfterIn();
                        _this.modInView.setAfterPageIn && _this.modInView.setAfterPageIn(tparam[0], tparam[1]);

                    }

                }

            }

        },
        //滚粗
        _swipeOut: function () {
            var _this = this,
                pageshow = _this.pagein,
                pageout = _this.pageout;

            var tparam = [_this._state_now, _this._state_history];

            _this.modOutView.setBeforePageOut && _this.modOutView.setBeforePageOut(tparam[0], tparam[1]);
            _this.modInView.setBeforePageIn && _this.modInView.setBeforePageIn(tparam[0], tparam[1]);


            pageout.removeClass('xc');//todo
            pageshow.attr('data-flashin', 'true');
            if (true || pageout.attr('data-flashin')) {
                //去除动画.by 一杉
                //无动画
                pageout.addClass('hide')//.hide();
                pageshow.removeClass('hide')//.addClass('xc')//.show();

                setTimeout(function () {
                    _this.modOutView.setAfterPageOut && _this.modOutView.setAfterPageOut(tparam[0], tparam[1]);
                    _this._callAfterOut();
                    _this.modInView.setAfterPageIn && _this.modInView.setAfterPageIn(tparam[0], tparam[1]);
                    if (dd._hideTitleBar) {
                        try {
                            if (_this.modInView.wrap.find(".hd_title").find("h2") && !_this.modInView._titleLazy) {
                                bridge.push("setTitle", {
                                    title: _this.modInView.wrap.find(".hd_title").find("h2").html() || "淘点点"
                                });
                            }
                            bridge.push(_this.modInView.menuEvent ? "showOptionMenu" : "hideOptionMenu");
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }, 0);
            } else {
                pageout[0].addEventListener('webkitTransitionEnd', tend, false);
                pageout.addClass('xr sliding');

                setTimeout(function () {
                    pageshow.removeClass('hide')
                }, 50);

                function tend(e) {
                    if (e.propertyName && e.propertyName.indexOf('transform') != -1 && Math.round(e.elapsedTime * 100) == 30) {
                        pageout[0].removeEventListener('webkitTransitionEnd', tend, false);

                        pageout.addClass('hide').removeClass('xr sliding')
                        pageshow.removeClass('xc');

                        _this.modOutView.setAfterPageOut && _this.modOutView.setAfterPageOut(tparam[0], tparam[1]);
                        _this._callAfterOut();
                        _this.modInView.setAfterPageIn && _this.modInView.setAfterPageIn(tparam[0], tparam[1]);
                    }

                }
            }

        },
        _callAfterIn: function () {
            //scroll对象
            var _this = this;
            _this.modInView.mainScroll && (_this.modInView.mainScroll.enable() || _this.modInView.mainScroll.refresh());
            _this.modOutView.mainScroll && _this.modOutView.mainScroll.disable();

            _this.modInView._scroll && (_this.modInView._scroll.enable() || _this.modInView._scroll.refresh());
            _this.modOutView._scroll && _this.modOutView._scroll.disable();


            //_this.clock = false;


            _this._removeListener()
        },
        _callAfterOut: function () {
            //恢复scroll
            var _this = this;
            _this.modInView['mainScroll'] && (_this.modInView.mainScroll.enable() || _this.modInView.mainScroll.refresh());
            _this.modOutView.mainScroll && _this.modOutView.mainScroll.disable();

            _this.modInView._scroll && (_this.modInView._scroll.enable() || _this.modInView._scroll.refresh());
            _this.modOutView._scroll && _this.modOutView._scroll.disable();

            //_this.clock = false;

            //恢复滚动高度
            if (!dd.device.iosStyle) {
                if (_this.modInView.scroll_top) {
                    doc.body.scrollTop = _this.modInView.scroll_top;
                    _this.modInView.scroll_top = 0;
                }
            }

            _this._removeListener()
        },
        /*
         * 解除点击拦击，延时150毫秒防止动画过慢
         */
        _removeListener: function () {
            setTimeout(function () {
                body.removeEventListener('click', dd.lib.preventAllClick, true);
            }, 100)

            document.removeEventListener('touchmove', dd.event.stoptouchmoveHandler, false);
        }

    }

    /*function isType(obj, type) {
     return Object.prototype.toString.call(obj) === "[object " + type + "]";
     }*/

    dd.StatePage = function (options) {
        return new StatePage(options);
    };

})(Zepto, window, window['dd']);
/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
 * modify: [ delay = options.auto > 0 ? options.auto : 0; ]
*/

function Swipe(container, options) {

  "use strict";

  // utilities
  var noop = function() {}; // simple no operation function
  var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution

  // check browser capabilities
  var browser = {
    addEventListener: !!window.addEventListener,
    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
    transitions: (function(temp) {
      var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
      for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
      return false;
    })(document.createElement('swipe'))
  };

  // quit if no root element
  if (!container) return;
  var element = container.children[0];
  var slides, slidePos, width, length;
  options = options || {};
  var index = parseInt(options.startSlide, 10) || 0;
  var speed = options.speed || 300;
  options.continuous = options.continuous !== undefined ? options.continuous : true;

  function setup() {

    // cache slides
    slides = element.children;
    length = slides.length;

    // set continuous to false if only one slide
    if (slides.length < 2) options.continuous = false;

    //special case if two slides
    if (browser.transitions && options.continuous && slides.length < 3) {
      element.appendChild(slides[0].cloneNode(true));
      element.appendChild(element.children[1].cloneNode(true));
      slides = element.children;
    }

    // create an array to store current positions of each slide
    slidePos = new Array(slides.length);

    // determine width of each slide
    width = container.getBoundingClientRect().width || container.offsetWidth;

    element.style.width = (slides.length * width) + 'px';

    // stack elements
    var pos = slides.length;
    while(pos--) {

      var slide = slides[pos];

      slide.style.width = width + 'px';
      slide.setAttribute('data-index', pos);

      if (browser.transitions) {
        slide.style.left = (pos * -width) + 'px';
        move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
      }

    }

    // reposition elements before and after index
    if (options.continuous && browser.transitions) {
      move(circle(index-1), -width, 0);
      move(circle(index+1), width, 0);
    }

    if (!browser.transitions) element.style.left = (index * -width) + 'px';

    container.style.visibility = 'visible';

  }

  function prev() {

    if (options.continuous) slide(index-1);
    else if (index) slide(index-1);

  }

  function next() {

    if (options.continuous) slide(index+1);
    else if (index < slides.length - 1) slide(index+1);

  }

  function circle(index) {

    // a simple positive modulo using slides.length
    return (slides.length + (index % slides.length)) % slides.length;

  }

  function slide(to, slideSpeed) {

    // do nothing if already on requested slide
    if (index == to) return;

    if (browser.transitions) {

      var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

      // get the actual position of the slide
      if (options.continuous) {
        var natural_direction = direction;
        direction = -slidePos[circle(to)] / width;

        // if going forward but to < index, use to = slides.length + to
        // if going backward but to > index, use to = -slides.length + to
        if (direction !== natural_direction) to =  -direction * slides.length + to;

      }

      var diff = Math.abs(index-to) - 1;

      // move all the slides between index and to in the right direction
      while (diff--) move( circle((to > index ? to : index) - diff - 1), width * direction, 0);

      to = circle(to);

      move(index, width * direction, slideSpeed || speed);
      move(to, 0, slideSpeed || speed);

      if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place

    } else {

      to = circle(to);
      animate(index * -width, to * -width, slideSpeed || speed);
      //no fallback for a circular continuous if the browser does not accept transitions
    }

    index = to;
    offloadFn(options.callback && options.callback(index, slides[index]));
  }

  function move(index, dist, speed) {

    translate(index, dist, speed);
    slidePos[index] = dist;

  }

  function translate(index, dist, speed) {

    var slide = slides[index];
    var style = slide && slide.style;

    if (!style) return;

    style.webkitTransitionDuration =
    style.MozTransitionDuration =
    style.msTransitionDuration =
    style.OTransitionDuration =
    style.transitionDuration = speed + 'ms';

    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform =
    style.MozTransform =
    style.OTransform = 'translateX(' + dist + 'px)';

  }

  function animate(from, to, speed) {

    // if not an animation, just reposition
    if (!speed) {

      element.style.left = to + 'px';
      return;

    }

    var start = +new Date;

    var timer = setInterval(function() {

      var timeElap = +new Date - start;

      if (timeElap > speed) {

        element.style.left = to + 'px';

        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        clearInterval(timer);
        return;

      }

      element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

    }, 4);

  }

  // setup auto slideshow
  var delay = options.auto || 0;
  var interval;

  function begin() {

    interval = setTimeout(next, delay);

  }

  function stop() {

    //delay = 0;
    delay = options.auto > 0 ? options.auto : 0;
    clearTimeout(interval);

  }


  // setup initial vars
  var start = {};
  var delta = {};
  var isScrolling;

  // setup event capturing
  var events = {

    handleEvent: function(event) {

      switch (event.type) {
        case 'touchstart': this.start(event); break;
        case 'touchmove': this.move(event); break;
        case 'touchend': offloadFn(this.end(event)); break;
        case 'webkitTransitionEnd':
        case 'msTransitionEnd':
        case 'oTransitionEnd':
        case 'otransitionend':
        case 'transitionend': offloadFn(this.transitionEnd(event)); break;
        case 'resize': offloadFn(setup); break;
      }

      if (options.stopPropagation) event.stopPropagation();

    },
    start: function(event) {

      var touches = event.touches[0];

      // measure start values
      start = {

        // get initial touch coords
        x: touches.pageX,
        y: touches.pageY,

        // store time to determine touch duration
        time: +new Date

      };

      // used for testing first move event
      isScrolling = undefined;

      // reset delta and end measurements
      delta = {};

      // attach touchmove and touchend listeners
      element.addEventListener('touchmove', this, false);
      element.addEventListener('touchend', this, false);

    },
    move: function(event) {

      // ensure swiping with one touch and not pinching
      if ( event.touches.length > 1 || event.scale && event.scale !== 1) return

      if (options.disableScroll) event.preventDefault();

      var touches = event.touches[0];

      // measure change in x and y
      delta = {
        x: touches.pageX - start.x,
        y: touches.pageY - start.y
      }

      // determine if scrolling test has run - one time test
      if ( typeof isScrolling == 'undefined') {
        isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
      }

      // if user is not trying to scroll vertically
      if (!isScrolling) {

        // prevent native scrolling
        event.preventDefault();

        // stop slideshow
        stop();

        // increase resistance if first or last slide
        if (options.continuous) { // we don't add resistance at the end

          translate(circle(index-1), delta.x + slidePos[circle(index-1)], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(circle(index+1), delta.x + slidePos[circle(index+1)], 0);

        } else {

          delta.x =
            delta.x /
              ( (!index && delta.x > 0               // if first slide and sliding left
                || index == slides.length - 1        // or if last slide and sliding right
                && delta.x < 0                       // and if sliding at all
              ) ?
              ( Math.abs(delta.x) / width + 1 )      // determine resistance level
              : 1 );                                 // no resistance if false

          // translate 1:1
          translate(index-1, delta.x + slidePos[index-1], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(index+1, delta.x + slidePos[index+1], 0);
        }

      }

    },
    end: function(event) {

      // measure duration
      var duration = +new Date - start.time;

      // determine if slide attempt triggers next/prev slide
      var isValidSlide =
            Number(duration) < 250               // if slide duration is less than 250ms
            && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
            || Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

      // determine if slide attempt is past start and end
      var isPastBounds =
            !index && delta.x > 0                            // if first slide and slide amt is greater than 0
            || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

      if (options.continuous) isPastBounds = false;

      // determine direction of swipe (true:right, false:left)
      var direction = delta.x < 0;

      // if not scrolling vertically
      if (!isScrolling) {

        if (isValidSlide && !isPastBounds) {

          if (direction) {

            if (options.continuous) { // we need to get the next in this direction in place

              move(circle(index-1), -width, 0);
              move(circle(index+2), width, 0);

            } else {
              move(index-1, -width, 0);
            }

            move(index, slidePos[index]-width, speed);
            move(circle(index+1), slidePos[circle(index+1)]-width, speed);
            index = circle(index+1);

          } else {
            if (options.continuous) { // we need to get the next in this direction in place

              move(circle(index+1), width, 0);
              move(circle(index-2), -width, 0);

            } else {
              move(index+1, width, 0);
            }

            move(index, slidePos[index]+width, speed);
            move(circle(index-1), slidePos[circle(index-1)]+width, speed);
            index = circle(index-1);

          }

          options.callback && options.callback(index, slides[index]);

        } else {

          if (options.continuous) {

            move(circle(index-1), -width, speed);
            move(index, 0, speed);
            move(circle(index+1), width, speed);

          } else {

            move(index-1, -width, speed);
            move(index, 0, speed);
            move(index+1, width, speed);
          }

        }

      }

      // kill touchmove and touchend event listeners until touchstart called again
      element.removeEventListener('touchmove', events, false)
      element.removeEventListener('touchend', events, false)

    },
    transitionEnd: function(event) {

      if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

      }

    }

  }

  // trigger setup
  setup();

  // start auto slideshow if applicable
  if (delay) begin();


  // add event listeners
  if (browser.addEventListener) {

    // set touchstart event on element
    if (browser.touch) element.addEventListener('touchstart', events, false);

    if (browser.transitions) {
      element.addEventListener('webkitTransitionEnd', events, false);
      element.addEventListener('msTransitionEnd', events, false);
      element.addEventListener('oTransitionEnd', events, false);
      element.addEventListener('otransitionend', events, false);
      element.addEventListener('transitionend', events, false);
    }

    // set resize event on window
    window.addEventListener('resize', events, false);

  } else {

    window.onresize = function () { setup() }; // to play nice with old IE

  }

  // expose the Swipe API
  return {
    setup: function() {

      setup();

    },
    slide: function(to, speed) {

      // cancel slideshow
      stop();

      slide(to, speed);

    },
    prev: function() {

      // cancel slideshow
      stop();

      prev();

    },
    next: function() {

      // cancel slideshow
      stop();

      next();

    },
    stop: function() {

      // cancel slideshow
      stop();

    },
    getPos: function() {

      // return current index position
      return index;

    },
    getNumSlides: function() {

      // return total number of slides
      return length;
    },
    kill: function() {

      // cancel slideshow
      stop();

      // reset element
      element.style.width = '';
      element.style.left = '';

      // reset slides
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];
        slide.style.width = '';
        slide.style.left = '';

        if (browser.transitions) translate(pos, 0, 0);

      }

      // removed event listeners
      if (browser.addEventListener) {

        // remove current event listeners
        element.removeEventListener('touchstart', events, false);
        element.removeEventListener('webkitTransitionEnd', events, false);
        element.removeEventListener('msTransitionEnd', events, false);
        element.removeEventListener('oTransitionEnd', events, false);
        element.removeEventListener('otransitionend', events, false);
        element.removeEventListener('transitionend', events, false);
        window.removeEventListener('resize', events, false);

      }
      else {

        window.onresize = null;

      }

    }
  }

}


if ( window.jQuery || window.Zepto ) {
  (function($) {
    $.fn.Swipe = function(params) {
      return this.each(function() {
        $(this).data('Swipe', new Swipe($(this)[0], params));
      });
    }
  })( window.jQuery || window.Zepto )
}