# isic-warframe

Warframe module for the [Discord](https://discordapp.com) bot [isic](https://github.com/atomicptr/isic).

## Usage

`!warframe alert register/unregister`

Register/unregister the current channel for alert auto posts, check **Configs**.

`!alerts`

Lists all current alerts.

`!warframe voidtrader register/unregister`

Register/unregister the current channel for auto posts when Baro'Ki Teer arrives.

`!warframe sorties register/unregister`

Register/unregister the current channel for auto posts when new Sorties appear.

`!sorties`

Post the currently active sorties.

`!fissures`

Post the currently active void fissures.

## Configs

You can filter alerts by using ```phrases```, ```importantPhrases``` and ```ignores```.

* ```phrases``` are the phrases the bot is supposed to do, it's basically a whitelist.
* ```importantPhrases``` are kinda the same as phrases with the difference that the bot will post them with an ```@here``` to trigger a notification
* ```ignores``` a blacklist of phrases, if something is triggered by one of the above options you can ignore it again with this.

```json
...
    "isicWarframe": {
        "platform": "pc",
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

### Get PS4 or XB1 data instead

The bot supports the console world states you just have to put the "platform" option into "isicWarframe" like this for PS4:

```json
...
    "isicWarframe": {
        "platform": "ps4"
    },
...
```

or this for XB1:

```json
...
    "isicWarframe": {
        "platform": "xb1"
    },
...
```

## Emoji

If you want to see Warframe icons instead of text in your server upload the emojis in assets/emoji to your server with the exact same name (`WF_Credits.png` must be named `WF_Credits`), the bot will try to look them up and post them if available instead of the text.

These emoji icons are from the [Warframe Discord Emoji](https://github.com/Warframe-Community-Developers/warframe-discord-emoji)

## License

MIT
