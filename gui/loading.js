function IguanaAJAX(url, ajax_data) {
  return $.ajax({
    data: JSON.stringify(ajax_data),
    url: url,
    type: 'POST',
    dataType: 'json',
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
      //console.log(AjaxOutputData.responseText);
      AjaxOutputData = JSON.parse(AjaxOutputData.responseText)
      //console.log(AjaxOutputData);
      resolve(AjaxOutputData);
    }).fail(function(xhr, textStatus, error) {
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

function GetAppConf() { // get iguana app conf
  var ajax_data = { 'herd': 'iguana' },
      data = false;

  console.log(ajax_data);
  $.ajax({
    async: false,
    type: 'GET',
    url: 'http://127.0.0.1:17777/shepherd/appconf'
  }).done(function(_data) {
    console.log('== App Conf Data OutPut ==');
    console.log(_data);
    data = _data;
  }).fail(function(xhr, textStatus, error) {
    // handle request failures
    console.log(xhr.statusText);
    if ( xhr.readyState == 0 ) {
    }
    console.log(textStatus);
    console.log(error);
  });

  return data;
}

function EDEX_DEXnotarychains() {
  return new Promise((resolve) => {
    var ajax_data = {
      'agent': 'dpow',
      'method': 'notarychains'
    },
    AjaxOutputData = IguanaAJAX('http://127.0.0.1:7778', ajax_data).done(function(data) {
      //console.log(AjaxOutputData.responseText);
      AjaxOutputData = JSON.parse(AjaxOutputData.responseText);
      //console.log(AjaxOutputData);
      resolve(AjaxOutputData);
    }).fail(function(xhr, textStatus, error) {
      // handle request failures
      console.log(xhr.statusText);
      if ( xhr.readyState == 0 ) {
      }
      console.log(textStatus);
      console.log(error);
    });
  });
}

function EDEX_DEXgetinfoAll() {
    var tmpIguanaRPCAuth = 'tmpIgRPCUser@' + sessionStorage.getItem('IguanaRPCAuth'),
        ajax_data = {
          'userpass': tmpIguanaRPCAuth,
          'agent': 'dpow',
          'method': 'notarychains'
        },
        tmp_index = 0,
        get_dex_notarychains = IguanaAJAX('http://127.0.0.1:7778', ajax_data).done(function(data) {
          //console.log(get_dex_notarychains.responseText);
          get_dex_notarychains = JSON.parse(get_dex_notarychains.responseText);
          //console.log(get_dex_notarychains)

          $.each(get_dex_notarychains, function( coin_index, coin_value ) {
            console.log(coin_index + ': ' + coin_value);
            var tmpIguanaRPCAuth = 'tmpIgRPCUser@' + sessionStorage.getItem('IguanaRPCAuth'),
                ajax_data = {
                  'userpass': tmpIguanaRPCAuth,
                  'agent': 'dex',
                  'method': 'getinfo',
                  'symbol': coin_value
                },
                basiliskMinNotariesConnected = 10;
            
            console.log(ajax_data);

            if (coin_value !== 'MESH' || coin_value !== 'CEAL') {
              var getinfo_each_chain = IguanaAJAX('http://127.0.0.1:7778', ajax_data).done(function(data) {
                getinfo_each_chain = JSON.parse(getinfo_each_chain.responseText);
                console.log(getinfo_each_chain);
                
                tmp_index = parseInt(coin_index) + 1;
                $('#loading_sub_status_text').text('Connection status... ' + tmp_index + '/' + get_dex_notarychains.length + ': ' + coin_value);
                
                if (getinfo_each_chain.error === 'less than required responses') {
                  $('#loading_sub_status_output_text').text('Output: ' + getinfo_each_chain.error);
                } else {
                  $('#loading_sub_status_output_text').text('Output: Connected');
                }

                if ( tmp_index == 10 ) {
                  console.log('min notaries connected');
                  const remote = require('electron').remote;
                  var window = remote.getCurrentWindow();                   
                  window.hide();
                }
              }).fail(function(xhr, textStatus, error) {
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
}