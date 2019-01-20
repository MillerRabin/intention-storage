const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const recursive = require('recursive-readdir');
const mkdirp = require('mkdirp-promise');
const projectPath = process.cwd();
const targetPath = path.join(projectPath, 'browser');

rimraf.sync(targetPath);

function ignore(file, stats) {
    if (stats.isDirectory()) return false;
    const pi = path.parse(file);
    return pi.ext != '.js';

}

function toImport(str) {
    let output = str.replace(/module.exports\s*=\s*/, 'export default ');
    output = output.replace(/const\s+(.+)\s*=\s*require\('(.+)'\);/g, 'import $1 from "$2";');
    return output;
}

recursive(projectPath, ['node_modules', '.git', 'test', 'browser', '.idea', 'builder', ignore], async function (err, files) {
    for (let file of files) {
        const rPath = path.relative(projectPath, file);
        const rs = path.parse(rPath);
        const tPath = path.join(targetPath, rs.dir);
        await mkdirp(tPath);
        const target = path.join(targetPath, rPath);
        const buffer = fs.readFileSync(file);
        const output = toImport(buffer.toString());
        fs.writeFileSync(target, output);
    }
});