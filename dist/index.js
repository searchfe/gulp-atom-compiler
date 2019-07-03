"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gutil = require("gulp-util");
const through = require("through2");
const replaceExt = require("replace-ext");
const compiler = require("@baidu/atom-web-compiler");
function parseAtom(opt) {
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
                    return `"@molecule/${val}"`;
                },
                compileJSComponent(val, key) {
                    // search-ui 则不做任何处理
                    if (isSearchUi(val)) {
                        val = val.replace(/^search-ui\//, 'search-ui/v2/');
                        return `require("${val}")`;
                    }
                    // val: searchbox/main
                    return `require("@molecule/${val}")`;
                },
            });
            if (opt.type === 'js') {
                file.contents = new Buffer(compiled.compiled.js);
                file.path = replaceExt(file.path, '.js');
            }
            else {
                file.contents = new Buffer(compiled.compiled.php.replace(/^\s+|\s+$/g, ''));
                file.path = replaceExt(file.path, '.php');
            }
            console.log(file.path);
            this.push(file);
            cb();
        }
    });
}
exports.parseAtom = parseAtom;
function isSearchUi(path) {
    path = path || '';
    return path.indexOf('search-ui') > -1;
}
