# ScreepsPlus node agent

[![NPM info][https://nodei.co/npm/screepsplus-agent.png?downloads=true]](https://npmjs.org/package/screepsplus-agent)

[![Circle CI](https://circleci.com/gh/ScreepsPlus/node-agent.svg?style=shield)]((https://circleci.com/gh/ScreepsPlus/node-agent)

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
docker run -d \
--restart=always \
--name screepsplus-agent \
screepsplus-agent
```

### Docker-compose
A docker-compose.yml is included.