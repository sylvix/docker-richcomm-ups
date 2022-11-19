# docker-richcomm-ups
Docker image for richcomm-based "ups_monitor" software

## What is this (really)
Chinese UPS devices by SVC (https://www.svcpower.com/) don't really work with NUT (Network UPS Tools). 
My Smart-series UPS is only detected by NUT with "richcomm" driver and it doesn't show correct information about power.
However it came with a CD with "Power Tools" software for all OS-es including Linux as compiled ELF files.
I'm now trying to make this software work in a separate docker container.
The main goal is to get maximum amount of information from UPS for which I will employ a simple NodeJS (probably express) server with single JSON route to get info from.

## Plans (MVP)
* Create simple NodeJS application which will execute "ups_status" on-demand and return all the data parsed with RegEx in JSON format.
* Create Home Assistant integration

## Contribution
If anyone is interested in this, PRs are always welcome. What could be done:
* Configuration (set time before shutdown, etc)
* Correct configurable shutdown script with all needed permissions
