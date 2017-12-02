const request = require('request');

module.exports = (shepherd) => {
  // payload
  // record all calls
  shepherd.post('/mm/request', (req, res, next) => {
    let _payload = req.body.payload;
    _payload.userpass = shepherd.mmupass;
    const options = {
      url: `http://localhost:7783`,
      method: 'POST',
      body: JSON.stringify(_payload),
    };

    shepherd.log(_payload);

    // send back body on both success and error
    // this bit replicates iguana core's behaviour
    request(options, (error, response, body) => {
      if (response &&
          response.statusCode &&
          response.statusCode === 200) {
        const _parsedBody = JSON.parse(body);
        shepherd.mmPublic[_payload.mapToProp] = _parsedBody;
        res.end(body);
      } else {
        res.end(body ? body : JSON.stringify({
          result: 'error',
          error: {
            code: -777,
            message: `unable to call method ${_payload.method} at port 7783`,
          },
        }));
      }
    });
  });

  return shepherd;
};