
// const { clientId, guildId, token, publicKey } = require('./config.json');
require('dotenv').config()
const APPLICATION_ID = process.env.APPLICATION_ID 
const TOKEN = process.env.TOKEN 
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set'
const GUILD_ID = process.env.GUILD_ID 


const axios = require('axios')
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');


const app = express();
// app.use(bodyParser.json());

const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
	"Access-Control-Allow-Headers": "Authorization",
	"Authorization": `Bot ${TOKEN}`
  }
});

/*client.on('message', message=> {
  if (message.content ==='a') {
      message.channel.send ('b');
 }
});*/



app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  /*if (message.content.includes(1 + '分')) {
    message.channel.send('1分数えます');
    message.react('????');
  
    function sleep(waitSec, callbackFunc) {
        var spanedSec = 0;
        var id = setInterval(function() {
            spanedSec++;
            if (spanedSec >= waitSec) {
                clearInterval(id);
                if (callbackFunc) callbackFunc();
            }
        }, 1000);
    }
    sleep(60, function() {
      message.channel.send('時間です');
      return;
    });
  }*/

  if (interaction.type === InteractionType.message){
    // 最後のメッセージを取得
    let last_message = (await discord_api.get(`/channels/${interaction.channel_id}/messages`)).data[0]
    console.log(last_message)
    // メッセージが"a"だったら"b"を返す
    if(last_message.content == 'a'){
      // https://discord.com/developers/docs/resources/channel#create-message
      let res = await discord_api.post(`/channels/${interaction.channel_id}/messages`,{
        content:'b',
      })
      console.log(res.data)
    }
  }


  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name)
    if(interaction.data.name == 'yo'){
      // 初期応答を送信
      discord_api.post(`/interactions/${interaction.id}/${interaction.token}/callback`, {
        type: 5, // ACK_WITH_SOURCE
      });
  
      setTimeout(() => {
        // 5秒後にメッセージを送信
        discord_api.post(`/webhooks/${process.env.APPLICATION_ID}/${interaction.token}`, {
          content: `test ${interaction.member.user.username}!`
        });
      }, 60000); // 5000ミリ秒（5秒）後にメッセージを送信します
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
    
    if(interaction.data.name == 'timer'){
      // タイマーセットの通知
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `タイマーをセットしました ${interaction.member.user.username}!`
        }
      });

      // 1分後にリマインドする
      setTimeout(async () => {
        try{
          let res = await discord_api.post(`/interactions/${interaction.id}/${interaction.token}/callback`,{
            type: 4,
            data: {
              content: `時間ですよ ${interaction.member.user.username}!`
            }
          })
          console.log(res.data)
        }catch(e){
          console.log(e)
        }
      }, 60000)

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


app.get('/', async (req,res) =>{
  return res.send('Follow documentation ')
})


app.listen(8999, () => {

})

