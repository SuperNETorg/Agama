$(document).ready(function() {
  const remote = require('electron').remote;
  var window = remote.getCurrentWindow();

  $('#pulse').jRoll({
    radius: 100,
    animation: 'pulse'
  });

  $('#loading_status_text').text('Starting Iguana daemon...');

  GetAppConf(inititalWalletLoading);

  function inititalWalletLoading(appConf) {
    if (appConf && !appConf.manualIguanaStart) {
      StartIguana();
    }

    var portcheck;

    function startcheck() {
      portcheck = setInterval(function(){
        Iguana_activehandle(appConf).then(function(result){
          console.log(result);

          if (result !== 'error') {
            stopcheck();

            if (appConf && appConf.forks && appConf.forks.basilisk) {
              StartIguana_Cache();
            }

            $('#loading_status_text').text('Connecting to Basilisk Network...');
            EDEX_DEXgetinfoAll(appConf.skipBasiliskNetworkCheck, appConf.minNotaries, appConf);
          }
        })
        //var check = Iguana_activehandle();
        //console.log(check[0])
      }, 2000);
    }

    function stopcheck() {
      clearInterval(portcheck);
    }

    startcheck();
  }
});