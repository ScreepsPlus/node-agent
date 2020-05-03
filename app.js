#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const updateNotifier = require('update-notifier')
const { ScreepsAPI } = require('screeps-api')
const request = require('request')
const editor = require('editor')
const args = require('commander')
const pkg = require('./package.json')
let api
let setupRan = false

args
  .version(pkg.version)
  .option('-u, --username <username>', 'Private Server Username')
  .option('-p, --password <password>', 'Private Server Password')
  .option('-t, --token <token>', 'Screeps Auth Token')
  .option('--shard <shard>', 'Shard (comma seperated for multiple)')
  .option('-s, --segment <id>', 'Use Segment ID for stats')
  .option('-m, --memory', 'Use Memory for stats (default)')
  .option('-c, --console', 'Use console for stats')
  .option('-a, --sptoken <token>', 'ScreepsPl.us token')
  .option('--host <host>', 'Private Server host and port (ex: host:port)')
  .option('--https', 'Use HTTPS for Private Server')
  .option('--no-updatecheck', 'Skip check for updates')
  .option('-v, --verbose', 'Verbose')
  .parse(process.argv)

if (process.argv[2] == 'test') process.exit(0) // Placeholder ;)

let {file, config} = loadConfig()
if (args.username || args.password || args.token || args.segment || args.memory || args.console || args.host || args.https) {
  config = config || {}
  config.screeps = config.screeps || { method: 'memory' }
  if (args.username) config.screeps.username = args.username
  if (args.password) config.screeps.password = args.password
  if (args.token) config.screeps.token = args.token
  if (args.segment) config.screeps.segment = args.segment
  if (args.memory) config.screeps.method = 'memory'
  if (args.console) config.screeps.method = 'console'
  if (args.shard) config.screeps.shard = args.shard.split(',')
  if (args.segment) {
    config.screeps.method = 'memory'
    config.screeps.segment = args.segment
  }
  if (args.host || args.https) {
    config.screeps.connect = config.screeps.connect || { protocol: 'http' }
    if (args.host) config.screeps.connect.host = args.host
    if (args.https) config.screeps.connect.protocol = args.https ? 'https' : 'http'
  }
}
if (args.sptoken) {
  config = config || {}
  config.service = config.service || { url: 'https://screepspl.us' }
  config.service.token = args.sptoken
}
if (args.verbose) {
  config.showRawStats = !!args.verbose
}
if (config) {
  config.checkForUpdates = config.checkForUpdates && args.updatecheck
}
if (config) { start() } else { setup() }

async function start () {
  if (config.sampleConfig || !config.screeps || !config.service) {
    console.log(file, 'does not have a valid config')
    return setup()
  }
  if (config.checkForUpdates) { updateNotifier({pkg}).notify() }
  let ps = config.screeps.connect && config.screeps.connect.host
  api = new ScreepsAPI(config.screeps.connect)
  if (!ps && config.screeps.username) {
    console.log(`Update your config (${file}) to use auth tokens instead of username. http://blog.screeps.com/2017/12/auth-tokens/`)
    console.log(`ex: {`)
    console.log(`       token: "yourToken"`)
    console.log(`    }`)
    process.exit()
  }
  if (ps) {
    try {
      await api.auth(config.screeps.username, config.screeps.password)
    } catch (e) {
      console.log(`Authentication failed for user ${config.screeps.username} on ${api.opts.url}`)
      console.log('Check your config.js and try again')
      process.exit()
    }
  } else {
    api.token = config.screeps.token
  }
  // console.log('Authenticated')
  console.log('Using stats method', config.screeps.method)

  const shards = [].concat(config.screeps.shard)

  if (config.screeps.method === 'console') {
    beginConsoleStats()
  } else {
    shards.forEach((shard) => {
      beginMemoryStats(shard, shards)
    })
  }
  // })
}

function beginConsoleStats () {
  api.socket.connect()
  api.socket.on('connected', () => {
    api.socket.subscribe('console')
  })
  api.socket.on('console', (event) => {
    console.log(event)
    if (event.data.messages && event.data.messages.log) {
      event.data.messages.log
        .filter(l => l.startsWith('STATS'))
        .forEach(log => processStats(log.slice(6).replace(/;/g, '\n')))
    }
  })
}

function formatStats (data) {
  if (data[0] === '{') data = JSON.parse(data)
  if (typeof data === 'object') {
    return {
      type: 'application/json',
      stats: data
    }
  }
  let [type, tick, time, ...stats] = data.split('\n')
  if (type.startsWith('text')) {
    stats = stats.map(s => `${s} ${time}`).join('\n') + '\n'
  }
  if (type === 'application/json') stats = JSON.parse(stats)
  return Promise.resolve({ type, tick, time, stats })
}

function beginMemoryStats (shard, shards) {
  tick(shard)
  setInterval(() => { tick(shard) }, config.screeps.segment !== undefined ? (15000 * shards.length) : 60000)
}
function addProfileData (stats) {
  return api.raw.auth.me().then(res => {
    let credits = res.money || 0
    let power = res.power || 0
    if (stats.type == 'application/json') {
      stats.stats.credits = credits
      stats.stats.power = power
    }
    if (stats.type == 'text/grafana') {
      stats.stats += `credits ${credits} ${Date.now()}\n`
      stats.stats += `power ${power} ${Date.now()}\n`
    }
    if (stats.type == 'text/influxdb') { stats.stats += `profile,user=${res.username} credits=${credits},power=${power} ${Date.now()}\n` }
    return stats
  })
}
function addLeaderboardData (me, stats, board) {
  return api.leaderboard.find(me.username, board).then(res => {
    let boardName = board == 'world' ? 'leaderboard' : `leaderboard_${board}`
    let { rank, score } = res.list.slice(-1)[0]
    if (stats.type == 'application/json') {
      stats.stats[boardName] = { rank, score }
    }
    if (stats.type == 'text/grafana') {
      stats.stats += `${boardName}.rank ${rank} ${Date.now()}\n`
      stats.stats += `${boardName}.score ${score} ${Date.now()}\n`
    }
    if (stats.type == 'text/influxdb') { 
      stats.stats += `${boardName},user=${me.username} rank=${rank},score=${score} ${Date.now()}\n`
    }
    return stats
  })
}
function tick (shard) {
  Promise.resolve()
    .then(() => console.log('Fetching Stats (' + shard + ')'))
    .then(() => { return getStats(shard) })
    .then(processStats)
    .catch(err => console.error(err))
}

async function processStats (data) {
  data = await formatStats(data)
  if (config.includeProfileData) {
    data = await addProfileData(data)
  }
  if (config.includeLeaderboard) {
    data = await api.me().then(me => addLeaderboardData(me, data, 'world'))
    data = await api.me().then(me => addLeaderboardData(me, data, 'power'))
  }
  pushStats(data)
}

function getStats (shard) {
  if (config.screeps.segment !== undefined) {
    return api.memory.segment.get(config.screeps.segment, shard || 'shard0').then(r => r.data)
  } else {
    return api.memory.get('stats', shard || 'shard0').then(r => r.data)
  }
}

function pushStats (data) {
  let {type, stats} = data
  if (!stats) return console.log('No stats found, is Memory.stats defined?')
  if (config.prefix) stats = {[config.prefix]: stats};
  if (config.showRawStats) console.log('Stats:', JSON.stringify(stats, null, 3))
  console.log('Pushing stats')
  let sconfig = config.service
  if (type == 'application/json') stats = JSON.stringify(stats)
  request({
    method: 'POST',
    url: sconfig.url + '/api/stats/submit',
    auth: {
      user: 'token',
      pass: sconfig.token
    },
    headers: {
      'content-type': type
    },
    body: stats
  }, (err, res, data) => {
    if (res && res.statusCode == 413) {
      let len = Math.round(JSON.stringify(stats).length / 1024)
      console.log(`stats size: ${len}kb`)
      console.log(`stats limit: 10mb (As of Mar 28, 2017) (If you hit this limit, you are probably doing something wrong)`)
      console.error(`It appears your stats data is too large, please check to make sure you are not submitting unneeded stats, such as old rooms. \n If you legitimately need to submit stats this large, contact ags131 on slack for a limit bump`)
    }
    console.log('Result:', data)
    if (err) console.error(err)
  })
}

function setup () {
  if (setupRan) {
    console.log('Agent not configured. Did you forget to edit the config?')
    process.exit()
  }
  setupRan = true
  let path = getConfigPaths().create
  if (path) {
    fs.writeFileSync(path, fs.readFileSync(__dirname + '/config.js.sample'))
    editor(path, (code) => {
      if (!code) start()
    })
  } else {
    console.log('Please setup config.js before running.')
    console.log(`Valid paths for your platform (${process.platform}):`)
    getConfigPaths().paths.forEach(path => console.log(`- ${path}`))
    console.log()
    console.log('Or set the AGENT_CONFIG_PATH environment variable to point to a valid config file.')
  }
}

function getConfigPaths () {
  let appname = 'screepsplus-agent'
  let paths = []
  if (process.env.AGENT_CONFIG_PATH) { paths.push(process.env.AGENT_CONFIG_PATH) }
  paths.push(path.join(__dirname, 'config.js'))
  let create = ''
  if (process.platform == 'linux' || process.platform == 'darwin') {
    create = `${process.env.HOME}/.${appname}`
    paths.push(create)
    paths.push(`/etc/${appname}/config.js`)
  }
  if (process.platform == 'win32') {
    let dir = path.join(process.env.APPDATA, appname)
    try { fs.mkdirSync(dir) } catch (e) {}
    if (!fs.existsSync(path.join(dir, 'config.js'))) {
      fs.writeFileSync(path.join(dir, 'config.js'), fs.readFileSync(path.join(__dirname, 'config.js.sample')))
    }
    paths.push(path.join(dir, 'config.js'))
  }
  create = ''
  return { paths, create }
}

function loadConfig () {
  let {paths} = getConfigPaths()
  for (let i in paths) {
    let file = paths[i]
    try {
      console.log('Try', file)
      let config = require(file)
      console.log(file)
      return { config, file }
    } catch (e) {}
  }
  return false
}
