var process = require('process');
const fs = require('fs');
// proton_check.js
const execSync = require('child_process').execSync;

function check() {
	if ({}.test == "123" || {}.test == 123) {
		delete Object.prototype.test;
		return true;
	}
	return false;
}

function run(fnct, sig, name, totest) {
	// Reinitialize to avoid issue if the previous function changed attributes.
	BAD_JSON = JSON.parse('{"__proto__":{"test":123}}');

	if (typeof totest !== 'function') {
		console.warn(`Trouble: ${totest} is not a function in run() with name=${name}`);
		return;
	}

	try {
		fnct(totest);
	} catch (e) {}

	if (check()) {
		console.log("Detected : " + name + " (" + sig + ")");
		var detectedResult = name + " (" + sig + ")" + "\n";
		fs.appendFile('result/' + args[0], detectedResult, (err) => {
			if (err) {
				console.error('There was an error writing the file.', err);
			} else {
				console.log('File has been written');
			}
		});
	}
}


var BAD_JSON = {};
var args = process.argv.slice(2);

var packageName = args[0]; // 获取包名
var version = args[1]; // 获取版本号（可能为undefined）

// 如果没有指定版本号，就使用最新版本
var packageWithVersion = version ? `${packageName}@${version}` : packageName;

// 使用npm install命令下载指定版本的包，或者默认下载最新版本
try {
    execSync(`npm install ${packageWithVersion}`, { stdio: 'inherit' });
} catch (err) {
    console.error(`Error installing ${packageWithVersion}:`, err);
    process.exit(1);
}

process.on('uncaughtException', function(err) {
    console.error('Unhandled Exception', err);
    process.exit(1);
});

var pattern = [{
	fnct : function (totest) {
		totest(BAD_JSON);
	},
	sig: "function (BAD_JSON)"
},{
	fnct : function (totest) {
		totest(BAD_JSON, {});
	},
	sig: "function (BAD_JSON, {})"
},{
	fnct : function (totest) {
		totest({}, BAD_JSON);
	},
	sig: "function ({}, BAD_JSON)"
},{
	fnct : function (totest) {
		totest(BAD_JSON, BAD_JSON);
	},
	sig: "function (BAD_JSON, BAD_JSON)"
},{
	fnct : function (totest) {
		totest({}, {}, BAD_JSON);
	},
	sig: "function ({}, {}, BAD_JSON)"
},{
	fnct : function (totest) {
		totest({}, {}, {}, BAD_JSON);
	},
	sig: "function ({}, {}, {}, BAD_JSON)"
},{
	fnct : function (totest) {
		totest({}, "__proto__.test", "123");
	},
	sig: "function ({}, BAD_PATH, VALUE)"
},{
	fnct : function (totest) {
		totest({}, "__proto__[test]", "123");
	},
	sig: "function ({}, BAD_PATH, VALUE)"
},{
	fnct : function (totest) {
		totest("__proto__.test", "123");
	},
	sig: "function (BAD_PATH, VALUE)"
},{
	fnct : function (totest) {
		totest("__proto__[test]", "123");
	},
	sig: "function (BAD_PATH, VALUE)"
},{
	fnct : function (totest) {
		totest({}, "__proto__", "test", "123");
	},
	sig: "function ({}, BAD_STRING, BAD_STRING, VALUE)"
},{
	fnct : function (totest) {
		totest("__proto__", "test", "123");
	},
	sig: "function (BAD_STRING, BAD_STRING, VALUE)"
}]

if (args.length < 1) {
	console.log("First argument must be the library name");
	exit();
}

try {
	var lib = require(args[0]);
} catch (e) {
	console.log("Missing library : " + args[0] );
	exit();
}

var parsedObject = [];

function exploreLib(lib, prefix, depth) {
	if (depth == 0) return;
	if (parsedObject.indexOf(lib) !== -1) return;

	parsedObject.push(lib);

	for (var k in lib) {
		if (k == "abort") continue;
		if (k == "__proto__") continue;
		if (+k == k) continue;

		console.log(k);
	
		if (lib.hasOwnProperty(k)) {
			if (typeof lib[k] == "function") {
				for (p in pattern) {
					if (pattern.hasOwnProperty(p)) {
						run(pattern[p].fnct, pattern[p].sig, prefix + "." + k, lib[k]);
					}
				}
			}
			exploreLib(lib[k], prefix + "." + k, depth - 1);
		}
	}

	if (typeof lib == "function") {
		console.log(lib.name || "Empty name Func.");
		for (p in pattern) {
			if (pattern.hasOwnProperty(p)) {
				run(pattern[p].fnct, pattern[p].sig, args[0], lib);
			}
		}
	}
}

// node proton_check.js js-merge-object 1.0.0
// node proton_check.js js-merge-object
exploreLib(lib, args[0], 5);
