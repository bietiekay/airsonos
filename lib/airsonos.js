let Promise = require('bluebird');
let sonos = require('sonos');
let DeviceTunnel = require('./tunnel');

class AirSonos {

  constructor(options) {
    this.tunnels = {};
    this.options = options || {};
    this.setupDevices = this.setupDevices.bind(this);
  }

  get searchForDevices() {
    return Promise.promisify(sonos.LogicalDevice.search);
  }

  setupDevices(devices) {

    let promises = devices.map((device) => {
      return DeviceTunnel.createFor(device, this.options).then((tunnel) => {

        tunnel.on('error', function(err) {
          if (err.code === 415) {
            console.error('Warning!', err.message);
            console.error('AirSonos currently does not support codecs used by applications such as iTunes or AirFoil.');
            console.error('Progress on this issue: https://github.com/stephen/nodetunes/issues/1');
          } else {
            console.error('Unknown error:');
            console.error(err);
          }
        });

        tunnel.start();
        this.tunnels[tunnel.device.groupId] = tunnel;

        return tunnel;
      })
    })

    return Promise.all(promises);
  }

  start(devices) {
    if (devices) {
      return this.setupDevices(devices)
    } else {
      return this.searchForDevices().then(this.setupDevices);
    }
  }

  refresh() {
    return this.searchForDevices().then((devices) => {
      // remove old groups
      // add new groups
      // update existing groups with new configurations
    });
  }

  stop() {
    return Promise.all(this.tunnels.map(tunnel.stop));
  }
}

module.exports = AirSonos;
