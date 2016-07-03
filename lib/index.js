#!/usr/bin/env node

require("babel/polyfill");

let DeviceTunnel = require('./tunnel');
let flags = require('flags');
let AirSonos = require('./airsonos');
let sonos = require('sonos');

flags.defineBoolean('diagnostics', false, 'run diagnostics utility');
flags.defineBoolean('version', false, 'return version number');
flags.defineInteger('timeout', 5, 'disconnect timeout (in seconds)');
flags.defineBoolean('verbose', false, 'show verbose output');
flags.defineStringList('devices', [], 'a comma separated list of IP[:port] values where Sonos devices can be found, disables discovery');
flags.parse();

if (flags.get('version')) {

  let pjson = require('../package.json');
  console.log(pjson.version);

} else if (flags.get('diagnostics')) {

  let diag = require('../lib/diagnostics');
  diag();

} else if (flags.get('devices').length > 0) {
  let deviceArguments = flags.get('devices');
  let devices = deviceArguments.map(arg => {
    let [ip, port] = arg.split(':');
    if (port) {
      return new sonos.Sonos(ip, port);
    }
    return new sonos.Sonos(arg);
  })

  let instance = new AirSonos({
    verbose: flags.get('verbose'),
    timeout: flags.get('timeout'),
  });

  instance.start(devices).then((tunnels) => {

    tunnels.forEach((tunnel) => {
      console.log(`${ tunnel.deviceName } (@ ${ tunnel.device.host }:${ tunnel.device.port }, ${ tunnel.device.groupId })`);
    });

    const plural = tunnels.length === 1 ? '' : 's';
    console.log(`\nDevice${plural} found. Set up ${ tunnels.length } device tunnel${plural}.`);
  }).done();

} else {

  console.log('Searching for Sonos devices on network...\n');

  let instance = new AirSonos({
    verbose: flags.get('verbose'),
    timeout: flags.get('timeout'),
  });

  instance.start().then((tunnels) => {

    tunnels.forEach((tunnel) => {
      console.log(`${ tunnel.deviceName } (@ ${ tunnel.device.host }:${ tunnel.device.port }, ${ tunnel.device.groupId })`);
    });

    console.log(`\nSearch complete. Set up ${ tunnels.length } device tunnel${ tunnels.length === 1 ? '' : 's' }.`);
  }).done();

}
