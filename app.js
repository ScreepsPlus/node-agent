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
  let memcnt = 0;
  let maxstats = 0;
  let lastmem = 0;
  let notreceived = {}
  setInterval(()=>{
    if(lastmem + 1000 < Date.now())
    {
      if(memcnt){
        console.log('-------------------------------')
        console.log(`Received: ${memcnt}/${maxstats}`)
        console.log('===============================')
        for(let k in notreceived){
          notreceived[k]++
          api.subscribe(`/memory/${k}`)
          console.log('sub',k,'...',notreceived[k])
        }
      }
      lastmem = Date.now()
      memcnt = 0;
    }    
  },800)
  api.auth(config.screeps.username,config.screeps.password,(res)=>{
    console.log(res,'Authenticated')
    api.socket(()=>{})
    api.on('message', (msg) => {
      if (msg.slice(0, 7) == 'auth ok') {
        api.subscribe('/console')
        api.memory.get('stats').then(stats=>{
          stats = flattenObj({},'stats',stats)
          let keys = Object.keys(stats)
          maxstats = keys.length
          console.log('Keys',keys.length, keys)
          keys.forEach(k=>{
            notreceived[k] = 0
            console.log('sub',k,'...')
            api.subscribe(`/memory/${k}`)
          })
        })
      }
    })
  })  
  api.on('memory',msg=>{
    memcnt++
    let [user,data] = msg
    let [userid,key,value] = user.split('/')
    delete notreceived[value]
    console.log(user,data)
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

function flattenObj (ret, path, obj) {
  if (typeof obj == 'object'){
    for (let k in obj)
      flattenObj(ret, `${path}.${k}`, obj[k])
  }
  else
    ret[path] = obj
  return ret
}
