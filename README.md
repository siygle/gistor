## gistor

A simple CLI tool which could let you manage gist easily.

## Usage
Install gistor using npm  
```
npm install -g gistor
```

First setup your authorization information.  
```
gistor --login --user {USERNAME} --pass {PASSWORD}
```
It will call github [Authorization](http://developer.github.com/v3/oauth/#create-a-new-authorization) and create new one. If it success, will save return value to `.gistor` in your home directory. Then you can start using gistor to manage your gist right now!

### create
```
gistor --create [--desc] {DESC} [files...]
```
Create a gist contains the files you given. You can also write the description using `--desc`.

### delete
```
gistor --remove [gist id]
```
Delete the specific gist based on specific id.

### list
```
gistor --list
```
It will list your gist, including Id and description. (Id is necessary in following action)
