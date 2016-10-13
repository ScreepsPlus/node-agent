'use strict'
let func = require('./app').myHandler

func({},{ done: function(data){ console.log(data) }})