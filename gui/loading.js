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




$(document).ready( function() {
    //var check = Iguana_activehandle();
    //console.log(check[0]) // here I invoke the checking function
    const remote = require('electron').remote;
    var window = remote.getCurrentWindow();

    StartIguana();
    
    var portcheck;
    function sartcheck() {
        portcheck = setInterval(function(){
            var check = Iguana_activehandle();
            console.log(check[0])
            if (check[0] !== 'error') {
                stopcheck();
                window.close();
            }
        },2000);
    }

    function stopcheck() {
        clearInterval(portcheck);
    }
    sartcheck();
    //setTimeout(function(){ window.close(); }, 15000);
});