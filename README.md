# ScreepsPlus node agent

[![NPM info](https://nodei.co/npm/screepsplus-agent.png?downloads=true)](https://npmjs.org/package/screepsplus-agent)

[![Circle CI](https://circleci.com/gh/ScreepsPlus/node-agent.svg?style=shield)](https://circleci.com/gh/ScreepsPlus/node-agent)

## Requirements
Node.js 8+ 

## Setup

### Prerequisites

1. Token from [ScreepsPl.us](https://screepspl.us/agent)
2. Screeps Login info
3. Node + NPM

### Google Compute Engine

Bonzaiferroni has written a nice guide for setting up on the Google Compute Engine free tier, check it out [here](https://github.com/bonzaiferroni/bonzAI/wiki/Screepspl.us-agent-with-Compute-Engine)

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
With Config:
```
docker run -d -v $(pwd):/config --restart=unless-stopped screepsplus-agent
```
With CLI: (See Config section below for full argument list)
```
docker run -d --restart=unless-stopped screepsplus-agent --token <screepsToken> --sptoken <screepsPlusToken>
```

or build your own image:
```
docker build -t screepsplus-agent .
docker run -d -v $(pwd):/config/ --restart=always screepsplus-agent
```

### Docker-compose
A docker-compose.yml is included.

### Config

Config is done via a config file or cli arguments.
On start it will search for configs in several locations:

* Manually Specified via ENV variable (AGENT_CONFIG_PATH)
* App directory (config.js)
* Home directory (~/.screepsplus-agent) (Mac, Linux)
* Etc directory (/etc/screepsplus-agent/config.js) (Mac, Linux)
* App Data (%APPDATA%/screepsplus-agent/config.js) (Windows)

On windows, it will write a sample config to appdata if no config is found.

All CLI options override the matching config option
CLI Usage:
```
  Usage: app [options]

  Options:

    -V, --version              output the version number
    -u, --username <username>  Private Server Username
    -p, --password <password>  Private Server Password
    -t, --token <token>        Screeps Auth Token
    -s, --segment <id>         Use Segment ID for stats
    -m, --memory               Use Memory for stats (default)
    -c, --console              Use console for stats
    -a, --sptoken <token>      ScreepsPl.us token
    --host <host>              Private Server host and port (ex: host:port)
    --https                    Use HTTPS for Private Server
    --no-updatecheck           Skip check for updates
    -v                         Verbose
    -h, --help                 output usage information
```

It also possible to use the console to output stats, just set method to `console` in `config.js` or pass `--console` on the CLI
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
