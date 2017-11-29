module.exports = (shepherd) => {
  // payload
  // record all calls
  shepherd.get('/mm/request', (req, res, next) => {
    const successObj = {
      msg: 'success',
      result: 'started',
    };

    res.end(JSON.stringify(successObj));
  });

  return shepherd;
};