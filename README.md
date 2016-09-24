# ScreepsPlus node agent

## Setup

1. Download
2. Configure with config.js (Get your token from [https://screepspl.us/agent](ScreepsPl.us))
3. `npm install`
4. `node app.js`

## Docker

To use with docker, just do the following:
```
docker build -t screepsplus-agent .
docker run -d \
--restart=always \
--name screepsplus-agent \
screepsplus-agent
```

## Docker-compose
A docker-compose.yml is included.