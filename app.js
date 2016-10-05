#!/usr/bin/env node
const fs = require('fs');
const updateNotifier = require('update-notifier');
const ScreepsAPI = require('screeps-api')
const request = require('request')
const editor = require('editor')
const pkg = require('./package.json');
let api = new ScreepsAPI()
let config = {}
let setupRan = false

if(process.argv[2] == 'test') process.exit(0) // Placeholder ;)

try{
  config = require(getConfigPath() || './config')
  start()
}catch(e){
  try{
    config = require('./config')
    start()
  }catch(e){
    setup()
  }
}

function start(){
  if(config.sampleConfig || !config.screeps || !config.service)
    return setup()
  if(config.checkForUpdates)
    updateNotifier({pkg}).notify();
  api.auth(config.screeps.username,config.screeps.password,(res)=>{
    console.log(res,'Authenticated')
    tick()
    setInterval(tick,15000)
  })
}
function tick(){
  Promise.resolve()
    .then(()=>console.log('Fetching Stats'))
    .then(()=>api.memory.get('stats'))
    .then(pushStats)
    .catch(err=>console.error(err))
}

function pushStats(stats){
  if(!stats) return console.log('No stats found, is Memory.stats defined?')
  console.log('Pushing stats')
  let sconfig = config.service
  request({
    method: 'POST',
    url: sconfig.url + '/api/stats/submit',
    auth: {
      user: 'token',
      pass: sconfig.token
    },
    json: true,
    body: stats
  },(err,res,data)=>{
    console.log('Result:',data)
    if(err) console.error(err)
  })
}

function getConfigPath(){
  if(process.platform == 'linux') return `${process.env.HOME}/.screepsplus-agent`
  return ''
}

function setup(){
  if(setupRan){
    console.log('Agent not configured. Did you forget to edit the config?')
    process.exit()
  }
  setupRan = true
  let path = getConfigPath()
  if(path){
    fs.writeFileSync(path,fs.readFileSync(__dirname + '/config.js.sample'))
    editor(path,(code)=>{
      if(!code) start()
    })
  }else{
    console.log('Please setup config.js before running.')
  }
}
