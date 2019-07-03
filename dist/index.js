"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gutil = require("gulp-util");
const through = require("through2");
const replaceExt = require("replace-ext");
const compiler = require("@baidu/atom-web-compiler");
function parseAtom() {
    return through.obj(function (file, enc, cb) {
        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
        if (file.isNull()) {
            this.emit('error', new gutil.PluginError('files can not be empty'));
            return cb();
        }
        // 插件不支持对 Stream 对直接操作，跑出异常
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('Streaming not supported'));
            return cb();
        }
        if (file.isBuffer()) {
            const content = file.contents.toString();
            const compiled = compiler.compile({
                content: content,
                mode: 'amd',
                strip: true,
                compilePHPComponent: function (val, key) {
                    // search-ui 则不做任何处理
                    if (isSearchUi(val)) {
                        val = val.replace(/^search-ui\//, 'search-ui/v2/');
                        return `"${val}"`;
                    }
                    return `"wiseatom/${val}"`;
                },
                compileJSComponent(val, key) {
                    // search-ui 则不做任何处理
                    if (isSearchUi(val)) {
                        val = val.replace(/^search-ui\//, 'search-ui/v2/');
                        return `require("${val}")`;
                    }
                    // val: searchbox/main
                    return `require("wiseatom/${val}")`;
                },
            });
            file.contents = new Buffer(compiled.compiled.js);
            file.path = replaceExt(file.path, '.js');
            let phpContents = new Buffer(compiled.compiled.php.replace(/^\s+|\s+$/g, ''));
            let phpPath = replaceExt(file.path, '.php');
            this.push(file);
            this.push(new gutil.File({
                path: phpPath,
                contents: phpContents
            }));
            cb();
        }
    });
}
exports.parseAtom = parseAtom;
function isSearchUi(path) {
    path = path || '';
    return path.indexOf('search-ui') > -1;
}
