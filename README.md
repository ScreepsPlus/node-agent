# ScreepsPlus node agent

[![NPM info](https://nodei.co/npm/screepsplus-agent.png?downloads=true)](https://npmjs.org/package/screepsplus-agent)

[![Circle CI](https://circleci.com/gh/ScreepsPlus/node-agent.svg?style=shield)](https://circleci.com/gh/ScreepsPlus/node-agent)

## Requirements
Node.js 6+ 

## Setup

### Prerequisites

1. Token from [ScreepsPl.us](https://screepspl.us/agent)
2. Screeps Login info
3. Node + NPM

### NPM

```
npm install -g screepsplus-agent
screepsplus-agent
```

### Manual

1. Download
2. Configure with config.js
3. `npm install`
4. `node app.js`

### Docker

To use with docker, just do the following:
```
docker build -t screepsplus-agent .
docker run -d -v $(pwd):/config/ --restart=always --name screepsplus-agent screepsplus-agent
```

### Docker-compose
A docker-compose.yml is included.

### Config Methods
It is now possible to use the console to output stats, just set method to 'console' in config.js
and use `console.log('STATS;'+formattedStats)`

For this to work, type based format is REQUIRED

NOTE: you should use `';'` instead of newLine (`"\n"`) as a delimiter

## Stat formats supported by ScreepsPl.us:

### Memory.stats object

The usual grafana data format
```
{
  rooms: {
  	W0N0:{
  		level:2
  	}
  }
}
```

### Type based format 

This is a more advanced system that allows you to send raw stats pre-formatted.
There should always be a 3 line header, 
```
type
tick
time
```
followed by the raw stat data

For ScreepsPl.us, type can be one of 3 values: 'text/grafana' 'text/influxdb' 'application/json'

Where `application/json` inserts into graphite.

#### text/grafana Format

1 stat per line: `stat value`

EX: `room.W0N0.level 5`

#### text/influxdb Format

1 stat per line: `stat[,tag1=value,tag2=value,...] key=value[,key=value,...]`

EX: `room,name=W0N0 level=5,energy=300,energyCapacity=300`

NOTE: as of this writing this README, influxdb support is enabled, but cannot be accessed without requesting influxdb credentials
