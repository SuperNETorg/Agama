const formatBytes = (bytes, decimals) => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1000;
  const dm = (decimals + 1) || 3;
  const sizes = [
    'Bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB'
  ];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

module.exports = (shepherd) => {
  shepherd.SystemInfo = () => {
    const os_data = {
      'totalmem_bytes': shepherd.os.totalmem(),
      'totalmem_readable': formatBytes(shepherd.os.totalmem()),
      'arch': shepherd.os.arch(),
      'cpu': shepherd.os.cpus()[0].model,
      'cpu_cores': shepherd.os.cpus().length,
      'platform': shepherd.os.platform(),
      'os_release': shepherd.os.release(),
      'os_type': shepherd.os.type(),
    };

    return os_data;
  }

  shepherd.appInfo = () => {
    const sysInfo = shepherd.SystemInfo();
    const releaseInfo = shepherd.appBasicInfo;
    const dirs = {
      agamaDir: shepherd.agamaDir,
      komodoDir: shepherd.komodoDir,
      komododBin: shepherd.komododBin,
      configLocation: `${shepherd.agamaDir}/config.json`,
      cacheLocation: `${shepherd.agamaDir}/shepherd`,
    };

    return {
      sysInfo,
      releaseInfo,
      dirs,
      appSession: shepherd.appSessionHash,
    };
  }

  /*
   *  type: GET
   *
   */
  shepherd.get('/sysinfo', (req, res, next) => {
    const obj = shepherd.SystemInfo();
    res.send(obj);
  });

  /*
   *  type: GET
   *
   */
  shepherd.get('/appinfo', (req, res, next) => {
    const obj = shepherd.appInfo();
    res.send(obj);
  });

  return shepherd;
};