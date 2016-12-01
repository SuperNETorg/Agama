//main proc for EasyDEX GUI
//this app spawns iguana in background in nontech-mode

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const os = require('os')
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
var fs = require('fs');
var mkdirp = require('mkdirp');

// GUI APP settings and starting gui on address http://120.0.0.1:17777
var express = require('express')
var guiapp = express()

var guipath = path.join(__dirname, '/gui')
guiapp.use('/gui', express.static(guipath))

guiapp.get('/', function (req, res) {
  res.send('Hello World!')
})

var rungui = guiapp.listen(17777, function () {
  console.log('guiapp listening on port 17777!')
})
// END GUI App Settings


//require('./assets/js/iguana.js'); //below code shall be separated into asset js for public version
var iguanaOSX = path.join(__dirname, '/assets/iguana/iguana');
var iguanaLinux = path.join(__dirname, '/assets/iguana/iguanaLinux');
var iguanaWin = path.join(__dirname, '/assets/iguana/iguana32.exe');

if (os.platform() === 'darwin') {
  var iguanaDir = process.env.HOME + '/Library/Application Support/iguana'
}
if (os.platform() === 'linux') {
  var iguanaDir = process.env.HOME + '/.iguana'
}
if (os.platform() === 'win32') {
  var iguanaDir = process.env.APPDATA + '/iguana'
}

//console.log(iguanaDir);

mkdirp(iguanaDir, function (err) {
  if (err)
    console.error(err)
  else
    fs.readdir(iguanaDir, (err, files) => {
      files.forEach(file => {
        //console.log(file);
      });
    })
});



let mainWindow

function createWindow () {

  // initialise window
  mainWindow = new BrowserWindow({width: 1280, height: 800})

  // load our index.html (i.e. easyDEX GUI)
  mainWindow.loadURL('http://localhost:17777/gui/EasyDEX-GUI/');
  /*mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'EasyDEX-GUI/index.html'),
    protocol: 'file:',
    slashes: true
  }))*/

  // DEVTOOLS - only for dev purposes - ca333
  //mainWindow.webContents.openDevTools()

  // if window closed we kill iguana proc
  mainWindow.on('closed', function () {
      ig.kill();
    // our app does not have multiwindow - so we dereference the window object instead of
    // putting them into an window_arr
    mainWindow = null
  })

  //ca333 todo - add os detector to use correct binary - so we can use the same bundle on ALL OS platforms
  //if (os.platform() === 'win32') {
  //ex(iguanaWin) //specify binary in startup
  //}
  if (os.platform() === 'linux') {
    process.chdir(iguanaDir);
    ig = spawn(iguanaLinux);
  }
  if (os.platform() === 'darwin') {
    process.chdir(iguanaDir);
    ig = spawn(iguanaOSX);
  }
  //}if (os.platform() === 'freeBSD') {
  //ex(iguanaFreeBSD)
  //}
  //ca333 - could also specifiy via os.arch (x86, x64, etc. ) in startup and pass via param to main proc

  ig.stderr.on( 'error: ', data => {
  console.log( `stderr: ${data}` );
      });
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    ig.kill();
  // in osx apps stay active in menu bar until explictly closed or quitted by CMD Q
  // so we do not kill the app --> for the case user clicks again on the iguana icon
  // we open just a new window and respawn iguana proc
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
