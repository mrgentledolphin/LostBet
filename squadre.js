const mongoose = require('mongoose')
let Schema = mongoose.Schema
let squadreSchema = new Schema({
    id: String,
    nome: String,
    punti: Number,
    pv: Number, 
    ps: Number,
    pp: Number,
    golfatti: Number,
    golsubiti: Number
}, { collection : 'squadre' })
module.exports = mongoose.model('squadre', squadreSchema)