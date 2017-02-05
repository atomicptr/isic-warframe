const utils = require("./utils.js")

module.exports = function(bot, options) {
    bot.command("fissures", (res, args) => {
        const ws = utils.worldState(bot)

        if(!ws) {
            console.error("No warframe worldstate found")
            return
        }

        const fissures = ws.fissures.sort((a, b) => a.tierNum - b.tierNum)

        function clearTier(tier) {
            [1, 2, 3, 4].forEach(n => tier = tier.replace(` (Tier ${n})`, "").trim())
            return tier
        }

        let fissureList = fissures.map(f => `${clearTier(f.tier)} - **${f.missionType}** on ${f.node}, ${utils.timeUntilString(f.expiry)} remaining.`)

        res.send(`${res.serverEmoji("WF_Lotus", ":fish_cake:")} Current Void Fissures:\n\n${fissureList.join("\n")}`)
    })
}
