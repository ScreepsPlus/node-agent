"use strict"
const ScreepsAPI = require('screeps-api')
const request = require('request')
let api = new ScreepsAPI()

let config = require('./config')

exports.screepsStats = function(event,context,callback){
  api.email = config.screeps.username
  api.password = config.screeps.password
  Promise.resolve()
    .then(ensureToken)
    .then(stats)
    .then((res)=>{
      callback(null)
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
  return Promise.all([
    api.memory.get('statsPerTick'),
    api.memory.get('statsPerTickLast')
  ]).then(d=>{
    let spt = d[0]
    let last = d[1]
    spt = spt.filter(s=>s && s.tick && s.tick > last)
    let nlast = Math.max.apply(null,spt.map(s=>s.tick))
    console.log('Stats:',spt.length)
    console.log('From:',last)
    console.log('To:',nlast)
    return Promise.all([
      api.memory.set('statsPerTickLast',nlast),
      saveStats(spt)
    ])
  }).then((res)=>{
    console.log('Done')
    return res
  })
}

function saveStats(spt){
  let payload = []
  spt.forEach(s=>{
    let stats = flattenObj({},'screeps',s.stats)
    for(let k in stats){
      payload.push(`${k} value=${stats[k]} ${s.time}000000`)
    }
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

function flattenObj (ret, path, obj) {
  if (typeof obj == 'object')
    for (let k in obj)
      flattenObj(ret, `${path}.${k}`, obj[k])
  else
    ret[path] = obj
  return ret
}

