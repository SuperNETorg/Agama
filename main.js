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

// SELECTING IGUANA BUILD TO RUN AS PER OS DETECTED BY DESKTOP APP
var iguanaOSX = path.join(__dirname, '/assets/bin/osx/iguana');
var iguanaLinux = path.join(__dirname, '/assets/bin/linux64/iguana');
var iguanaWin = path.join(__dirname, '/assets/bin/win64/iguana.exe'); iguanaWin = path.normalize(iguanaWin);

// SETTING OS DIR TO RUN IGUANA FROM
if (os.platform() === 'darwin') { var iguanaDir = process.env.HOME + '/Library/Application Support/iguana' }
if (os.platform() === 'linux') { var iguanaDir = process.env.HOME + '/.iguana' }
if (os.platform() === 'win32') { var iguanaDir = process.env.APPDATA + '/iguana'; iguanaDir = path.normalize(iguanaDir) }

// SETTING APP ICON FOR LINUX AND WINDOWS
if (os.platform() === 'linux') { var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon_png/128x128.png') }
if (os.platform() === 'win32') { var iguanaIcon = path.join(__dirname, '/assets/icons/iguana_app_icon.ico') }

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
let loadingWindow


function createLoadingWindow() {
  mainWindow = null;

  // initialise window
  loadingWindow = new BrowserWindow({width: 500, height: 300, frame: false, icon: iguanaIcon})

  // load our index.html (i.e. easyDEX GUI)
  loadingWindow.loadURL('http://127.0.0.1:17777/gui/');

  // DEVTOOLS - only for dev purposes - ca333
  //loadingWindow.webContents.openDevTools()

  // if window closed we kill iguana proc
  loadingWindow.on('closed', function () {
    // our app does not have multiwindow - so we dereference the window object instead of
    // putting them into an window_arr
    loadingWindow = null
    createWindow('open')
  })

  //ca333 todo - add os detector to use correct binary - so we can use the same bundle on ALL OS platforms
  if (os.platform() === 'win32') {
    process.chdir(iguanaDir);
    exec(iguanaWin, {cwd: iguanaDir}); //specify binary in startup
  }
  if (os.platform() === 'linux') {
    process.chdir(iguanaDir);
    ig = spawn(iguanaLinux);
  }
  if (os.platform() === 'darwin') {
    process.chdir(iguanaDir);
    ig = spawn(iguanaOSX);
  }

  if (os.platform() !== 'win32') { ig.stderr.on( 'error: ', data => { console.log( `stderr: ${data}` ); }); }
}

app.on('ready', createLoadingWindow)

function createWindow (status) {
  if ( status === 'open') {
    // initialise window
    mainWindow = new BrowserWindow({width: 1280, height: 800, icon: iguanaIcon})

    // load our index.html (i.e. easyDEX GUI)
    mainWindow.loadURL('http://127.0.0.1:17777/gui/EasyDEX-GUI/');

    // DEVTOOLS - only for dev purposes - ca333
    mainWindow.webContents.openDevTools()

    // if window closed we kill iguana proc
    mainWindow.on('closed', function () {
      if (os.platform() !== 'win32') { ig.kill(); }
      if (os.platform() === 'win32') {
        exec('TASKKILL /F /IM iguana.exe /T', {cwd: iguanaDir});
      }
      // our app does not have multiwindow - so we dereference the window object instead of
      // putting them into an window_arr
      mainWindow = null
      app.quit()
    });
  }
}

app.on('ready', function() {
  createLoadingWindow
})

app.on('window-all-closed', function () {
    //if (os.platform() !== 'win32') { ig.kill(); }
  // in osx apps stay active in menu bar until explictly closed or quitted by CMD Q
  // so we do not kill the app --> for the case user clicks again on the iguana icon
  // we open just a new window and respawn iguana proc
  /*if (process.platform !== 'darwin' || process.platform !== 'linux' || process.platform !== 'win32') {
    app.quit()
  }*/
})

app.on('activate', function () {
  if (mainWindow === null) {
    //createWindow('open');
  }
})