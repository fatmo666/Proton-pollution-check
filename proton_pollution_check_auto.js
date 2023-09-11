const names = require("all-the-package-names")
const { exec, execSync } = require("child_process"); // 引入execSync
const process = require('process');
const fs = require('fs');

function write_log(logText){
    try {
        fs.appendFileSync('checkLog.log', logText + '\n'); // 注意，这里添加了换行符 '\n'
        console.log('File has been written');
    } catch (err) {
        console.error('There was an error writing the file.', err);
    }
}

var args = process.argv.slice(2);
var packageName = args[0];
var version = args[1];

let filterArray = names.filter(name => name.includes(packageName));
write_log("Filter " + filterArray.length + " Packages.");
for (let pkgName of filterArray) {
	if (pkgName == "@deepcase/android-lodash-fix"){
		continue;
	}

    // 如果没有指定版本号，就使用最新版本
    var packageWithVersion = version ? `${pkgName}@${version}` : pkgName;
    write_log("Checking: " + packageWithVersion);
    console.log("Downloading: " + packageWithVersion);

    // 使用npm install命令下载指定版本的包，或者默认下载最新版本
    try {
        execSync(`npm install ${packageWithVersion}`, { stdio: 'inherit' , timeout: 60000});
    } catch (err) {
        console.error(`Error installing ${packageWithVersion}:`, err);
        continue;
    }
    
    console.log("Exec: " + packageWithVersion);
    try {
        var lib = require(pkgName);
    } catch (e) {
        console.log("Missing library : " + packageWithVersion );
        try {
            execSync(`npm uninstall ${pkgName}`, { stdio: 'inherit' });
            console.log(`Successfully uninstalled ${pkgName}`);
        } catch (err) {
            console.error(`Error uninstalling ${pkgName}:`, err);
        }
        continue;
    }

    //exploreLib(lib, packageWithVersion, 5);
	let startTime = new Date().getTime();
    let maxDuration = 1500; // 在这里设置你的超时时间（毫秒）

    while(new Date().getTime() - startTime < maxDuration) {
        try {
            exploreLib(lib, packageWithVersion, 5, startTime, maxDuration);
            break;
        } catch(e) {
            if(e.message !== 'RangeError') throw e;  // 如果是其他错误，则抛出
        }
    }

    // 执行完毕后，卸载这个包
    try {
        execSync(`npm uninstall ${pkgName}`, { stdio: 'inherit' });
        console.log(`Successfully uninstalled ${pkgName}`);
    } catch (err) {
        console.error(`Error uninstalling ${pkgName}:`, err);
    }

    // 设置为 null 以便于垃圾收集
    pkgName = null;
    packageWithVersion = null;
    lib = null;
    
}


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

function check() {
	if ({}.test == "123" || {}.test == 123) {
		delete Object.prototype.test;
		return true;
	}
	return false;
}

function run(fnct, sig, name, totest) {
	// Reinitialize to avoid issue if the previous function changed attributes.
	let BAD_JSON = JSON.parse('{"__proto__":{"test":123}}');

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

function exploreLib(lib, prefix, depth, startTime, maxDuration) {
    let parsedObject = [];

	if (depth == 0) return;
	if (parsedObject.indexOf(lib) !== -1) return;

	parsedObject.push(lib);

	for (var k in lib) {
		if (k == "abort") continue;
		if (k == "__proto__") continue;
		if (+k == k) continue;

		console.log(k);
        
        //if (lib.hasOwnProperty(k)) {
		if (Object.prototype.hasOwnProperty.call(lib, k)) {
			if (typeof lib[k] == "function") {
				for (p in pattern) {
					if (pattern.hasOwnProperty(p)) {
						run(pattern[p].fnct, pattern[p].sig, prefix + "." + k, lib[k]);
					}
				}
			}
			exploreLib(lib[k], prefix + "." + k, depth - 1, startTime, maxDuration);

			if(new Date().getTime() - startTime > maxDuration) {
				throw new Error('RangeError');
			}
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
