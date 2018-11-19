const express = require('express')
const bodyParser = require('body-parser')
const async = require('async')

/* mongodb */
const mongoose = require('mongoose')
const url = 'mongodb://admin:admin1@ds033390.mlab.com:33390/lostbet'
mongoose.connect(url)
let db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDb connection error:'))
let squadreModel = require('./squadre.js')
let utentiModel = require('./utenti.js')
let risultatiModel = require('./risultati.js')

let partite = []
let tremin = false
setInterval(function () {
    tremin = false
}, 180000)

express()
    .set('view engine', 'hjs')
    .get('/', (req, res) => {
        
    })
    .get('/genera', (req, res) => {
        if (!tremin) {
            squadreModel.find({}, (err, squadre) => {
                tremin = true
                partite = []
                let calendario = randomSquadre()
                let gol1, gol2, p
                let timestamp = new Date().getUTCMilliseconds()
                let indexS1
                let indexS2
                let classifica = ['Juventus', 'Napoli', 'Inter', 'Lazio', 'Milan', 'Roma', 'Sassuolo', 'Atalanta', 'Fiorentina', 'Torino', 'Parma', 'Sampdoria', 'Cagliari', 'Genoa', 'SPAL', 'Bologna', 'Udinese', 'Empoli', 'Frosinone', 'Chievo']
                
                
                for (let i = 0; i < squadre.length; i++) {
                    classifica.push(squadre[i].nome)
                }
                
                
                for (let i = 0; i < calendario.length; i++) {
                    for (let j = 0; j < classifica.length; j++) {
                        if (calendario[i] == classifica[j]) {
                            indexS1 = j
                        }
                        if (calendario[i + 1] == classifica[j]) {
                            indexS2 = j
                        }
                    }
                    if ((indexS1 - indexS2) < -10) {
                        gol1 = golperForte()
                        gol2 = golperScarsa()
                    } else if ((indexS1 - indexS2) < -5) {
                        gol1 = golperForte()
                        gol2 = golperMedia()
                    } else if ((indexS1 - indexS2) < 2) {
                        gol1 = golperForte()
                        gol2 = golperForte()
                    } else if ((indexS1 - indexS2) < 5) {
                        gol1 = golperMedia()
                        gol2 = golperForte()
                    } else if ((indexS1 - indexS2) < 10) {
                        gol1 = golperScarsa()
                        gol2 = golperMedia()
                    } else {
                        gol1 = golperScarsa()
                        gol2 = golperMedia()
                    }

                    if (gol1 > gol2) {
                        p = '1'
                    } else if (gol1 < gol2) {
                        p = '2'
                    } else {
                        p = 'x'
                    }
                    partite.push({
                        s1: calendario[i],
                        s2: calendario[i + 1],
                        gol1,
                        gol2,
                        p,
                        timestamp
                    })
                    risultatiModel.create({
                        s1: calendario[i],
                        s2: calendario[i + 1],
                        gol1,
                        gol2,
                        p,
                        timestamp
                    }, (err) => {
                        if (err) return handleError(err)
                    })
                    i++
                }
                res.send(partite)
            })
        } else {
            res.send(partite)
        }
    })
    .get('/reset', (req, res) => {
        squadreModel.find({}, (err, squadre) => {
            if (err) handleError (err)
            for (let i = 0; i < squadre.length; i++) {
                squadre[i].punti = 0
                squadre[i].pv = 0
                squadre[i].ps = 0
                squadre[i].pp = 0
                squadre[i].golfatti = 0
                squadre[i].golsubiti = 0
                squadre[i].save((err, updatedSquadre) => {
                    if (err) handleError(err)
                })
            }
            res.send('reset')
        })
        risultatiModel.deleteMany({}, (err) => {
            if (err) handleError (err)
        })
    })

    .get('/aggiorna', (req, res) => {
        squadreModel.find({}, (err, squadre) => {
            if (err) handleError(err)
            for (let i = 0; i < squadre.length; i++) {
                squadre[i].punti = 0
                squadre[i].pv = 0
                squadre[i].ps = 0
                squadre[i].pp = 0
                squadre[i].golfatti = 0
                squadre[i].golsubiti = 0
                squadre[i].save((err, updatedSquadre) => {
                    if (err) handleError(err)
                    squadreModel.find({}, (err, squadre) => {
                        if (err) return handleError(err)
                        risultatiModel.find({}, (err, risultati) => {
                            if (err) return handleError(err)

                            for (let i = 0; i < risultati.length; i++) {
                                for (let j = 0; j < squadre.length; j++) {

                                    if (squadre[j].nome == risultati[i].s1) {
                                        squadre[j].golfatti += risultati[i].gol1
                                        squadre[j].golsubiti += risultati[i].gol2
                                        if (risultati[i].p == '1') {
                                            squadre[j].pv++
                                            squadre[j].punti += 3
                                        } else if (risultati[i].p == 'x') {
                                            squadre[j].pp++
                                            squadre[j].punti++
                                        } else {
                                            squadre[j].ps++
                                        }
                                    }

                                    if (squadre[j].nome == risultati[i].s2) {
                                        squadre[j].golfatti += risultati[i].gol2
                                        squadre[j].golsubiti += risultati[i].gol1
                                        if (risultati[i].p == '2') {
                                            squadre[j].pv++
                                            squadre[j].punti += 3
                                        } else if (risultati[i].p == 'x') {
                                            squadre[j].pp++
                                            squadre[j].punti++
                                        } else {
                                            squadre[j].ps++
                                        }
                                    }

                                }
                            }
                            for (let i = 0; i < squadre.length; i++) {
                                squadre[i].save((err, updatedSquadra) => {
                                    if (err) handleError(err)
                                })
                            }
                        })
                    })
                })
            }
        })
        res.send('go')
    })

    .get('/classifica', (req, res) => {
        squadreModel.find({}, (err, squadre) => {
            squadre.sort(function (a, b) {
                return a.punti - b.punti
            })
            squadre.reverse()
            res.send(squadre)
        })
    })

    .listen(3000)




let randomSquadre = () => {
    let nums = ['Juventus', 'Napoli', 'Inter', 'Lazio', 'Milan', 'Roma', 'Sassuolo', 'Atalanta', 'Fiorentina', 'Torino', 'Parma', 'Sampdoria', 'Cagliari', 'Genoa', 'SPAL', 'Bologna', 'Udinese', 'Empoli', 'Frosinone', 'Chievo'],
        ranNums = [],
        i = nums.length,
        j = 0;

    while (i--) {
        j = Math.floor(Math.random() * (i + 1));
        ranNums.push(nums[j]);
        nums.splice(j, 1);
    }
    return ranNums
}

let golperScarsa = () => {
    let notRandom = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 3, 4]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}
let golperMedia = () => {
    let notRandom = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}

let golperForte = () => {
    let notRandom = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}
