---
layout: post
title: A Google Domains IP updater script for dyndns2 incompatible routers
tags: [Python, Raspberry Pi, DNS]
category: Programming
comments: true
---

I was recently making a setup for a home VPN using a Raspberry Pi Zero W and OpenVPN and I ran into a problem when trying to link my home's IP address to my domain. My current DNS provider is Google Domains and it turns out that they use the `dyndns2` protocol for Dynamic DNS, and my router isn't compatible with it. After looking around my configuration I simply couldn't find a sane way to enable it, but I found [here](https://support.google.com/domains/answer/6147083?hl=en) that they have an API to update your Dynamic DNS record. I decided to make a script that could run in background after my Pi's startup so it would update the current IP to Google Domains and keep my domain updated all the time (or most of it).

I know that this may not be the most efficient or reliable solution for this, but I wanted a fast and easy way to go around this issue. Since I was just setting up a personal-home VPN, this helped me for my own purposes, so feel free to accept or reject this if it doesn't fit for you. I am also open for any feedback to improve this short script.


## Prerequisites
- Python (tested on 2.7)
- A Google Domains domain

## Setting up Google Domains
The first step to take is setting up the Dynamic DNS synthetic record that will point to your server. If you don't know how to do this, please make sure you have followed all steps from 1 to 11 from [this page](https://support.google.com/domains/answer/6147083?hl=en).

## Setting up the script
The next step to take is configuring the script. You can clone the latest version [here](https://github.com/erickduran/dynamic-dns-updater) on Github, or copy it from above:
```python
#!/usr/bin/python
import requests
import logging
import time
from urllib2 import urlopen

logging.basicConfig(filename='ddns.log', level=logging.DEBUG, filemode='a', format='%(asctime)s - %(message)s')

username = 'username'
password = 'password'
hostname = 'your-domain.com'
old_ip = ''

while True:
	my_ip = urlopen('https://domains.google.com/checkip').read() 
	if my_ip != old_ip:
		url = 'https://' + username + ':' + password + '@domains.google.com/nic/update?hostname=' + hostname
			response = requests.post(url)
			output = response.content.decode('utf-8')
			if 'good' in output:
				old_ip = my_ip
			logging.debug('Response from DDNS update: '+ output)
	time.sleep(10)
```
You should configure the following variables (all obtained from your Google Domains DNS page):
- `username` 
- `password`
- `hostname`

If you need more help to find this, you can read [this page](https://support.google.com/domains/answer/6147083?hl=en).

You can also configure the line `time.sleep(10)` to a shorter or longer timespan (in seconds). With the current configuration, the script will check if the IP has changed every 10 seconds.

The script includes a few logging lines to keep track of all the requests-responses. This will be stored automatically in a file called `ddns.log`. Feel free to comment this out if you don't need it.

## Running the script

To test the script, just `cd` to the directory where you stored the script and run the following command:
```bash
python ddns.py
```
Wait for the time you specified and check in your Google Domains page that the IP has changed to your current server's public IP address. 

## Configuring for startup

Once you have tested that the script is working on your server, you may want this script to run on background and run it each time your server starts up. You can do this in several different ways, but I decided to do it in the `/etc/rc.local` file. For this, just run:

```bash
sudo nano /etc/rc.local
```

Enter your password, and add the following lines at the end of the file, before `exit 0`.

```bash
printf "Starting Dynamic DNS Script"
sudo python /home/pi/ddns.py &
```

This will print the message "Starting Dynamic DNS Script" on your startup console screen and run the script afterwards. The `&` character at the end of the line will indicate to start the process on background. My script is located and it will run from `/home/pi/`, so just remember that the log file will be created there.

## Final details

Your current domain should now be pointing to your server's public IP address, so know you can access it from any part of the world with one click. In my case, the network is used for my VPN, SSH and a small web server, so I just needed to setup my router's port forwarding to the corresponding apps.

I hope this can help you setup your server in a faster and easier way as it did to me. If you have any comments or suggestions please comment them below.

