var app = require('http').createServer(handler),
    io = require('socket.io')(app),
    fs = require('fs'),
    request = require('request'),
    progress = require('request-progress');
const path = require('path'),
      url = require('url'),
      os = require('os'),
      sha256 = require('sha256'),
      crypto = require('crypto');

Promise = require('bluebird');

app.listen(3000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
}

if (os.platform() === 'darwin') {
  var PARAMS_DIR = process.env.HOME + '/Library/Application Support/ZcashParams';
}
if (os.platform() === 'linux') {
  var PARAMS_DIR = process.env.HOME + '/.zcash-params';
}

var SPROUT_FILES_DATA = [
  { 
    'file': 'sprout-proving.key',
    'hash': '8bc20a7f013b2b58970cddd2e7ea028975c88ae7ceb9259a5344a16bc2c0eef7'
  }, {
    'file': 'sprout-verifying.key',
    'hash': '4bd498dae0aacfd8e98dc306338d017d9c08dd0918ead18172bd0aec2fc5df82'
  }
];
var SPROUT_DL_URL = 'https://z.cash/downloads/';

SPROUT_FILES_DATA.forEach(function(value, index) {
  fs.exists(value.file, function(exists) {
    if (exists) {
      console.log(value.file + ' already exists at location.');

      var tmphas,
          fd = fs.createReadStream(value.file),
          hash = crypto.createHash('sha256');
      
      hash.setEncoding('hex');

      fd.on('end', function() {
        hash.end();
        
        console.log('hash is: ');
        console.log(hash.read()); // the desired sha1sum
        console.log(value.hash);
        
        tmphash = hash.read();
        if (hash.read() === value.hash) {
          console.log('File SHA256 sum matches.');
        } else {
          console.log('File SHA256 sum does not match.');
        }
      });
      // read all file and pipe it (write it) to the hash object
      fd.pipe(hash);
    } else {
      var DLFile = function() {
        return new Promise(function(resolve, reject) {
          console.log('file not there.');

          progress(request(SPROUT_DL_URL + value.file), {})
          .on('progress', function (state) {
            console.log('progress', state);
          })
          .on('error', function (err) {
            console.log(err);
          })
          .on('end', function () {
            // Do something after request finishes 
            console.log('download finished.');
            var result = 'File ==> ' + value.file + ': DOWNLOADED';
          })
          .pipe(fs.createWriteStream(value.file));

          console.log(result);
          resolve(result);
        })
      }
      var CheckFileSHA = function() {
        return new Promise(function(resolve, reject) {
          var fd = fs.createReadStream(value.file),
              hash = crypto.createHash('sha256');
          
          hash.setEncoding('hex');

          fd.on('end', function() {
            hash.end();

            console.log('hash is: ');
            console.log(hash.read()); // the desired sha1sum
            console.log(value.hash);
            
            if (hash.read() === value.hash) {
              console.log('File SHA256 sum matches.');
            } else {
              console.log('File SHA256 sum does not match.');
            }
          });
          // read all file and pipe it (write it) to the hash object
          fd.pipe(hash);

          var result = 'SHA256 SUM Check: DONE';

          console.log(result);
          resolve(result);
        });
      }

      DLFile()
      .then(function(result) { 
        return CheckFileSHA();
      });
    }
  });
});

function CheckSHASum(file, hashstr) {
  console.log(hashstr);
  var shasum;
  
  // the file you want to get the hash
  if (shasum === hashstr ) {
    return true;
  } else {
    return false;
  }
}

/*var CheckFileExists = function() {

    return new Promise(function(resolve, reject) {
        
        if (path.existsSync('foo.txt')) {}
        var result = 'Connecting To Pm2: done'

        console.log(result)
        resolve(result);
    })
}

var DLFile = function() {

    return new Promise(function(resolve, reject) {
        var result = 'Killing Pm2: done'

        setTimeout(function() {
            console.log(result)
            resolve(result);
        }, 2000)
    })
}

var CheckSHASum = function() {

    return new Promise(function(resolve, reject) {
        var result = 'Hiding Main Window: done'

        console.log(result)
        resolve(result);
    })
}

var MoveFile = function() {

    return new Promise(function(resolve, reject) {
        var result = 'Quiting App: done'

        console.log(result)
        resolve(result);
    })
}

ConnectToPm2()
.then(function(result) { 
    return KillPm2();
})
.then(HideMainWindow)
.then(QuitApp)
*/