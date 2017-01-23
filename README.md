# isic-warframe

Warframe module for the [Discord](https://discordapp.com) bot [isic](https://github.com/atomicptr/isic).

## Usage

`!warframe alert register/unregister`

Register/unregister the current channel for alert auto posts, check **Configs**.

`!warframe alerts`

Lists all current alerts.

`!warframe voidtrader register/unregister`

Register/unregister the current channel for auto posts when Baro'Ki Teer arrives.

## Configs

You can filter alerts by using ```phrases```, ```importantPhrases``` and ```ignores```.

* ```phrases``` are the phrases the bot is supposed to do, it's basically a whitelist.
* ```importantPhrases``` are kinda the same as phrases with the difference that the bot will post them with an ```@here``` to trigger a notification
* ```ignores``` a blacklist of phrases, if something is triggered by one of the above options you can ignore it again with this.

```json
...
    "isicWarframe": {
        "alerts": {
            "phrases": [
                "(Mod)",
                "(Blueprint)",
                "Gift From The Lotus",
                "Gift Of The Lotus",
                "Nitain Extract",
                "Orokin Reactor",
                "Orokin Catalyst",
                "Exilus"
            ],
            "importantPhrases": [
                "Gift From The Lotus",
                "Gift Of The Lotus",
                "Orokin Reactor",
                "Orokin Catalyst",
                "Exilus",
                "Forma",
                "Wraith",
                "Vandal"
            ],
            "ignores": []
        }
    }
...
```

## License

MIT
