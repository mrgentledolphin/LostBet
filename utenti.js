const mongoose = require('mongoose')
let Schema = mongoose.Schema
let utentiSchema = new Schema({
    email: String,
    username: String,
    password: String,
    crediti: String
}, {
    collection: 'utenti'
})
module.exports = mongoose.model('utenti', utentiSchema)