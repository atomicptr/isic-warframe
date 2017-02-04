const WORLDSTATE_URL_PC = "http://content.warframe.com/dynamic/worldState.php"
const WORLDSTATE_URL_PS4 = "http://content.ps4.warframe.com/dynamic/worldState.php"
const WORLDSTATE_URL_XB1 = "http://content.xb1.warframe.com/dynamic/worldState.php"

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
        let platform = "pc"

        let url = WORLDSTATE_URL_PC

        if(enabled("platform")) {
            if(platform.toLowerCase() === "ps4") {
                url = WORLDSTATE_URL_PS4
            } else if(platform.toLowerCase() === "xb1" || platform.toLowerCase() === "xbone") {
                url = WORLDSTATE_URL_XB1
            }
        }

        bot.request(url, (err, response, body) => {
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
