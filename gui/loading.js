function Iguana_activehandle() {    
    var result = [];
    //comment
    var ajax_data = {"agent":"SuperNET","method":"activehandle"};
    //console.log(ajax_data);
    $.ajax({
        async: false,
        type: 'POST',
        data: JSON.stringify(ajax_data),
        url: 'http://127.0.0.1:7778',
        //dataType: 'text',
        success: function(data, textStatus, jqXHR) {
            var AjaxOutputData = JSON.parse(data);
            //console.log('== ActiveHandle Data OutPut ==');
            //console.log(AjaxOutputData);
            result.push(AjaxOutputData);
        },
        error: function(xhr, textStatus, error) {
            console.log(xhr.statusText);
            if ( xhr.readyState == 0 ) {
                //Iguana_ServiceUnavailable();
                result.push('error')
            }
            console.log(textStatus);
            console.log(error);
        }
    });
    //return 'Executed Iguana_activehandle. Check Iguana_activehandle_output var value.';
    return result;
}

function StartIguana() {
    var ajax_data = {"herd":"iguana"};
    console.log(ajax_data);
    $.ajax({
        async: false,
        type: 'POST',
        data: JSON.stringify(ajax_data),
        url: 'http://127.0.0.1:17777/shepherd/herd',
        dataType: "xml/html/script/json", // expected format for response
        contentType: "application/json", // send as JSON
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

function EDEX_DEXnotarychains() {
    var result = [];

    var tmpIguanaRPCAuth = 'tmpIgRPCUser@'+sessionStorage.getItem('IguanaRPCAuth');
    var ajax_data = {'userpass':tmpIguanaRPCAuth,"agent":"dpow","method":"notarychains"}
    console.log(ajax_data);
    $.ajax({
        async: false,
        type: 'POST',
        data: JSON.stringify(ajax_data),
        url: 'http://127.0.0.1:7778',
        //dataType: 'text',
        success: function(data, textStatus, jqXHR) {
            var AjaxOutputData = JSON.parse(data);
            //console.log('== EDEX_DEXnotarychains Data OutPut ==');
            //console.log(AjaxOutputData);
            result.push(AjaxOutputData);
        },
        error: function(xhr, textStatus, error) {
            console.log(xhr.statusText);
            if ( xhr.readyState == 0 ) {
                Iguana_ServiceUnavailable();
            }
            console.log(textStatus);
            console.log(error);
        }
    });
    //console.log(result);
    return result[0];
}


function EDEX_DEXgetinfoAll() {
    var result = [];
    var ajax_data = '';
    var tmpIguanaRPCAuth = 'tmpIgRPCUser@'+sessionStorage.getItem('IguanaRPCAuth');

    var get_dex_notarychains = EDEX_DEXnotarychains();
    console.log(get_dex_notarychains.length)
    
    $.each(get_dex_notarychains, function( coin_index, coin_value ) {
        console.log(coin_index + ': ' + coin_value);
        var ajax_data = {'userpass':tmpIguanaRPCAuth,"agent":"dex","method":"getinfo","symbol":coin_value}
        console.log('==> ajax_data')
        console.log(ajax_data);
        $.ajax({
            //async: false,
            type: 'POST',
            data: JSON.stringify(ajax_data),
            url: 'http://127.0.0.1:7778',
            //dataType: 'text',
            success: function(data, textStatus, jqXHR) {
                var AjaxOutputData = JSON.parse(data); //Ajax output gets the whole list of unspent coin with addresses
                //console.log('== EDEX_DEXgetinfoAll Data OutPut ==');
                console.log(AjaxOutputData);
                result.push(AjaxOutputData);
                var tmp_index = parseInt(coin_index) + 1
                $('#loading_sub_status_text').text('Connection status... ' + tmp_index + '/' + get_dex_notarychains.length + ': ' + coin_value)
                if (AjaxOutputData.error === 'less than required responses') {
                    $('#loading_sub_status_output_text').text('Output: ' + AjaxOutputData.error)
                } else {
                    $('#loading_sub_status_output_text').text('Output: Connected')
                }
                if ( tmp_index == 50 ) {
                    window.close();
                }
            },
            error: function(xhr, textStatus, error) {
                console.log(xhr.statusText);
                if ( xhr.readyState == 0 ) {
                }
                console.log(textStatus);
                console.log(error);
            }
        });
    });

    //console.log(result);
    return result[0];
}