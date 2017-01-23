module.exports = function(bot) {

    let enableAlerts = true

    if(bot.config.isicWarframe && bot.config.isicWarframe.alerts) {
        enableAlerts = bot.config.isicWarframe.alerts.disable || true
    }

    let enableVoidtrader = true

    if(bot.config.isicWarframe && bot.config.isicWarframe.voidtrader) {
        enableVoidtrader = bot.config.isicWarframe.voidtrader.disable || true
    }

    if(enableAlerts) {
        require("./src/alerts.js")(bot,
            Object.assign({},
                {phrases: [], importantPhrases: [], ignores: []},
                bot.config.isicWarframe.alerts
            )
        )
    }

    if(enableVoidtrader) {
        require("./src/voidtrader.js")(bot)
    }
}
