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

    bot.command("fissures", (res, args) => {
        const ws = worldState()

        if(!ws) {
            console.error("No warframe worldstate found")
            return
        }

        const fissures = ws.fissures.sort((a, b) => a.tierNum - b.tierNum)

        function clearTier(tier) {
            [1, 2, 3, 4].forEach(n => tier = tier.replace(` (Tier ${n})`, "").trim())
            return tier
        }

        let fissureList = fissures.map(f => `${clearTier(f.tier)} - **${f.missionType}** on ${f.node}`)

        res.send(`:fish_cake: Current Void Fissures:\n\n${fissureList.join("\n")}`)
    })
}
