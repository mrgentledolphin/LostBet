const mongoose = require('mongoose')
let Schema = mongoose.Schema
let betsSchema = new Schema({
    idUtente: String,
    puntata: Number,
    timestamp: String,
    riscossa: Boolean,
    partite: Array
}, {
    collection: 'bets'
})
module.exports = mongoose.model('bets', betsSchema)