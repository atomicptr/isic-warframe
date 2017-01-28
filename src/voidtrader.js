const WorldState = require("warframe-worldstate-parser")

module.exports = function(bot, options) {
    function worldState() {
        let worldState = bot.mydb.get("isicWarframeWorldState").value()

        if(!worldState) {
            return null
        }

        let data = JSON.stringify(worldState)
        return new WorldState(data)
    }

    function setupDb(handle) {
        bot.db(handle).defaults({
            isicWarframeVoidtraderChannels: [],
            isicWarframeVoidtraderProcessedVisits: []
        }).value()
    }

    bot.command("warframe voidtrader", (res, args) => {
        setupDb(res)

        if(!bot.isServerAdministrator(res.server, res.author)) {
            res.reply("I'm sorry but you don't have the permission to do that, Tenno.")
            return
        }

        if(args[0] === "register") {
            let alreadyExists = res.db.get("isicWarframeVoidtraderChannels").value().indexOf(res.channelId) > -1

            if(!alreadyExists) {
                res.db.get("isicWarframeVoidtraderChannels").push(res.channelId).value()
                res.send("Added this channel to my list.")
            } else {
                res.send("This channel is already on my list.")
            }
        } else if(args[0] === "unregister") {
            let state = res.db.getState()
            let index = state.isicWarframeVoidtraderChannels.indexOf(res.channelId)

            if(index > -1) {
                state.isicWarframeVoidtraderChannels.splice(index, 1)
                res.db.setState(state)

                res.send("Removed this channel from my list.")
            } else {
                res.send("This channel is not even on my list, lol.")
            }
        } else {
            res.reply("I don't know what to do with [" + args.join(" ") + "]")
        }
    })

    bot.interval("isic-warframe-voidtrader-check", _ => {
        const ws = worldState()

        if(!ws) {
            console.error("No warframe worldstate found, skip voidtrader check")
            return
        }

        const baro = ws.voidTrader

        let now = new Date()
        console.log(`New Baro date found: ${baro.activation}, can i post yet? ${now > baro.activation}`)

        bot.forEveryDatabase((owner, db) => db.getState().isicWarframeVoidtraderChannels, (owner, db) => {
            setupDb(owner)

            let channels = bot.db(owner).get("isicWarframeVoidtraderChannels")

            for(let channelId of channels) {
                let processedVisits = bot.db(owner).get("isicWarframeVoidtraderProcessedVisits")

                let visitIdentifier = bot.hash(`barokiteer_${channelId}_${baro.id}`)

                if(processedVisits.indexOf(visitIdentifier) == -1) {
                    if(now > baro.activation) {
                        let itemList = []
                        let itemListStr = ""

                        if(baro.inventory.length > 0) {
                            itemList =
                                baro.inventory.map(
                                    item => `* **${item.item}** - ${item.ducats.toLocaleString()} Ducats, ${item.credits.toLocaleString()} Credits`)
                            itemListStr = `\n\nItem List:\n${itemList.join("\n")}`
                        }

                        bot.sendMessageToChannel(bot.client.channels.get(channelId),
                            `@here ${baro.character} has arrived in ${baro.location}${itemListStr}`)
                        .then(_ => {
                            bot.db(owner).get("isicWarframeVoidtraderProcessedVisits").push(visitIdentifier).value()
                        })
                    }
                }
            }
        })
    })
}
