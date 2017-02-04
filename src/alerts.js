const FeedParser = require("feedparser")
const Readable = require("stream").Readable
const WorldState = require("warframe-worldstate-parser")

module.exports = function(bot, alertConfig) {
    function worldState() {
        let worldState = bot.mydb.get("isicWarframeWorldState").value()

        if(!worldState) {
            return null
        }

        let data = JSON.stringify(worldState)
        return new WorldState(data)
    }

    function minutesUntil(date) {
        let pad = n => n < 10 ? `0${n}` : `${n}`
        let diff = date - (new Date())
        const SECOND = 1000
        const MINUTE = SECOND * 60
        const HOURS = MINUTE * 60
        let minutes = diff / MINUTE | 0
        return `${minutes} minutes`
    }

    function getAlerts(callback) {
        let link = "http://content.warframe.com/dynamic/rss.php"
        bot.request(link, (err, response, body) => {
            if(err) {
                console.error(`ERR: error with connection to ${link}: ${err.name} ${err.message}`)
                console.error(err)
                return []
            }

            let feedparser = new FeedParser()

            feedparser._alerts = []

            feedparser.on("error", err => {
                console.error(`ERR: error with connection to ${link}: ${err.name} ${err.message}`)
                console.error(err)
            })

            feedparser.on("readable", function() {
                let article = null

                while(article = this.read()) {
                    this._alerts.push(article)
                }
            })

            feedparser.on("end", function() {
                console.log(`${this._alerts.length} alerts found on ${link}`)
                callback(this._alerts)
            })

            // convert string into stream
            let bodyStream = new Readable()
            bodyStream._read = function() {}
            bodyStream.push(body)
            bodyStream.push(null)

            bodyStream.pipe(feedparser)
        })
    }

    function setupDb(server) {
        bot.db(server).defaults({
            isicWarframeAlertsChannels: [],
            isicWarframeProcessedAlerts : []
        }).value()
    }

    bot.command("alerts", (res, args) => {
        const ws = worldState()

        if(!ws) {
            console.error("No warframe worldstate found, skip alerts check")
            return
        }

        const alerts = ws.alerts

        function rewards(alert) {
            const items = alert.mission.reward.items
            const credits = alert.mission.reward.credits
            const countedItems = alert.mission.reward.countedItems

            let rewards = (credits > 0 ? [`${credits} Credits`] : []).concat(items.concat(countedItems.map(i => `${i.count}x ${i.type}`)))

            return `${rewards.join(", ")}`
        }

        const alertStrings = alerts.sort((a, b) => a.expiry.getTime() - b.expiry.getTime()).map(a =>
            `${a.mission.description ? "**" + a.mission.description + "**\n" : ""}**Alert**: ${a.mission.type} on ${a.mission.node}` +
            ` (${a.mission.faction}, ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel})\n**Rewards**: ${rewards(a)}\n` +
            `**Time**: ${minutesUntil(a.expiry)} remaining.\n`)

        res.send(":balloon: Current alerts:\n\n" + alertStrings.join("\n"))
    })

    bot.command("warframe alert", (res, args) => {
        setupDb(res.server)

        if(!bot.isServerAdministrator(res.server, res.author)) {
            res.reply("I'm sorry but you don't have the permission to do that.")
            return
        }

        if(args[0] === "register") {
            let alreadyExists = bot.db(res.server).get("isicWarframeAlertsChannels").value().indexOf(res.channelId) > -1

            if(!alreadyExists) {
                bot.db(res.server).get("isicWarframeAlertsChannels").push(res.channelId).value()
                res.send("Added this channel to my list.")
            } else {
                res.send("This channel is already on my list.")
            }
        } else if(args[0] === "unregister"){
            let state = bot.db(res.server).getState()
            let index = state.isicWarframeAlertsChannels.indexOf(res.channelId)

            if(index > -1) {
                state.isicWarframeAlertsChannels.splice(index, 1)
                bot.db(res.server).setState(state)

                res.send("Removed this channel from my list.")
            } else {
                res.send("This channel is not even on my list, lol.")
            }
        } else {
            res.reply("I don't know what to do with [" + args.join(" ") + "]")
        }
    })

    bot.interval("isic-warframe-alert-check", _ => {
        getAlerts(alerts => {
            for(let server of bot.servers) {
                setupDb(server)

                let alertChannels = bot.db(server).get("isicWarframeAlertsChannels")
                let processedAlerts = bot.db(server).get("isicWarframeProcessedAlerts")

                for(let alert of alerts) {
                    // alert is not known
                    if(processedAlerts.indexOf(alert.guid) == -1) {
                        const phrases = alertConfig.phrases
                        const importantPhrases = alertConfig.importantPhrases
                        const ignores = alertConfig.ignores

                        const matchedPhrase = phrases.some(p => alert.title.indexOf(p) > -1)
                        const matchedImportantPhrase = importantPhrases.some(p => alert.title.indexOf(p) > -1)
                        const matchedIgnoredPhrase = ignores.some(i => alert.title.indexOf(i) > -1)

                        if(matchedPhrase || matchedImportantPhrase) {
                            if(!matchedIgnoredPhrase) {
                                console.log("[X] alert matches phrase " + alert.title)

                                let modlink = ""

                                if(alert.title.indexOf("(Mod)") > -1) {
                                    let name = alert.title.split(" (Mod)")[0]
                                    modlink = `<http://warframe.wikia.com/wiki/${encodeURIComponent(name)}>`
                                }

                                let icon = ":tophat:"

                                if(matchedImportantPhrase) {
                                    icon = "@here :star:"
                                }

                                for(let channelId of alertChannels) {
                                    console.log(alert.title)
                                    bot.sendMessageToChannel(bot.client.channels.get(channelId), `${icon} ${alert.title} - ${alert.description} ${modlink}`).then(message => {
                                        bot.db(server).get("isicWarframeProcessedAlerts").push(alert.guid).value()
                                    })
                                }
                            }
                        }
                    }
                }
            }
        })
    })
}
