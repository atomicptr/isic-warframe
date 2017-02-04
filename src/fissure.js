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

    function minutesUntil(date) {
        let pad = n => n < 10 ? `0${n}` : `${n}`
        let diff = date - (new Date())
        const SECOND = 1000
        const MINUTE = SECOND * 60
        const HOURS = MINUTE * 60
        let minutes = diff / MINUTE | 0
        return `${minutes} minutes`
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

        let fissureList = fissures.map(f => `${clearTier(f.tier)} - **${f.missionType}** on ${f.node}, ${minutesUntil(f.expiry)} remaining.`)

        res.send(`:fish_cake: Current Void Fissures:\n\n${fissureList.join("\n")}`)
    })
}
