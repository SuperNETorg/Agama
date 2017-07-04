  function closeMainWindow() {
    const remote = require('electron').remote;
    var window = remote.getCurrentWindow();

    window.createWindow('open');
    window.hide();
  }

  function normalStart() {
    const remote = require('electron').remote;
    var appConf = remote.getCurrentWindow().appConfig;
    appConf.iguanaLessMode = false;

    // run iguana-less mode with no daemons startup
    if (appConf && appConf.iguanaLessMode) {
      // do something
    } else { // run normal mode with 2 iguana instances started prior loading GUI
      if (appConf && !appConf.manualIguanaStart) {
        StartIguana();
      }

      var portcheck;

      function startcheck() {
        portcheck = setInterval(function() {
          Iguana_activehandle(appConf).then(function(result){
            console.log(result);

            if (result !== 'error') {
              stopcheck();

              if (appConf && appConf.useBasiliskInstance) {
                StartIguana_Cache();
              }

              $('#loading_status_text').text('Connecting to Basilisk Network...');
              EDEX_DEXgetinfoAll(appConf.skipBasiliskNetworkCheck, appConf.minNotaries, appConf);
            }
          })
        }, 2000);
      }

      function stopcheck() {
        clearInterval(portcheck);
      }

      startcheck();
    }
  }

function IguanaAJAX(url, ajax_data, timeout) {
  return $.ajax({
    data: JSON.stringify(ajax_data),
    url: url,
    type: 'POST',
    dataType: 'json',
    timeout: timeout ? timeout : 120000
    //beforeSend: showLoadingImgFn
  })
  .fail(function(xhr, textStatus, error) {
    // handle request failures
  });
}

function Iguana_activehandle(appConf) {
  return new Promise((resolve) => {
    var ajax_data = {
          'agent': 'SuperNET',
          'method': 'activehandle'
        },
        AjaxOutputData = IguanaAJAX('http://127.0.0.1:' + appConf.iguanaCorePort, ajax_data).done(function(data) {
          //$('#loading_status_text').text('Retrieving active handle...');
          //console.log(AjaxOutputData.responseText);
          AjaxOutputData = JSON.parse(AjaxOutputData.responseText)
          //console.log(AjaxOutputData);
          resolve(AjaxOutputData);
        })
        .fail(function(xhr, textStatus, error) {
         // $('#loading_status_text').text('Retrieving active handle error!');
          // handle request failures
          console.log(xhr.statusText);
          if ( xhr.readyState == 0 ) {
          }
          console.log(textStatus);
          console.log(error);
        });
  });
}
//Iguana_activehandle().then(function(result){
    //console.log(result)
//})

function StartIguana() {
  var ajax_data = { 'herd': 'iguana'};

  console.log(ajax_data);
  $('#agamaModeStatus').text('Starting main iguana instance...');

  $.ajax({
    type: 'POST',
    data: JSON.stringify(ajax_data),
    url: 'http://127.0.0.1:17777/shepherd/herd',
    dataType: 'xml/html/script/json', // expected format for response
    contentType: 'application/json', // send as JSON
    success: function(data, textStatus, jqXHR) {
      var AjaxOutputData = JSON.parse(data);
      console.log('== ActiveHandle Data OutPut ==');
      console.log(AjaxOutputData);
    },
    error: function(xhr, textStatus, error) {
      console.log(xhr.statusText);
      if ( xhr.readyState == 0 ) {
      }
      console.log(textStatus);
      console.log(error);
    }
  });
}

function StartIguana_Cache() {
  $('#agamaModeStatus').text('Starting basilisk iguana instance...');

  var ajax_data = {
    'mode': 'basilisk',
    'coin': 'all'
  };
  var start_iguana_cache= $.ajax({
      type: 'POST',
      data: JSON.stringify(ajax_data),
      url: 'http://127.0.0.1:17777/shepherd/forks',
      contentType: 'application/json', // send as JSON
    })
  start_iguana_cache.done(function(data) {
    _data = JSON.parse(data);
    console.log(_data.result);
    sessionStorage.setItem('IguanaCachePort', _data.result);
  });
}

function EDEX_DEXgetinfoAll(skip, minNotaries, appConf) {
  const remote = require('electron').remote;
  var window = remote.getCurrentWindow();

  if (!skip) {
    var tmpIguanaRPCAuth = 'tmpIgRPCUser@' + sessionStorage.getItem('IguanaRPCAuth'),
        ajax_data = {
          'userpass': tmpIguanaRPCAuth,
          'agent': 'dpow',
          'method': 'notarychains'
        },
        tmp_index = 0,
        tmp_index_failed = 0,
        get_dex_notarychains = IguanaAJAX('http://127.0.0.1:' + appConf.iguanaCorePort, ajax_data, 10000).done(function(data) {
          get_dex_notarychains = JSON.parse(get_dex_notarychains.responseText);
          if (minNotaries > get_dex_notarychains.length) { // if config value exceeds total num of notaries
            minNotaries = get_dex_notarychains.length;
          }
          get_dex_notarychains = get_dex_notarychains.splice(0, minNotaries);

          $.each(get_dex_notarychains, function( coin_index, coin_value ) {
            console.log(coin_index + ': ' + coin_value);
            var tmpIguanaRPCAuth = 'tmpIgRPCUser@' + sessionStorage.getItem('IguanaRPCAuth'),
                ajax_data = {
                  'userpass': tmpIguanaRPCAuth,
                  'agent': 'dex',
                  'method': 'getinfo',
                  'symbol': coin_value
                };

            console.log(ajax_data);

            if (coin_value !== 'MESH' || coin_value !== 'CEAL') {
              var getinfo_each_chain = IguanaAJAX('http://127.0.0.1:' + appConf.iguanaCorePort, ajax_data, 10000).done(function(data) {
                getinfo_each_chain = JSON.parse(getinfo_each_chain.responseText);
                console.log(getinfo_each_chain);

                tmp_index++;
                $('#loading_sub_status_text').text('Connection status... ' + tmp_index + '/' + get_dex_notarychains.length + ': ' + coin_value);

                if (getinfo_each_chain.error === 'less than required responses') {
                  $('#loading_sub_status_output_text').text('Output: ' + getinfo_each_chain.error);
                } else {
                  $('#loading_sub_status_output_text').text('Output: Connected');
                }

                if ( tmp_index + tmp_index_failed === minNotaries ) {
                  console.log('min notaries connected');
                  window.createWindow('open');
                  window.hide();
                }
              })
              .fail(function(xhr, textStatus, error) {
                tmp_index_failed++;

                if ( tmp_index + tmp_index_failed === minNotaries ) {
                  console.log('min notaries connected');
                  window.createWindow('open');
                  window.hide();
                }

                // handle request failures
                console.log(xhr.statusText);
                if ( xhr.readyState == 0 ) {
                }
                console.log(textStatus);
                console.log(error);
              });
            }
          });
        });
  } else {
    window.createWindow('open');
    window.hide();
  }
}