// prequsites: https://www.npmjs.com/package/electron-installer-redhat

var installer = require('electron-installer-redhat');

var options = {
  src: 'build/Agama-linux-x64/',
  dest: 'build/',
  arch: 'x86_64',
  icon: 'assets/icons/agama_icons/64x64.png',
  name: 'agama-app',
  bin: 'Agama',
  categories: ['Office', 'Internet'],
  homepage: 'http://supernet.org',
  maintainer: 'SuperNET <dev@supernet.org>',
};

console.log('Creating package (this may take a while)');

installer(options, function (err) {
  if (err) {
    console.error(err, err.stack);
    process.exit(1);
  }

  console.log('Successfully created package at ' + options.dest);
});