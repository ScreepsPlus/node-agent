# ScreepsPlus node agent
![npm](https://nodei.co/npm/screepsplus-agent.png "NPM")

## Requirements
Node.js 6+ 

## Setup

### Prerequisites

1. Token from [https://screepspl.us/agent](ScreepsPl.us)
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