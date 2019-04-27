const gpsd = require('node-gpsd')

class GPSDWarDriver {

    constructor(gpsdPort, gpsSerialDevice) {
        
        this._lastLocation = this._emptyLocation()

        this._daemon = new gpsd.Daemon({
            program: 'gpsd',
            device: gpsSerialDevice,
            port: gpsdPort,
            pid: '/tmp/gpsd.pid',
            readOnly: false,
            logger: {
                info: (m) => console.log(`[info]: gpsd: ${m}`),
                warn: (m) => console.log(`[warning]: gpsd: ${m}`),
                error: (m) => console.log(`[error]: gpsd: ${m}`),
            }
        });

        console.log(`[verbose]: gpsd: starting GPS daemon on port ${gpsdPort} using device ${gpsSerialDevice}`)
        
                
        this._daemon.on('died', ()=> {
            console.log('[info]: gpsd: GPS daemon has died')
        })

        this._daemon.start(() => {

            console.log('[info]: gpsd: started GPS daemon')
            this._listener = new gpsd.Listener({
                port: gpsdPort,
                hostname: 'localhost',
                logger: {
                    info: (m) => console.log(`[info]: gpsd listener: ${m}`),
                    warn: (m) => console.warn(`[warning]: gpsd listener: ${m}`),
                    error: (m) => console.error(`[error]: gpsd listener: ${m}`)
                },
                parse: true
            })

            this._listener.connect(() => {
                
                console.log('[info]: gpsd listener: connected to gpsd.')
                this._listener.watch({ 
                    class: 'WATCH', 
                    json: true, 
                    enable: true, 
                    nmea: false, 
                    pps: true
                })

                console.log('[info]: gpsd listener: sent WATCH event to gpsd')    
                this._listener.on('WATCH', (event) => {
                    console.log('[info]: gpsd listener: received WATCH event from gpsd')
                })

                // http://www.catb.org/gpsd/gpsd_json.html
                this._listener.on('SKY', (event) => {
                    const numSats = event.satellites.length
                    console.log(`[verbose]: gpsd listener: in view of ${numSats} satellites`)
                })

                let locationTimeout = null
                this._listener.on('TPV', (event) => {
                    if (event.lat && event.lon) {
                        clearTimeout(locationTimeout)
                        console.log(`[verbose]: gpsd listener: received location data ${event.lat}, ${event.lon}`)
                        this._lastLocation = {
                            lat: event.lat,
                            long: event.lon,
                            time: Date.now()
                        }
                        locationTimeout = setTimeout(() => {
                            this._lastLocation = this._emptyLocation()
                        }, 10 * 1000)
                    }
                })

                //// set `parse: false` in the gpsd.Listener() constructor to receive
                //// raw events like this
                // this._listener.on('raw', (event) => {
                //     console.log('received event')
                //     console.log(event)
                // })
            })
        })
    }

    network2WigleData(network) {
        const loc = getLocation()
        return {
            netid: network.mac,
            ssid: network.ssid,
            lastupdt: network.lastSeen,
            trilat: loc.lat,
            trilong: loc.long
        }
    }

    getLocation() {
        return this._lastLocation
    }

    _emptyLocation() {
        return {
            lat: null,
            long: null,
            time: null
        }
    }

    kill(cb) {
        this._daemon.stop(cb)
    }
}

module.exports = {
	GPSDWarDriver
}