const express = require('express')
const session = require('express-session')
const passport = require('passport')
const bodyParser = require('body-parser')
const async = require('async')
const {ObjectId} = require('mongodb')
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
let betsModel = require('./bets.js')
require('./passport')

let d = new Date()
let ore = d.getHours()
let minuti = (d.getMinutes() + 3)
let secondi = d.getSeconds()
let partite = []
let giornata = 0
let tremin = false
let attualeStamp = 0
let risultatiStamp = 0
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
reset()

setInterval(function () {
    tremin = false
    if (giornata < 39) {
        risultatiStamp = attualeStamp
        genera()
        giornata++
        d = new Date()
        ore = d.getHours()
        secondi = d.getSeconds()
        minuti = (d.getMinutes() + 3)
    } else if (giornata == 39) {
        reset()
        giornata = 0
    } 
    else {
        console.log(giornata)
        giornata++
    }
}, 180000)

express()
    .use(bodyParser.urlencoded({extended: false}))
    .use(bodyParser.json())
    .use(express.static(__dirname + '/views/'))
    .use(session({secret: 'thisbetislost', saveUninitialized: false, resave: false}))
    .use(passport.initialize())
    .use(passport.session())
    .set('view engine', 'hjs')
    .get('/', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            genera()
            utentiModel.findOne({'_id': ObjectId(req.session.passport.user)}, (err, utente) => {
                req.session.crediti = Math.round(utente.crediti * 100) / 100
            })
            setTimeout(() => {
                res.render('index', {
                    partite,
                    giornata,
                    ore,
                    minuti,
                    secondi,
                    crediti: req.session.crediti
                })
            }, 300)
        }
    })
    .get('/genera', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            res.send(genera())
        }
        
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
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
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
                    squadre,
                    crediti: req.session.crediti
                })
            })
        }
    })
    .get('/risultati', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            risultatiModel.find({timestamp: risultatiStamp}, (err, ris) => {
                res.render('risultati', {ris, crediti: req.session.crediti})
            })
        }
    })
    .get('/rimuoviScheda/:id', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            let id = req.params.id
            betsModel.deleteMany({'_id': ObjectId(id)}, (err) => {
                if (err) res.send(err)
                res.render('message', {msg: 'Schedina Cancellata!'})
            })
        }

    })
    .get('/controllaScheda/:id', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            let id = req.params.id
            betsModel.findOne({'_id': ObjectId(id)}, (err, bet) => {
                if (attualeStamp == bet.timestamp) {
                    res.render('message', {msg: "Risultati ancora non disponibili"})
                } else {
                    let vinta = true
                    storicoRisultatiModel.find({'timestamp': bet.timestamp}, (err, storico) => {
                        let partite = bet.partite
                        for (let i = 0; i < partite.length; i++) {
                            for (let j = 0; j < storico.length; j++) {
                                if (partite[i].s1 == storico[j].s1) {
                                    switch(partite[i].p){
                                        case '1': 
                                            if ( !(storico[j].gol1 > storico[j].gol2) ) {
                                                vinta = false
                                            }
                                            break
                                        case 'x': 
                                            if ( !(storico[j].gol1 == storico[j].gol2) ) {
                                                vinta = false
                                            }
                                            break
                                        case '2': 
                                            if ( !(storico[j].gol1 < storico[j].gol2) ) {
                                                vinta = false
                                            }
                                            break
                                        case 'Gol': 
                                            if ( !(storico[j].gol1 > 0 && storico[j].gol2 > 0) ) {
                                                vinta = false
                                            }
                                            break
                                        case 'NoGol': 
                                            if ( (storico[j].gol1 > 0 && storico[j].gol2 > 0) ) {
                                                vinta = false
                                            }
                                            break
                                        case 'Under': 
                                            if ( (storico[j].gol1 + storico[j].gol2 > 3) ) {
                                                vinta = false
                                            }
                                            break
                                        case 'Over': 
                                            if ( !(storico[j].gol1 + storico[j].gol2 > 3) ) {
                                                vinta = false
                                            }
                                            break
                                    }
                                }
                            }
                        }
                        if (vinta) {
                            let vincita, bonus, sommaQuote = 0, nPartite = 0, puntata = bet.puntata
                            for (let i = 0; i < partite.length; i++) {
                                nPartite++
                                sommaQuote += parseFloat(partite[i].quota)
                            }
                            sommaQuote = Math.round(sommaQuote * 100) / 100
                            bonus = ((sommaQuote * puntata) / 100) * (nPartite * 20)
                            vincita = (sommaQuote * puntata) + bonus
                            bonus = Math.round(bonus * 100) / 100
                            vincita = Math.round(vincita * 100) / 100
                            let msg = `HAI VINTO! Puntata: ${puntata} - Quota: ${sommaQuote} - Bonus: ${bonus} - Vincita: ${vincita}`
                            utentiModel.findOne({'_id': ObjectId(req.session.passport.user)}, (err, utente) => {
                                if (err) res.send(err)
                                let crediti = parseFloat(utente.crediti)
                                crediti += vincita
                                utente.crediti = crediti
                                utente.save((err, updated) => {
                                    if (err) res.send(err)
                                    betsModel.deleteMany({'_id': ObjectId(id)}, (err) => {
                                        if (err) res.send(err)
                                        res.render('message', {msg})
                                    })
                                })
                            })
                        } else {
                            betsModel.deleteMany({'_id': ObjectId(id)}, (err) => {
                                if (err) res.send(err)
                                res.render('message', {msg: 'Schedina Persa! :C'})
                            })
                        }
                        
                    })
                }
            })
        }
    })
    .get('/schedine', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            betsModel.find({'idUtente': req.session.passport.user}, (err, scommesse) => {
                        let sommaQuote, id, bonus, bets = [], puntata, quota,vincitaPotenziale, partite = []
                        for (let i = 0; i < scommesse.length; i++) {
                            sommaQuote = 0
                            partite = []
                            for (let j = 0; j < scommesse[i].partite.length; j++) {
                                sommaQuote += parseFloat(scommesse[i].partite[j].quota)
                                partite.push({
                                    s1: scommesse[i].partite[j].s1,
                                    s2: scommesse[i].partite[j].s2,
                                    p: scommesse[i].partite[j].p,
                                    quota: scommesse[i].partite[j].quota
                                })
                            }
                            bonus = ((sommaQuote * scommesse[i].puntata) / 100) * (scommesse[i].partite.length * 20)
                            bonus = Math.round(bonus * 100) / 100
                            vincitaPotenziale = Math.round(((sommaQuote * scommesse[i].puntata) + bonus) * 100) / 100
                            puntata = scommesse[i].puntata
                            id = scommesse[i]._id
                            bets.push({
                                partite, bonus, vincitaPotenziale, puntata, id
                            })
                        }
                        res.render('schedine', {
                            bets,
                            crediti: req.session.crediti
                        }) 
                    })
        }
        
    })
    .get('/svuotaStorico', (req, res) => {
        storicoRisultatiModel.deleteMany({}, (err) => {
            if (err) res.send(err)
            res.send('Storico Scommesse Resettato')
        })
    })
    .get('/session', (req, res) => {
        res.send(req.session)
    })
    .get('/login', (req, res) => {
        res.render('login')
    })
    .get('/signup', (req, res) => {
        res.render('signup')
    })
    .post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    }))
    .post('/signup', passport.authenticate('local-register', {
        successRedirect: "/",
        failureRedirect: "/signup"
    }))
    .get('/logout', (req, res, next) => {
        req.session.destroy((err) => {
            res.redirect("/")
        })
    })
    .post('/scommetti', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login')
        } else {
            let schedina = req.body
            let bet = {
                idUtente: req.session.passport.user,
                puntata: req.body[0].puntata,
                timestamp: req.body[0].timestamp,
                riscossa: false,
                partite: req.body
            }
            if (bet.puntata > req.session.crediti) {
                res.render('message', {msg: 'Credito Insufficiente! :C'})
            } else {
                utentiModel.findOne({'_id': ObjectId(req.session.passport.user)}, (err, utente) => {
                    if (err) res.send(err)
                    utente.crediti -= bet.puntata
                    req.session.crediti -= bet.puntata
                    utente.save((err, updated) => {
                        if (err) res.send(err)
                        betsModel.create(bet, (err) => {
                            if (err) res.send(err)
                            res.send('ok')
                        })
                    })
                })
            }
            
        }
    })

    .listen(3000)

let genera = () => {
    if (!tremin) {
        squadreModel.find({}, (err, squadre) => {
            tremin = true
            partite = []
            let calendario = randomSquadre()
            let gol1, gol2, p, quota1, quota2, quotax, quotaGol, quotaNoGol, quotaOver, quotaUnder
            let timestamp = new Date().valueOf()
            attualeStamp = timestamp
            let indexS1
            let indexS2
            let classifica = ['Juventus', 'Napoli', 'Inter', 'Lazio', 'Milan', 'Roma', 'Sassuolo', 'Atalanta', 'Fiorentina', 'Torino', 'Parma', 'Sampdoria', 'Cagliari', 'Genoa', 'SPAL', 'Bologna', 'Udinese', 'Empoli', 'Frosinone', 'Chievo']

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
                    quotax = quoteperScarsa()
                    quota2 = quoteperScarsa()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
                } else if ((indexS1 - indexS2) < -5) {
                    gol1 = golperForte()
                    gol2 = golperMedia()
                    quota1 = quoteperForte()
                    quotax = quoteperScarsa()
                    quota2 = quoteperMedia()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
                } else if ((indexS1 - indexS2) < 2) {
                    gol1 = golperForte()
                    gol2 = golperForte()
                    quota1 = quoteperMedia()
                    quotax = quoteperScarsa()
                    quota2 = quoteperMedia()
                    quotaGol = quoteperForte()
                    quotaNoGol = quoteperScarsa()
                    quotaOver = quoteperForte()
                    quotaUnder = quoteperScarsa()
                } else if ((indexS1 - indexS2) < 5) {
                    gol1 = golperMedia()
                    gol2 = golperForte()
                    quota1 = quoteperMedia()
                    quotax = quoteperScarsa()
                    quota2 = quoteperForte()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperMedia()
                    quotaUnder = quoteperMedia()
                } else if ((indexS1 - indexS2) < 10) {
                    gol1 = golperScarsa()
                    gol2 = golperMedia()
                    quota1 = quoteperScarsa()
                    quotax = quoteperScarsa()
                    quota2 = quoteperMedia()
                    quotaGol = quoteperMedia()
                    quotaNoGol = quoteperMedia()
                    quotaOver = quoteperScarsa()
                    quotaUnder = quoteperMedia()
                } else {
                    gol1 = golperScarsa()
                    gol2 = golperForte()
                    quota1 = quoteperScarsa()
                    quotax = quoteperScarsa()
                    quota2 = quoteperForte()
                    quotaGol = quoteperMedia()
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
    let notRandom = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 3, 4]
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