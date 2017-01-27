module.exports = function(bot) {
    function getVoidTraderInfo(callback) {
        const url = "https://deathsnacks.com/wf/data/voidtraders.json"

        bot.request(url, (err, response, body) => {
            if(err) {
                console.error(err)
                return
            }

            let json = null

            try {
                json = JSON.parse(body)[0]
            } catch(ex) {
                console.error(ex)
            }

            callback(json)
        })
    }

    function setupDb(server) {
        bot.db(server).defaults({
            isicWarframeVoidtraderChannels: [],
            isicWarframeVoidtraderProcessedVisits: []
        }).value()
    }

    bot.command("warframe voidtrader", (res, args) => {
        setupDb(res.server)

        if(!bot.isServerAdministrator(res.server, res.author)) {
            res.reply("I'm sorry but you don't have the permission to do that, Tenno.")
            return
        }

        if(args[0] === "register") {
            let alreadyExists = bot.db(res.server).get("isicWarframeVoidtraderChannels").value().indexOf(res.channelId) > -1

            if(!alreadyExists) {
                bot.db(res.server).get("isicWarframeVoidtraderChannels").push(res.channelId).value()
                res.send("Added this channel to my list.")
            } else {
                res.send("This channel is already on my list.")
            }
        } else if(args[0] === "unregister") {
            let state = bot.db(res.server).getState()
            let index = state.isicWarframeVoidtraderChannels.indexOf(res.channelId)

            if(index > -1) {
                state.isicWarframeVoidtraderChannels.splice(index, 1)
                bot.db(res.server).setState(state)

                res.send("Removed this channel from my list.")
            } else {
                res.send("This channel is not even on my list, lol.")
            }
        } else {
            res.reply("I don't know what to do with [" + args.join(" ") + "]")
        }

        bot.db(res.server).get("isicWarframeVoidtraderChannels")
    })

    bot.interval("isic-warframe-voidtrader-check", _ => {
        getVoidTraderInfo(baro => {
            if(!baro) {
                console.error("Couldn't load baro for some reason...")
                return
            }

            for(let server of bot.servers) {
                setupDb(server)

                let channels = bot.db(server).get("isicWarframeVoidtraderChannels")

                for(let channelId of channels) {
                    let processedVisits = bot.db(server).get("isicWarframeVoidtraderProcessedVisits")

                    let visitIdentifier = `barokiteer_${channelId}${baro.Activation.sec}`

                    if(processedVisits.indexOf(visitIdentifier) == -1) {
                        let now = new Date()
                        let baroDate = new Date(baro.Activation.sec * 1000)

                        console.log(`New Baro date found: ${baroDate.toLocaleString()}, can i post yet? ${now > baroDate}`)

                        if(now > baroDate) {
                            let itemList = []
                            let itemListStr = ""

                            if(baro.Manifest) {
                                itemList =
                                    baro.Manifest.map(
                                        item => `* **${item.ItemType}** - ${item.PrimePrice.toLocaleString()} Ducats, ${item.RegularPrice.toLocaleString()} Credits`)
                                itemListStr = `\n\nItem List:\n${itemList.join("\n")}`
                            }

                            bot.sendMessageToChannel(bot.client.channels.get(channelId),
                                `@here Baro'Ki Teer has arrived in ${baro.Node}${itemListStr}`)
                            .then(_ => {
                                bot.db(server).get("isicWarframeVoidtraderProcessedVisits").push(visitIdentifier).value()
                            })
                        }
                    }
                }
            }
        })
    })
}
