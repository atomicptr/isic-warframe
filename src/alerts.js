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

    function setupDb(server) {
        bot.db(server).defaults({
            isicWarframeAlertsChannels: [],
            isicWarframeProcessedAlerts : []
        }).value()
    }

    // TODO: refactor this shitty method
    function rewardify(server, item) {
        if(item.indexOf("Endo") >= 0) {
            item = item.split("Endo")[0] + res.serverEmoji("WF_Endo", "Endo")
        }

        if(item.indexOf("Orokin Catalyst") >= 0) {
            let index = item.indexOf("Orokin Catalyst")
            item = item.substring(0, index) + bot.serverEmoji(server, "WF_BluePotato", "") + item.substring(index, item.length)
        }

        if(item.indexOf("Orokin Reactor") >= 0) {
            let index = item.indexOf("Orokin Reactor")
            item = item.substring(0, index) + bot.serverEmoji(server, "WF_GoldPotato", "") + item.substring(index, item.length)
        }

        if(item.indexOf("Forma") >= 0) {
            let index = item.indexOf("Forma")
            item = item.substring(0, index) + bot.serverEmoji(server, "WF_Forma", "") + item.substring(index, item.length)
        }

        return item
    }

    function rewards(server, reward) {
        const items = reward.items
        const credits = reward.credits
        const countedItems = reward.countedItems

        let newitems = items.map(i => rewardify(server, i))

        let rewards = (credits > 0 ? [`${credits.toLocaleString()} ${bot.serverEmoji(server, "WF_Credits", "Credits")}`] : []).concat(newitems.concat(countedItems.map(i => `${i.count}x ${i.type}`)))

        return `${rewards.join(", ")}`
    }

    bot.command("alerts", (res, args) => {
        const ws = worldState()

        if(!ws) {
            console.error("No warframe worldstate found, skip alerts check")
            return
        }

        const alerts = ws.alerts

        const alertStrings = alerts.sort((a, b) => a.expiry.getTime() - b.expiry.getTime()).map(a =>
            `${a.mission.description ? "**" + a.mission.description + "**\n" : ""}**Alert**: ${a.mission.type} on ${a.mission.node}` +
            ` (${a.mission.faction}, ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel})\n**Rewards**: ${rewards(res.server, a.mission.reward)}\n` +
            `**Time**: ${minutesUntil(a.expiry)} remaining.\n`)

        res.send(res.serverEmoji("WF_Lotus", ":balloon:") + " Current alerts:\n\n" + alertStrings.join("\n"))
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
        const ws = worldState()

        if(!ws) {
            console.error("No warframe worldstate found, skip alerts check")
            return
        }

        const alerts = ws.alerts
        const invasions = ws.invasions

        bot.forEveryDatabase((owner, db) => db.getState().isicWarframeAlertsChannels, (owner, db) => {
            setupDb(owner)

            let alertChannels = db.get("isicWarframeAlertsChannels")
            let processedAlerts = db.get("isicWarframeProcessedAlerts")

            for(let alert of alerts) {
                if(processedAlerts.indexOf(alert.id) == -1) {
                    const phrases = alertConfig.phrases
                    const importantPhrases = alertConfig.importantPhrases
                    const ignores = alertConfig.ignores

                    const items = alert.mission.reward.items.concat(alert.mission.reward.countedItems.map(i => `${i.count}x ${i.type}`))

                    const matchedPhrase = items.some(item => phrases.some(p => item.indexOf(p) > -1))
                    const matchedImportantPhrase = items.some(item => importantPhrases.some(p => item.indexOf(p) > -1))
                    const matchedIgnoredPhrase = items.some(item => ignores.some(p => item.indexOf(p) > -1))

                    if(matchedPhrase || matchedImportantPhrase) {
                        if(!matchedIgnoredPhrase) {
                            for(let channelId of alertChannels) {
                                console.log(alert)
                                bot.sendMessageToChannel(bot.client.channels.get(channelId),
                                    `${matchedImportantPhrase ? "@here " : ""}${alert.mission.description ? "**" + alert.mission.description + "**\n" : ""}**Alert**: ${alert.mission.type} on ${alert.mission.node}` +
                                    ` (${alert.mission.faction}, ${alert.mission.minEnemyLevel} - ${alert.mission.maxEnemyLevel})\n**Rewards**: ${rewards(owner, alert.mission.reward)}\n` +
                                    `**Time**: ${minutesUntil(alert.expiry)} remaining.\n`
                                )
                                .then(message => {
                                    db.get("isicWarframeProcessedAlerts").push(alert.id).value()
                                })
                            }
                        }
                    }
                }
            }

            for(let invasion of invasions) {
                if(!invasion.completed && processedAlerts.indexOf(invasion.id) == -1) {
                    const phrases = alertConfig.phrases
                    const importantPhrases = alertConfig.importantPhrases
                    const ignores = alertConfig.ignores

                    const attackerRewards = invasion.attackerReward.items.concat(invasion.attackerReward.countedItems.map(i => `${i.count}x ${i.type}`))
                    const defenderRewards = invasion.attackerReward.items.concat(invasion.attackerReward.countedItems.map(i => `${i.count}x ${i.type}`))

                    const items = attackerRewards.concat(defenderRewards)

                    const matchedPhrase = items.some(item => phrases.some(p => item.indexOf(p) > -1))
                    const matchedImportantPhrase = items.some(item => importantPhrases.some(p => item.indexOf(p) > -1))
                    const matchedIgnoredPhrase = items.some(item => ignores.some(p => item.indexOf(p) > -1))

                    if(matchedPhrase || matchedImportantPhrase) {
                        if(!matchedIgnoredPhrase) {
                            for(let channelId of alertChannels) {
                                console.log(invasion)

                                let str = `${matchedImportantPhrase ? "@here " : ""}${invasion.desc ? "**" + invasion.desc + "**\n" : ""}`
                                str += `**Invasion**: ${invasion.attackingFaction} vs ${invasion.defendingFaction} on ${invasion.node}\n`

                                if(invasion.attackingFaction !== "Infested") {
                                    str += `**${invasion.attackingFaction} Rewards**: ${rewards(owner, invasion.attackerReward)}\n`
                                }

                                if(invasion.defendingFaction !== "Infested") {
                                    str += `**${invasion.defendingFaction} Rewards**: ${rewards(owner, invasion.defenderReward)}\n`
                                }

                                str += `**Progress**: ${invasion.completion.toFixed(2)}%\n`

                                bot.sendMessageToChannel(bot.client.channels.get(channelId), str).then(message => {
                                    db.get("isicWarframeProcessedAlerts").push(invasion.id).value()
                                })
                            }
                        }
                    }
                }
            }
        })
    })
}
