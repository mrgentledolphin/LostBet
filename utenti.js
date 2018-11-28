const mongoose = require('mongoose')
let Schema = mongoose.Schema
let utentiSchema = new Schema({
    email: String,
    username: String,
    password: String,
    crediti: Number
}, {
    collection: 'utenti'
})
module.exports = mongoose.model('utenti', utentiSchema)