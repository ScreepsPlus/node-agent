"use strict"
const ScreepsAPI = require('screeps-api')
const request = require('request')
let api = new ScreepsAPI()

let config = require('./config')

exports.marketStats = function(event,context,callback){
  api.email = config.screeps.username
  api.password = config.screeps.password
  Promise.resolve()
    .then(ensureToken)
    .then(stats)
    .then((res)=>{
      callback(null,res)
      context.done()
    }).catch(err=>{
      context.done(err.stack || err.message || err.msg)
    })
}

function ensureToken(){
  if(!api.token)
    return api.getToken()
  else
    return Promise.resolve()
}

function stats(){
  console.log('Fetching')
  let resources = require('./resources')
  let res = []
  for(let k in resources)
    res.push(resources[k])
  return Promise.all(res.map(res=>api.market.stats(res)))
    .then(saveStats)
    .then((res)=>{
      console.log('Done')
      return res
    })
}

function saveStats(stats){
  let payload = []
  let now = Date.now()
  stats.forEach(stat=>{
    stat.forEach(s=>{
      let ma = s.date.match(/^([0-9]+)-([0-9]+)-([0-9]+)$/)
      let y = ma[1]
      let m = ma[2]
      let d = ma[3]
      let ts = new Date(y,m-1,d,0,0,0)
      payload.push(`stats,date=${s.date},type=${s.resourceType} avgPrice=${s.avgPrice},stddevPrice=${s.stddevPrice},transactions=${s.transactions},volume=${s.volume} ${ts.getTime()}000000`)      
    })
  })
  let promises = []
  while(payload.length){
    promises.push(submitToInfluxDB(payload.splice(0,5000).join("\n")))
  }
  return Promise.all(promises)
}

function submitToInfluxDB(payload){
  // console.log(payload)
  return new Promise((resolve,reject)=>{
    request({
      url: `${config.influxdb.url}/write?db=${config.influxdb.database}` ,
      method: 'POST',
      body: payload,
      auth: config.influxdb.auth || undefined
    },(err,res,body)=>{
      if(err) return reject(err)
      resolve(body)
    })
  })
}
