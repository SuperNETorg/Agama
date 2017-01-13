var fs = require('fs');
var request = require('request');
var progress = require('request-progress');
const path = require('path')
const url = require('url')
const os = require('os')
const sha256 = require('sha256')
Promise = require('bluebird');




PARAMS_DIR="$HOME/Library/Application Support/ZcashParams"

SPROUT_PKEY_NAME='sprout-proving.key'
SPROUT_PKEY_NAME_HASH='8bc20a7f013b2b58970cddd2e7ea028975c88ae7ceb9259a5344a16bc2c0eef7'
SPROUT_VKEY_NAME='sprout-verifying.key'
SPROUT_VKEY_NAME_HASH='4bd498dae0aacfd8e98dc306338d017d9c08dd0918ead18172bd0aec2fc5df82'
SPROUT_PKEY_URL="https://z.cash/downloads/$SPROUT_PKEY_NAME"
SPROUT_VKEY_URL="https://z.cash/downloads/$SPROUT_VKEY_NAME"

// The options argument is optional so you can omit it 
progress(request('https://az412801.vo.msecnd.net/vhd/VMBuild_20141027/VirtualBox/IE11/Windows/IE11.Win8.1.For.Windows.VirtualBox.zip'), {
    // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms 
    // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms 
    // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length 
})
.on('progress', function (state) {
    // The state is an object that looks like this: 
    // { 
    //     percent: 0.5,               // Overall percent (between 0 to 1) 
    //     speed: 554732,              // The download speed in bytes/sec 
    //     size: { 
    //         total: 90044871,        // The total payload size in bytes 
    //         transferred: 27610959   // The transferred payload size in bytes 
    //     }, 
    //     time: { 
    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals) 
    //         remaining: 81.403       // The remaining seconds to finish (3 decimals) 
    //     } 
    // } 
    console.log('progress', state);
})
.on('error', function (err) {
    // Do something with err 
})
.on('end', function () {
    // Do something after request finishes 
})
.pipe(fs.createWriteStream('IE11.Win8.1.For.Windows.VirtualBox.zip'));