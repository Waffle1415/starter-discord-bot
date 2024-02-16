
// const { clientId, guildId, token, publicKey } = require('./config.json');
require('dotenv').config()
const APPLICATION_ID = process.env.APPLICATION_ID 
const TOKEN = process.env.TOKEN 
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID 


const axios = require('axios')
const express = require('express');
const Discord = require('discord.js');
const client = new Discord.Client();
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');


const app = express();
// app.use(bodyParser.json());

const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 30000,
  headers: {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
	"Access-Control-Allow-Headers": "Authorization",
	"Authorization": `Bot ${TOKEN}`
  }
});

app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name)
    if(interaction.data.name == 'yo'){
      // 初期応答を送信
      discord_api.post(`/interactions/${interaction.id}/${interaction.token}/callback`, {
        type: 5, // ACK_WITH_SOURCE
      });

      // 取得したinteraction.data.nameを表示
      console.log(interaction.data.name);
  
      setTimeout(() => {
        // 5秒後にメッセージを送信
        discord_api.post(`/webhooks/${process.env.APPLICATION_ID}/${interaction.token}`, {
          content: `test ${interaction.member.user.username}!`
        });
      }, 5000); // 5000ミリ秒（5秒）後にメッセージを送信します
    }

    if(interaction.data.name == 'dm'){
      // https://discord.com/developers/docs/resources/user#create-dm
      let c = (await discord_api.post(`/users/@me/channels`,{
        recipient_id: interaction.member.user.id
      })).data
      try{
        // https://discord.com/developers/docs/resources/channel#create-message
        let res = await discord_api.post(`/channels/${c.id}/messages`,{
          content:'Yo! I got your slash command. I am not able to respond to DMs just slash commands.',
        })
        console.log(res.data)
      }catch(e){
        console.log(e)
      }

      return res.send({
        // https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data:{
          content:'👍'
        }
      });
    }
    
    let intervalId;

    if(interaction.data.name == 'timer'){
      // 初期応答を送信
      await discord_api.post(`/interactions/${interaction.id}/${interaction.token}/callback`, {
        type: 5, // ACK_WITH_SOURCE
      });
    
      let c = (await discord_api.post(`/users/@me/channels`,{
        recipient_id: interaction.member.user.id
      })).data
    
      // setIntervalを使用して10秒ごとにメッセージを送信
      intervalId = setInterval(async () => {
        try{
          let res = await discord_api.post(`/channels/${c.id}/messages`,{
            content:'時間だよ～',
          })
          console.log(res.data)
          await discord_api.post(`/interactions/${interaction.id}/${interaction.token}/callback`, {
            type: 5, // ACK_WITH_SOURCE
          });
        }catch(e){
          console.log(e)
          try {
            await discord_api.post(`/webhooks/${process.env.APPLICATION_ID}/${interaction.token}`, {
              content: `エラーが発生しました。もう一度お試しください。`
            });
          } catch (error) {
            console.error('Failed to send error message:', error);
          }
        }
      }, 10 * 1000);
    }

    if(interaction.data.name == 'stop'){
      // 'stop'コマンドが受け取られたときにインターバルをクリアする
      clearInterval(intervalId);

      // stopメッセージを送信
      try {
        let c = (await discord_api.post(`/users/@me/channels`,{
          recipient_id: interaction.member.user.id
        })).data

        await discord_api.post(`/channels/${c.id}/messages`,{
          content:'タイマーを停止しました。',
        })
      } catch(e) {
        console.log(e)
        try {
          await discord_api.post(`/webhooks/${process.env.APPLICATION_ID}/${interaction.token}`, {
            content: `エラーが発生しました。もう一度お試しください。`
          });
        } catch (error) {
          console.error('Failed to send stop message:', error);
        }
      }
    }

    
  }

});



app.get('/register_commands', async (req,res) =>{
  let slash_commands = [
    {
      "name": "yo",
      "description": "replies",
      "options": []
    },
    {
      "name": "dm",
      "description": "sends user a DM",
      "options": []
    },
    {
      "name": "timer",
      "description": "sets a timer for you",
      "options": []
    },
    {
      "name": "stop",
      "description": "stops the timer",
      "options": []
    }

  ]
  try
  {
    // api docs - https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
    let discord_response = await discord_api.put(
      `/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      slash_commands
    )
    console.log(discord_response.data)
    return res.send('commands have been registered')
  }catch(e){
    console.error(e.code)
    console.error(e.response?.data)
    return res.send(`${e.code} error from discord`)
  }
})


// 10秒ごとにメッセージを送信する
app.post('/send-message', (req, res) => {
  // メッセージを送信するチャンネルのIDを取得します
  const channelId = req.body.channelId;
  // 送信するメッセージを取得します
  const message = req.body.message;

  // チャンネルを取得します
  const channel = client.channels.cache.get(channelId);

  // メッセージを送信します
  if (channel) {
    setInterval(() => {
      channel.send(message);
    }, 10 * 1000); // 10秒ごとにメッセージを送信します
  }

  res.send('Message sent');
});


app.listen(8999, () => {

})

