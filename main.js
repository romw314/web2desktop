const prompts = require('prompts');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const Git = require('simple-git')();
const pressAnyKey = require('press-any-key');
const validUrl = require('valid-url');
const { exec } = require('shelljs');

const openP = import('open');
let open;

if (!fs.existsSync('./web2desktop.config.js'));
	fs.writeFileSync('./web2desktop.config.js', `\
module.exports = {
	dir: 'web2desktop'
};\
`);
const config = require('./web2desktop.config.js');

const dir = config.dir || 'web2desktop';

let pkg;

const startdir = __dirname;

function fp(...pathArg) { // name: fp = file path
	const result = path.join(startdir, dir, ...pathArg);
	console.log('fp log: ', [startdir, dir, ...pathArg], ', fp result:', result);
	return result;
}

function infolog() {
	console.log('=== INFOLOG ===');
	console.log('dirname:', __dirname);
	console.log('dir:', dir);
	console.log('fp-ed nothing:', fp());
	console.log('===============');
}

async function init() {
	if (fs.existsSync(fp()))
		fs.rmdirSync(fp(), { recursive: true });
	await Git.clone('https://github.com/romw314/web2desktop-template.git', fp());
}

async function promptPkg(type, message, name) {
	Object.assign(pkg, await prompts({ type: type, name: name, message: message }));
}

function validatePkg() {
}

async function main() {
	await init();
	infolog();
	pkg = JSON.parse(fs.readFileSync(fp('package.json'), { encoding: 'utf8' }));
	await promptPkg('text', 'Package name (id) of the application', 'name');
	await promptPkg('text', 'One-line description of your application', 'description');
	await promptPkg('text', 'Author of the application', 'author');
	await pressAnyKey('Press any key to open the SPDX license table in browser.\nPress CTRL+C to choose a license without opening browser.', { ctrlC: 'reject' })
		.then(() => open('https://spdx.org/licenses/')).catch(() => {});
	await promptPkg('text', 'License of the application', 'license');
	pkg.build.productName = await prompts({ type: 'text', message: 'The full name of your application', name: 'value' }).then(x => x.value);
	pkg.build.appId = `com.electron.${pkg.name}`;
	console.log('validating...');
	const error = validatePkg();
	if (error) {
		console.log(error);
		process.exit(4);
	}
	console.log('OK!');
	await pressAnyKey('Press any key to continue.\nPress CTRL+C to exit.', { ctrlC: 'reject' }).catch(process.exit);
	fs.writeFileSync(fp('package.json'), JSON.stringify(pkg), { encoding: 'utf8' });
	console.log('write ok');
	fse.copySync(fs.realpathSync(process.argv[2]), fp('www'), { overwrite: true });
	console.log('copy ok');
	process.chdir(fp());
	console.log('chdir ok');
	console.log('installing dependencies...');
	exec('npm install');
	console.log('building...');
	exec('npx electron-builder build');
}

(async () => {
	open = await openP;
	await main();
})().then(process.exit);

