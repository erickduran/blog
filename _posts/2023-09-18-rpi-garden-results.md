---
layout: post
title: 'Keeping my plants alive while overseas'
tags: [Python, Raspberry Pi, Gardening, Home Lab]
category: Programming
comments: true
---

During the last couple of months I've been getting into amateur gardening, even though I had planned to go on vacation for a few weeks. In order to keep my plants alive for that time, I set myself the goal, as an automation fan, to create a home-made irrigation system using Python, Raspberry Pi and Telegram, using some other projects I found online as reference.

> Disclaimer: I'm by no means an expert in gardening or electronics, just doing this for fun.

Here's my setup:

![Diagram](https://blog.erickduran.com/public/img/2023-09-18-diagram.png)

Which consists of:
- a Raspberry Pi 3
- a [16 channel 5V relay](https://www.amazon.com/SainSmart-101-70-103-16-Channel-Relay-Module/dp/B0057OC66U)
- 16 [water pumps](https://www.amazon.com/Sipytoph-Submersible-Flexible-Aquariums-Hydroponics/dp/B097F4576N/) (not all in use)
- 13 potted plants
- (optional) a PiCamera

> Spoiler: 9 out of my 13 plants survived the ~20 day period and are in decent health, 2 are in poor health, 1 died a few days before I left, and 1 other died during the experiment (pump got disconnected).

Scroll down for some of the final results (before/after).

## Summary

So, it all starts with my main RPi. This RPi runs a Telegram "bot" using [Telethon](https://docs.telethon.dev/en/stable/) (not actually a *bot* as commonly known in Telegram, it's basically a normal chat), which listens to any commands sent by my Telegram user to the RPi's Telegram user. 

Commands work as any other CLI, you have commands and subcommands, and you start by specifying the RPi you want to target (I have 5, so each one has an alias). We will only work with my main RPi, as this is the one that can actually trigger the garden's circuit.

So we send a message with the format:
```
pi-name water plant-name [seconds]
```

The `water` command has a mapping that translates plant names into GPIO ports. Using the 16-channel relay, each GPIO port toggles the corresponding water pump that has a tube pointing to the appropriate plant. The mapping also contains a default duration for the pump to be running, depending on how much water the specific plant needs.

Here's how the mapping looks like in the code:
```python
class Plant:
	def __init__(self, gpio, alias=None, seconds=5):
		self.gpio = gpio # the gpio port that triggers the pump
		self.alias = alias # plant name
		self.seconds = seconds # the pre-defined time to run the pump

PLANTS = {
	'PLANT_0': Plant(27, 'led'), # for testing
	'PLANT_1': Plant(2, 'garlic', 20),
	'PLANT_2': Plant(3, 'potato', 40),
	'PLANT_3': Plant(4, 'carrot', 30),
	'PLANT_4': Plant(5, 'mint', 10),
	'PLANT_5': Plant(6, 'serrano', 15),
	'PLANT_6': Plant(7, 'pepper', 20),
	'PLANT_7': Plant(8, 'basil', 15),
	'PLANT_8': Plant(9, 'pea', 20),
	'PLANT_9': Plant(10, 'cucumber', 25),
	'PLANT_10': Plant(11, 'corn', 30),
	'PLANT_11': Plant(12, 'tomatillo', 20),
	'PLANT_12': Plant(13, 'avocado', 5),
	'PLANT_13': Plant(14, 'pitaya', 5),
	'PLANT_14': Plant(15, 'p14', 5),
	'PLANT_15': Plant(16, 'p15', 5),
	'PLANT_16': Plant(17, 'p16', 5),
}
```

> How much water is sent (or for how many seconds the pump is turned on) is calibrated by trial and error since there are many factors involved (I've been using pumps from different manufacturers, different tube lengths and heights for the pots).

And that's basically it, that's the "manual" process.

![Diagram](https://blog.erickduran.com/public/img/2023-09-18-pi-watering.png)

![Diagram](https://blog.erickduran.com/public/img/2023-09-18-pi-watering.gif)

### Automation

The garden command can also be triggered using a script, so it's trivial to set up a schedule using `crontab`:

```
15 8 */2 * * python3 /home/momo/pi-utils/scripts/garden.py pepper
17 8 */2 * * python3 /home/momo/pi-utils/scripts/garden.py basil
19 8 */2 * * python3 /home/momo/pi-utils/scripts/garden.py mint
...
```

> Note there is a 2 minute gap between each run, as I've not set up any concurrency.

Even though it's great to have it running all by itself, I actually prefer to run it using the Telegram chat.

## Keeping an eye

While it's easy to set up a schedule every X amount of days to keep the plants watered, I like to keep an eye on them and adjust the water dose depending on how they look. That's why I decided to attach a camera to the RPi and point it to the garden so I can get a live feed using [Motion](https://raspberry-valley.azurewebsites.net/Streaming-Video-with-Motion/). Since my garden is on my roof, this also helps me to troubleshoot and water them even when I'm home without having to go up the ladder all the time.

Some of my RPis host OpenVPN servers to my home network, so I access the live feed by connecting to the VPN. I've also set up a bot command to quickly get a snapshot of all the cameras without having to connect to the VPN.

![Diagram](https://blog.erickduran.com/public/img/2023-09-18-pi-snap.png)

## Redundancy

The bot code is designed to run on multiple hosts, so that allows me to keep redundancy with my other RPis. However, since the hardware is connected to the main RPi, there is not much that I can do with the remaining RPis. That said, I can trigger a reboot, an update, or enable SSH through another RPi in case one of them goes stale. This has been useful in a couple of occasions where the bot process crashed. While I haven't been able to figure out the API usage, I'm planning to plug the RPis to smart plugs and add a trigger so I can hard-reset a RPi if needed.

## Security

Since the bot works through Telegram, there is no need to open up the network to the public. I have some services that I access occasionally, so I also use Telegram to open and close ports as needed using `ufw`, similar to port-knocking but using plain text commands. The bot only responds to the chat I have with myself, so only I can interact with it.

## CI/CD

I host the scripts in GitHub, so each RPi just pulls down the code from there and no build is required. I prefer to update the scripts on demand once I test any changes, so I've set up a bot command for the RPis to update by themselves by pulling down the Git repository and restarting the bot service afterwards.

![Diagram](https://blog.erickduran.com/public/img/2023-09-18-pi-update.png)

## Pending work
- While there is more than one set up out there that uses humidity sensors to take plant monitoring one step further, I've found that those available online tend to corrode pretty fast, so that's why I've been holding off implementing them for now. 
- Right now, I'm using two 20L water containers which need to be refilled frequently, and there is no way for me to check the current level. The end goal is to plug this into my own piping to avoid that problem entirely.
- Clean up the code!

## Before / after

### Cucumber

![Before](https://blog.erickduran.com/public/img/2023-09-18-cucumber-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-cucumber-after.jpg)

### Serrano pepper

![Before](https://blog.erickduran.com/public/img/2023-09-18-serrano-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-serrano-after.jpg)

### Potato

![Before](https://blog.erickduran.com/public/img/2023-09-18-potato-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-potato-after.jpg)

### Mint

![Before](https://blog.erickduran.com/public/img/2023-09-18-mint-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-mint-after.jpg)

### Garlic

![Before](https://blog.erickduran.com/public/img/2023-09-18-garlic-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-garlic-after.jpg)

### Bell pepper

![Before](https://blog.erickduran.com/public/img/2023-09-18-pepper-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-pepper-after.jpg)

### Basil

![Before](https://blog.erickduran.com/public/img/2023-09-18-basil-before.png)
![After](https://blog.erickduran.com/public/img/2023-09-18-basil-after.jpg)
