//SuperNET iguana app launcher

//var exec = require('child_process').exec
//exec does not return obj with stream but instead the whole buffer output from proc
//spawn returns objects with stderr and out streams
//for question contact ca333@keemail.me

const spawn = require('child_process').spawn;
var iguana = path.join(__dirname, '/assets/iguana/iguana');
//var os = require('os');
