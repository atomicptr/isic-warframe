function isDefinedNested(obj, args) {
    if(typeof args !== "undefined") {
        args = []
    }

    for(let i = 0; i < args.length; i++) {
        if(!obj || !obj.hasOwnProperty(args[i])) return false

        obj = obj[args[i]]
    }

    return true
}

module.exports = function(bot) {

    let enableAlerts = true

    if(isDefinedNested(bot.config.isicWarframe, ["alerts"])) {
        enableAlerts = bot.config.isicWarframe.alerts.disable || true
    }

    if(enableAlerts) {
        require("./src/alerts.js")(bot,
            Object.assign({},
                {phrases: [], importantPhrases: [], ignores: []},
                bot.config.isicWarframe.alerts
            )
        )
    }
}
