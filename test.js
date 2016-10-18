'use strict'
let func = require('./app').screepsStats

func({},{ done: function(data){ console.log(data) }},(err,data)=>{console.error(err);console.log(data)})