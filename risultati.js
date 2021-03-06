const mongoose = require('mongoose')
let Schema = mongoose.Schema
let risultatiSchema = new Schema({
    s1: String,
    s2: String,
    gol1: Number,
    gol2: Number,
    p: String,
    timestamp: Number,
    quota1: Number,
    quota2: Number, 
    quotax: Number,
    quotaGol: Number,
    quotaNoGol: Number,
    quotaOver: Number,
    quotaUnder: Number
}, {
    collection: 'risultati'
})
module.exports = mongoose.model('risultati', risultatiSchema)