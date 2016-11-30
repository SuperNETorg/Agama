//main proc for EasyDEX GUI
//this app spawns iguana in background in nontech-mode

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow


const path = require('path')
const url = require('url')
const os = require('os')
//require('./assets/js/iguana.js'); //below code shall be separated into asset js for public version
const spawn = require('child_process').spawn;
var iguanaOSX = path.join(__dirname, '/assets/iguana/iguana');
var iguanaLinux = path.join(__dirname, '/assets/iguana/iguanaLinux');
var iguanaWin = path.join(__dirname, '/assets/iguana/iguana');


let mainWindow

function createWindow () {

  // initialise window
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // load our index.html (i.e. easyDEX GUI)
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'EasyDEX-GUI/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // DEVTOOLS - only for dev purposes - ca333
  mainWindow.webContents.openDevTools()

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
  ig = spawn(iguanaLinux);
  }
  if (os.platform() === 'darwin') {
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
