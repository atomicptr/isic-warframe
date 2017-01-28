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
            isicWarframeSortieChannels: [],
            isicWarframeProcessedSorties: []
        }).value()
    }

    bot.command("warframe sorties", (res, args) => {
        setupDb(res.server)

        if(!bot.isServerAdministrator(res.server, res.author)) {
            res.reply("I'm sorry but you don't have the permission to do that, Tenno.")
            return
        }

        if(args[0] === "register") {
            let alreadyExists = res.db.get("isicWarframeSortieChannels").value().indexOf(res.channelId) > -1

            if(!alreadyExists) {
                res.db.get("isicWarframeSortieChannels").push(res.channelId).value()
                res.send("Added this channel to my list.")
            } else {
                res.send("This channel is already on my list.")
            }
        } else if(args[0] === "unregister") {
            let state = res.db.getState()
            let index = state.isicWarframeSortieChannels.indexOf(res.channelId)

            if(index > -1) {
                state.isicWarframeSortieChannels.splice(index, 1)
                res.db.setState(state)

                res.send("Removed this channel from my list.")
            } else {
                res.send("This channel is not even on my list, lol.")
            }
        } else {
            res.reply("I don't know what to do with [" + args.join(" ") + "]")
        }
    })

    bot.interval("isic-warframe-sortie-check", _ => {
        const ws = worldState()

        if(!ws) {
            console.error("No warframe worldstate found, skip sortie check")
            return
        }

        const sortie = ws.sortie

        bot.forEveryDatabase((owner, db) => db.getState().isicWarframeSortieChannels, (owner, db) => {
            setupDb(owner)

            let channels = db.get("isicWarframeSortieChannels")

            for(let channelId of channels) {
                let processedSorties = bot.db(owner).get("isicWarframeProcessedSorties")

                let visitIdentifier = bot.hash(`sortie_${channelId}_${sortie.id}`)

                if(processedSorties.indexOf(visitIdentifier) == -1) {
                    let now = new Date()

                    if(now > sortie.activation) {
                        let counter = 1
                        let sortieList = sortie.variants.map(v => `${counter++}. **${v.missionType}** on ${v.node}\n\tModifier: ${v.modifier}`)

                        bot.sendMessageToChannel(bot.client.channels.get(channelId),
                            `:briefcase: New Sorties:\n\n${sortieList.join("\n")}`)
                        .then(_ => {
                            bot.db(owner).get("isicWarframeProcessedSorties").push(visitIdentifier).value()
                        })
                    }
                }
            }
        })
    })
}
