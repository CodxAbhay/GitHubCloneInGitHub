function bracket(tag, colorCode) {
  return `\x1b[2m[\x1b[0m${colorCode}${tag}\x1b[0m\x1b[2m]\x1b[0m`;
}

module.exports = {
  info: (msg) => console.log(`\x1b[36m→\x1b[0m ${msg}`),
  ok:   (msg) => console.log(`${bracket("ok",  "\x1b[32m")} ${msg}`),
  step: (msg) => console.log(`${bracket("agh", "\x1b[35m")} ${msg}`),
  warn: (msg) => console.log(`\x1b[33mwarning:\x1b[0m ${msg}`),
  err:  (msg) => console.error(`\x1b[31merror:\x1b[0m ${msg}`),
  dim:  (msg) => console.log(`\x1b[2m${msg}\x1b[0m`),
};
