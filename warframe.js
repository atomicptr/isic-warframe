module.exports = function(bot) {

    function enabled(subModule) {
        let enabled = true

        if(bot.config.isicWarframe && bot.config.isicWarframe[subModule]) {
            enabled = bot.config.isicWarframe[subModule].disable || true
        }

        return enabled
    }

    let enableAlerts = enabled("alerts")
    let enableVoidtrader = enabled("voidtrader")
    let enableSorties = enabled("sorties")
    let enableFissures = enabled("fissure")

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

    if(enableFissures) {
        require("./src/fissure.js")(bot)
    }
}
