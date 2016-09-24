const ScreepsAPI = require('screeps-api')
const request = require('request')
const config = require('./config')
const package = require('./package')
checkVersion()

let api = new ScreepsAPI()
api.auth(config.screeps.username,config.screeps.password,(res)=>{
  console.log(res,'Authenticated')
  tick()
  setInterval(tick,15000)
})

function tick(){
  Promise.resolve()
    .then(()=>console.log('Fetching Stats'))
    .then(()=>api.memory.get('stats'))
    .then(pushStats)
    .catch(err=>console.error(err))
}

function pushStats(stats){
  if(!stats) return console.log('No stats found, is Memory.stats defined?')
  console.log('Pushing stats',stats)
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
    console.log('Send Stats',data)
    if(err) console.error(err)
  })
}

function checkVersion(){
  let sconfig = config.service
  request({
    url: sconfig.url + '/version?agent=node',
    method: 'GET'
  },(err,resp,data)=>{
    if(package.version != data){
      console.warn('Newer Version Available:',data)
    }
  })
}
