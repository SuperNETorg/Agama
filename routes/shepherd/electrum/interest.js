module.exports = (shepherd) => {
  shepherd.kmdCalcInterest = (locktime, value) => { // value in sats
    const timestampDiff = Math.floor(Date.now() / 1000) - locktime - 777;
    const hoursPassed = Math.floor(timestampDiff / 3600);
    const minutesPassed = Math.floor((timestampDiff - (hoursPassed * 3600)) / 60);
    const secondsPassed = timestampDiff - (hoursPassed * 3600) - (minutesPassed * 60);
    let timestampDiffMinutes = timestampDiff / 60;
    let interest = 0;

    shepherd.log('kmdCalcInterest', true);
    shepherd.log(`locktime ${locktime}`, true);
    shepherd.log(`minutes converted ${timestampDiffMinutes}`, true);
    shepherd.log(`passed ${hoursPassed}h ${minutesPassed}m ${secondsPassed}s`, true);

    // calc interest
    if (timestampDiffMinutes >= 60) {
      if (timestampDiffMinutes > 365 * 24 * 60) {
        timestampDiffMinutes = 365 * 24 * 60;
      }
      timestampDiffMinutes -= 59;

      shepherd.log(`minutes if statement ${timestampDiffMinutes}`, true);

      // TODO: check if interest is > 5% yr
      // calc ytd and 5% for 1 yr
      // const hoursInOneYear = 365 * 24;
      // const hoursDiff = hoursInOneYear - hoursPassed;

      interest = ((Number(value) * 0.00000001) / 10512000) * timestampDiffMinutes;
      shepherd.log(`interest ${interest}`, true);
    }

    return interest;
  }

  return shepherd;
};