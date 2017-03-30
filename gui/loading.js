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

function Iguana_activehandle(callback) {
  return new Promise((resolve) => {
    var ajax_data = {
          'agent': 'SuperNET',
          'method': 'activehandle'
        },
        AjaxOutputData = IguanaAJAX('http://127.0.0.1:7778', ajax_data).done(function(data) {
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

function GetAppConf(cb) { // get iguana app conf
  var ajax_data = { 'herd': 'iguana' },
      data = false;

  console.log(ajax_data);
  $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:17777/shepherd/appconf'
  })
  .done(function(_data) {
    console.log('== App Conf Data OutPut ==');
    console.log(_data);
    data = _data;
    cb.call(this, data);
  })
  .fail(function(xhr, textStatus, error) {
    // handle request failures
    console.log(xhr.statusText);
    if ( xhr.readyState == 0 ) {
    }
    console.log(textStatus);
    console.log(error);
    cb.call(this, data);
  });

  return data;
}

function EDEX_DEXnotarychains() {
  return new Promise((resolve) => {
    var ajax_data = {
      'agent': 'dpow',
      'method': 'notarychains'
    },
    AjaxOutputData = IguanaAJAX('http://127.0.0.1:' + config.iguanaPort, ajax_data).done(function(data) {
      //console.log(AjaxOutputData.responseText);
      AjaxOutputData = JSON.parse(AjaxOutputData.responseText);
      //console.log(AjaxOutputData);
      resolve(AjaxOutputData);
    })
    .fail(function(xhr, textStatus, error) {
      // handle request failures
      console.log(xhr.statusText);
      if ( xhr.readyState == 0 ) {
      }
      console.log(textStatus);
      console.log(error);
    });
  });
}

function EDEX_DEXgetinfoAll(skip, minNotaries) {
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
        get_dex_notarychains = IguanaAJAX('http://127.0.0.1:' + config.iguanaPort, ajax_data, 10000).done(function(data) {
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
              var getinfo_each_chain = IguanaAJAX('http://127.0.0.1:' + config.iguanaPort, ajax_data).done(function(data) {
                getinfo_each_chain = JSON.parse(getinfo_each_chain.responseText);
                console.log(getinfo_each_chain);

                tmp_index = parseInt(coin_index) + 1;
                $('#loading_sub_status_text').text('Connection status... ' + tmp_index + '/' + get_dex_notarychains.length + ': ' + coin_value);

                if (getinfo_each_chain.error === 'less than required responses') {
                  $('#loading_sub_status_output_text').text('Output: ' + getinfo_each_chain.error);
                } else {
                  $('#loading_sub_status_output_text').text('Output: Connected');
                }

                if ( tmp_index == minNotaries ) {
                  console.log('min notaries connected');
                  window.createWindow('open');
                  window.hide();
                }
              })
              .fail(function(xhr, textStatus, error) {
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