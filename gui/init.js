$(document).ready(function() {
  const remote = require('electron').remote;
  var window = remote.getCurrentWindow();

  $('#pulse').jRoll({
    radius: 100,
    animation: 'pulse'
  });

  var appConf = GetAppConf();

  $('#loading_status_text').text('Starting Iguana daemon...');

  if (appConf && !appConf.manualIguanaStart) {
    StartIguana();
  }

  if (appConf && !appConf.skipBasiliskNetworkCheck) {
    var portcheck;

    function sartcheck() {
      portcheck = setInterval(function(){
        Iguana_activehandle().then(function(result){
          console.log(result);

          if (result !== 'error') {
            stopcheck();
            $('#loading_status_text').text('Connecting to Basilisk Network...');
            EDEX_DEXgetinfoAll();
          }
        })
        //var check = Iguana_activehandle();
        //console.log(check[0])
      }, 2000);
    }

    function stopcheck() {
      clearInterval(portcheck);
    }

    sartcheck();
    //setTimeout(function(){ window.close(); }, 15000);
  } else {
    window.hide();
  }
});
