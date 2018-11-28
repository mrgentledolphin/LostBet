$(function () {
    let schedina = [], s1, s2, timestamp, p, quota, puntata, bonus, vincita, quote = [], sommaQuote = 0, rimuovi = false
    $('.btnQuota').on('click', (data) => {
        $(this)[0].activeElement.classList.remove('darken-4')
        rimuovi = false
        s1 = data.target.attributes[0].value
        s2 = data.target.attributes[1].value
        timestamp = data.target.attributes[2].value
        p = data.target.attributes[3].value
        quota = data.target.attributes[4].value
        for (let i = 0; i < schedina.length; i++) {
            if (schedina[i].s1 == s1 && schedina[i].p == p) {
                rimuovi = true
            }
        }
        if (!rimuovi) {
            puntata = $('.puntataInput').val()
            schedina.push({
                s1,
                s2,
                timestamp,
                p,
                quota,
                puntata
            })
            $('.scheda').append(`
                <tr data-rem="${s1}${p}" class="giocata">
                    <td>${s1}</td>
                    <td>${s2}</td>
                    <td>${p}</td>
                    <td>${quota}</td>
                </tr>
            `)
            quote.push({quota, p, s1, s2})
            
          
            sommaQuote = 0
            for (let i = 0; i < quote.length; i++) {
                sommaQuote += parseFloat(quote[i].quota)
            }
            sommaQuote = Math.round(sommaQuote * 100) / 100
            bonus = ((sommaQuote * puntata) / 100) * (schedina.length * 35)
            vincita = (sommaQuote * puntata) + bonus
            bonus = Math.round(bonus * 100) / 100
            vincita = Math.round(vincita * 100) / 100
            $('.sommaScheda').html(`
                Quota: ${sommaQuote} - Bonus: ${bonus} - <b>Vincita: ${vincita}</b>   
            `)
        } else {
            $(this)[0].activeElement.classList.add('darken-4')
            for (let i = 0; i < schedina.length; i++) {
                if (schedina[i].s1 == s1 && schedina[i].p == p) {
                    schedina.splice(i, 1)
                }
                for (let j = 0; j < $('.giocata').length; j++) {
                    if ($('.giocata')[j].dataset.rem == (s1 + p)) {
                        $('.giocata')[j].remove()
                    }
                }
            }
        }
         
    })
    $('.puntataInput').on('change', () => {
        puntata = $('.puntataInput').val()
        
        sommaQuote = 0
        for (let i = 0; i < quote.length; i++) {
            sommaQuote += parseFloat(quote[i].quota)
        }
        sommaQuote = Math.round(sommaQuote * 100) / 100
        bonus = ((sommaQuote * puntata) / 100) * (schedina.length * 35)
        vincita = (sommaQuote * puntata) + bonus
        bonus = Math.round(bonus * 100) / 100
        vincita = Math.round(vincita * 100) / 100
        $('.sommaScheda').html(`
            Quota: ${sommaQuote} - Bonus: ${bonus} - <b>Vincita: ${vincita}</b>   
        `)
    })

    $('.scommettiBtn').on('click', () => {
        $('.scommettiBtn').addClass('darken-1s')
        $.ajax({
            type: "POST",
            url: '/scommetti',
            data: JSON.stringify(schedina),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: (res) => {
                alert('Scommessa Piazzata')
            }
        });
    })
})