// import the discord.js module
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const request = require('superagent');
const commands = require('./commands.json');

const apiKey = 'AIzaSyCblHeaMqXONLZDiaIUFI7Q5Nezd1s5RQU';

const bot = new Discord.Client();

const token = 'MzAwNTA1Mjg3MDQxNzQ0OTIz.C8tepA.9eu6fSytgKh8NqbtWGu1JqtiZRs';
const streamOptions = {seek: 0, volume: 1};

var videoIDs = [];
var videoLengths = [];
var enemySpotted = false;

bot.on('ready', () => {
    console.log('I am ready!');
});

bot.on('message', message => {
    if((message.content.toUpperCase().includes('ENEMYSPOTTED') || message.content.toUpperCase().includes('ENEMY SPOTTED')) && !enemySpotted)
    {
        if(message.member.voiceChannel)
        {
            enemySpotted = true;
            message.member.voiceChannel.join()
                .then(connection => {
                    const dispatcher = connection.playFile('C:/Users/Will/billofbot/ct_enemys.wav');
                    dispatcher.on('end', () => {
                        connection.disconnect();
                        enemySpotted = false;
                    });
                }).catch(console.error);
        }
        else
            message.channel.send('You are not in a voice channel!');
    }
    if(message.content.toUpperCase() === "#help")
    {
        console.log(commands);
    }
    if(message.content.toUpperCase().includes('#YT '))
    {
        var args = message.content.split(/ (.+)/)[1];
        if(args.includes('youtube.com/watch?v') || args.includes('youtu.be'))
        {
            if(message.member.voiceChannel)
            {
                message.member.voiceChannel.join().then(connection => {
                    const stream = ytdl(args, {filter: 'audioonly'});
                    const dispatcher = connection.playStream(stream, streamOptions);
                    nowPlaying(message, id);
                    dispatcher.on('end', () => {
                        connection.disconnect();
                    });
                }).catch(console.error);
            }
            else
                message.channel.send("You are not in a voice channel!");
        }

        else
        {
            videoIDs = [];
            videoLengths = [];
            var reqUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + args + '&maxResults=5&key=' + apiKey;
            request(reqUrl, (error, response) => {
                var toSend = '';
                let i;
                for(i in response.body.items)
                {
                    let messageNum = parseInt(i) + 1;
                    //message.channel.send('#' + messageNum + ' ' + response.body.items[i].snippet.title);
                    videoIDs.push(response.body.items[i].id.videoId);
                    request(`https://www.googleapis.com/youtube/v3/videos?id=${videoIDs[i]}&part=contentDetails&key=${apiKey}`, (error, response) => {
                        try
                        {
                            videoLengths.push(response.body.items[0].contentDetails.duration);
                        }
                        catch(error)
                        {
                            console.log(error);
                            videoLengths.push("PT00M00S");
                        }
                    });
                    if(i === 0)
                    {
                        toSend += '`' + messageNum + '` ' + response.body.items[i].snippet.title + " — " + response.body.items[i].snippet.channelTitle + " — `" + videoLengths[i] + "`";
                    }
                    else
                    {
                        toSend += '\n`' + messageNum + '` ' + response.body.items[i].snippet.title + " — " + response.body.items[i].snippet.channelTitle + " — `"  + videoLengths[i] + "`";
                    }
                }
                console.log(videoLengths[2]);
                message.channel.send(toSend + '\nUse `#ytc` to choose a video.');
            });
        }
    }
    if(message.content.toUpperCase().includes('#YTC '))
    {
        var args = message.content.split(' ')[1];
        if(parseInt(args) > 5 || !parseInt(args))
        {
            message.channel.send('You must choose a video from the list!');
        }
        else
        {
            var id = videoIDs[parseInt(args) - 1];
            if(message.member.voiceChannel)
            {
                message.member.voiceChannel.join().then(connection => {
                    const stream = ytdl('http://youtube.com/watch?v=' + id, {filter: 'audioonly'});
                    const dispatcher = connection.playStream(stream, streamOptions);
                    nowPlaying(message, id);
                    dispatcher.on('end', () => {
                        connection.disconnect();
                    });
                }).catch(console.error);
            }
            else
                message.channel.send("You are not in a voice channel!");
        }
    }
    if(message.content.toUpperCase() === '#STOP' || message.content.toUpperCase() === '#LEAVE')
    {
        try
        {
            message.guild.voiceConnection.disconnect();
        }
        catch(error)
        {
            message.channel.send("I can't leave a channel if I'm not in one!");
        }
    }
    if(message.content.toUpperCase() === '#UPTIME')
    {
        message.channel.send('Uptime: ' + bot.uptime / 1000 + ' seconds.');
    }
});
function nowPlaying(message, id) {
    message.channel.send("Now playing: " + 'http://youtube.com/watch?v=' + id);
}
bot.login(token);