module.exports = function(bot) {

    let enableAlerts = true

    if(bot.config.isicWarframe && bot.config.isicWarframe.alerts) {
        enableAlerts = bot.config.isicWarframe.alerts.disable || true
    }

    let enableVoidtrader = true

    if(bot.config.isicWarframe && bot.config.isicWarframe.voidtrader) {
        enableVoidtrader = bot.config.isicWarframe.voidtrader.disable || true
    }

    let enableSorties = true

    if(bot.config.isicWarframe && bot.config.isicWarframe.sorties) {
        enableSorties = bot.config.isicWarframe.sorties.disable || true
    }

    if(enableAlerts) {
        require("./src/alerts.js")(bot,
            Object.assign({},
                {phrases: [], importantPhrases: [], ignores: []},
                bot.config.isicWarframe.alerts
            )
        )
    }

    // update worldstate
    bot.mydb.defaults({isicWarframeWorldState: null}).value()

    bot.interval("isic-warframe-worldstate-update", (err, response, body) => {
        bot.request("http://content.warframe.com/dynamic/worldState.php", (err, response, body) => {
            if(err) {
                return console.error(err)
            }

            console.log("updated warframe world state...")
            bot.mydb.set("isicWarframeWorldState", JSON.parse(body)).value()
        })
    })

    // add stuff that is using the world state below here
    if(enableVoidtrader) {
        require("./src/voidtrader.js")(bot)
    }

    if(enableSorties) {
        require("./src/sorties.js")(bot)
    }
}
