#!/usr/bin/env node
const fs = require('fs');
const updateNotifier = require('update-notifier');
const ScreepsAPI = require('screeps-api')
const request = require('request')
const editor = require('editor')
const pkg = require('./package.json');
let api = new ScreepsAPI()
let setupRan = false

if(process.argv[2] == 'test') process.exit(0) // Placeholder ;)

let {file,config} = loadConfig()
if(config)
  start()
else
  setup()

function start(){
  if(config.sampleConfig || !config.screeps || !config.service){
    console.log(file,"doe not have a valid config")
    return setup()
  }
  if(config.checkForUpdates)
    updateNotifier({pkg}).notify();
  api.auth(config.screeps.username,config.screeps.password,(res)=>{
    console.log(res,'Authenticated')
    if(config.screeps.method == 'console')
      beginConsoleStats()
    else
      beginMemoryStats()
  })
}

function beginConsoleStats(){
  api.socket()
  api.on('message',msg=>{
    if(msg.startsWith('auth ok')){
      api.subscribe('/console')
      console.log('subscribed to console')
    }
  })
  api.on('console',(raw)=>{
    let [user,data] = raw
    if(data.messages && data.messages.log)
      data.messages.log
        .filter(l=>l.startsWith('STATS'))
        .forEach(log=>{
          let ret = formatStats(log)
          pushStats(ret.type,ret.stats)
        })
  })
}

function formatStats(data){
  if(data[0] == '{' || data[0] == '[')
    return { 
      type: 'application/json',
      stats: data
    }
  let [header,type,tick,time,...stats] = data.split(";")
  if(type.startsWith('text')){
    stats = stats.map(s=>`${s} ${time}`).join("\n")
  }
  return { header,type,tick,time,stats }
}

function beginMemoryStats(){
  tick()
  setInterval(tick,15000)
}

function tick(){
  Promise.resolve()
    .then(()=>console.log('Fetching Stats'))
    .then(()=>api.memory.get('stats'))
    .then((stats)=>{
      let ret = formatStats(stats)
      pushStats(ret.type,ret.stats)
    })
    .catch(err=>console.error(err))
}

function pushStats(type,stats){
  if(!stats) return console.log('No stats found, is Memory.stats defined?')
  if(config.showRawStats) console.log('Stats:',JSON.stringify(stats,null,3))
  console.log('Pushing stats')
  let sconfig = config.service
  if(type == 'application/json') stats = JSON.stringify(stats)
  request({
    method: 'POST',
    url: sconfig.url + '/api/stats/submit',
    auth: {
      user: 'token',
      pass: sconfig.token
    },
    headers:{
      'content-type':type
    },
    body: stats
  },(err,res,data)=>{
    if(res.statusCode == 413){
      let len = Math.round(JSON.stringify(stats).length/1024)
      console.log(`stats size: ${len}kb`)
      console.log(`stats limit: 20kb (As of Oct 17, 2016)`)
      console.error(`It appears your stats data is too large, please check to make sure you are not submitting unneeded stats, such as old rooms. \n If you legitimately need to submit stats this large, contact ags131 on slack for a limit bump`)
    }
    console.log('Result:',data)
    if(err) console.error(err)
  })
}

function setup(){
  if(setupRan){
    console.log('Agent not configured. Did you forget to edit the config?')
    process.exit()
  }
  setupRan = true
  let path = getConfigPaths().create
  if(path){
    fs.writeFileSync(path,fs.readFileSync(__dirname + '/config.js.sample'))
    editor(path,(code)=>{
      if(!code) start()
    })
  }else{
    console.log('Please setup config.js before running.')
  }
}

function getConfigPaths(){
  let paths = [
    './config'
  ]
  let create = ''
  if(process.platform == 'linux'){
    create = `${process.env.HOME}/.screepsplus-agent`
    paths.push(create)
    paths.push(`/etc/screepsplus-agent/config.js`)
  }
  create = ''
  return { paths, create }
}


function loadConfig(){
  let {paths} = getConfigPaths()
  for(let i in paths){
    let file = paths[i]
    try{
      // console.log('Try',file)
      let config = require(file)
      // console.log(config)
      return { config, file }
    }catch(e){}
  }
  return false
}