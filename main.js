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
let storicoRisultatiModel = require('./storicoRisultati.js')


let partite = []
let giornata = 1
let tremin = false
let attualeStamp = 0
setInterval(function () {
    tremin = false
    if (giornata < 39) {
        genera()
    } else if (giornata == 39) {
        giornata++
    } 
    else {
        reset()
        giornata = 1
    }
}, 180000)

express()
    .use(bodyParser.urlencoded({extended: false}))
    .use(bodyParser.json())
    .use(express.static(__dirname + '/views/'))
    .set('view engine', 'hjs')
    .get('/', (req, res) => {
        console.log(giornata)
        genera()
        setTimeout(() => {
            res.render('index', {
                partite: partite
            })
        }, 300);
        
    })
    .get('/genera', (req, res) => {
        res.send(genera())
    })
    .get('/reset', (req, res) => {
        res.send(reset())
    })

    .get('/aggiorna', (req, res) => {
        res.send(aggiorna())
    })
    .get('/partite', (req, res) => {
        res.send(partite)
    })
    .get('/classifica', (req, res) => {
        aggiorna()
        squadreModel.find({}, (err, squadre) => {
            squadre.sort(function (a, b) {
                return a.punti - b.punti
            })
            squadre.reverse()
            for (let i = 0; i < squadre.length; i++) {
                squadre[i].posizione = (i + 1)
            }
            res.render('classifica', {
                squadre
            })
        })
    })

    .listen(3000)

let genera = () => {
    if (!tremin) {
        squadreModel.find({}, (err, squadre) => {
            tremin = true
            giornata++
            partite = []
            let calendario = randomSquadre()
            let gol1, gol2, p, quota1, quota2, quotax, quotaGol, quotaNoGol, quotaOver, quotaUnder
            let timestamp = new Date().valueOf()
            attualeStamp = timestamp
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
                    quota1 = quoteperForte()
                    quotax = quoteperForte()
                    quota2 = quoteperScarsa()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
                } else if ((indexS1 - indexS2) < -5) {
                    gol1 = golperForte()
                    gol2 = golperMedia()
                    quota1 = quoteperForte()
                    quotax = quoteperForte()
                    quota2 = quoteperMedia()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
                } else if ((indexS1 - indexS2) < 2) {
                    gol1 = golperForte()
                    gol2 = golperForte()
                    quota1 = quoteperMedia()
                    quotax = quoteperForte()
                    quota2 = quoteperMedia()
                    quotaGol = quoteperForte()
                    quotaNoGol = quoteperScarsa()
                    quotaOver = quoteperForte()
                    quotaUnder = quoteperScarsa()
                } else if ((indexS1 - indexS2) < 5) {
                    gol1 = golperMedia()
                    gol2 = golperForte()
                    quota1 = quoteperMedia()
                    quotax = quoteperForte()
                    quota2 = quoteperForte()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
                } else if ((indexS1 - indexS2) < 10) {
                    gol1 = golperScarsa()
                    gol2 = golperMedia()
                    quota1 = quoteperScarsa()
                    quotax = quoteperForte()
                    quota2 = quoteperMedia()
                    quotaGol = quoteperScarsa()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperScarsa()
                    quotaUnder = quoteperMedia()
                } else {
                    gol1 = golperScarsa()
                    gol2 = golperForte()
                    quota1 = quoteperScarsa()
                    quotax = quoteperForte()
                    quota2 = quoteperForte()
                    quotaGol = quoteperScarsa()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
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
                    timestamp,
                    quota1,
                    quota2,
                    quotax,
                    quotaGol,
                    quotaNoGol,
                    quotaOver,
                    quotaUnder
                })
                risultatiModel.create({
                    s1: calendario[i],
                    s2: calendario[i + 1],
                    gol1,
                    gol2,
                    p,
                    timestamp,
                    quota1,
                    quota2,
                    quotax,
                    quotaGol,
                    quotaNoGol,
                    quotaOver,
                    quotaUnder
                }, (err) => {
                    if (err) return handleError(err)
                })
                storicoRisultatiModel.create({
                    s1: calendario[i],
                    s2: calendario[i + 1],
                    gol1,
                    gol2,
                    p,
                    timestamp,
                    quota1,
                    quota2,
                    quotax,
                    quotaGol,
                    quotaNoGol,
                    quotaOver,
                    quotaUnder
                }, (err) => {
                    if (err) return handleError(err)
                })
                i++
            }
            return partite
        })
    } else {
        return partite
    }
}
let reset = () => {
    squadreModel.find({}, (err, squadre) => {
        if (err) return err
        for (let i = 0; i < squadre.length; i++) {
            squadre[i].punti = 0
            squadre[i].pv = 0
            squadre[i].ps = 0
            squadre[i].pp = 0
            squadre[i].golfatti = 0
            squadre[i].golsubiti = 0
            squadre[i].save((err, updatedSquadre) => {
                if (err) return err
            })
        }
        giornata = 1
        return 'Campionato Resettato'
    })
    risultatiModel.deleteMany({}, (err) => {
        if (err) return err
    })
}
let aggiorna = () => {
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
                            if (risultati[i].timestamp != attualeStamp) {
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
    return 'Aggiornate'
}

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
    let notRandom = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}
let golperForte = () => {
    let notRandom = [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}

let quoteperScarsa = () => {
    let notRandom = [4, 3.5, 3.4, 3.3, 3.2, 3.1, 3, 3, 3, 3, 3, 2.9, 2.9, 2.8]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}
let quoteperMedia = () => {
    let notRandom = [2.7, 2.6, 2.5, 2.4, 2.3, 2.3, 2.3, 2.2, 2.2, 2.1, 2]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}
let quoteperForte = () => {
    let notRandom = [2, 1.9, 1.9, 1.8, 1.8]
    let idx = Math.floor(Math.random() * notRandom.length)
    return notRandom[idx]
}