const { MessageEmbed } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const ee = require(`${process.cwd()}/botconfig/embed.json`);
const settings = require("../botconfig/settings.json");
const fetch = require("node-fetch")
module.exports = {
  name: "chat", //the command name for the Slash Command
  description: "Chat with the Bot", //the command description for Slash Command Overview
  cooldown: 5,
  options: [
		{"String": { name: "chat_text", description: "Wanna Chat with me?", required: false }}, 
  ],
  run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
    try{
    //console.log(interaction, StringOption)
		await interaction?.deferReply({ ephemeral: true })
		//things u can directly access in an interaction!
		const { member, channelId, guildId, applicationId, 
		        commandName, deferred, replied, ephemeral, 
				options, id, createdTimestamp 
		} = interaction; 
		const { guild } = member;
		//let IntOption = options.getInteger("OPTIONNAME"); //same as in IntChoices //RETURNS NUMBER
		const Text = options.getString("chat_text"); //same as in StringChoices //RETURNS STRING 
		try{
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini_api_key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: Text }] }],
          generationConfig: { maxOutputTokens: 500 }
        })
      })
      .then(res => res.json())
      .then(data => {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          interaction?.editReply({content: reply.substring(0, 2000), ephemeral: true}).catch(e => console.log("CHATBOT:".underline.red + " :: " + e.stack.toString().grey));
        } else {
          interaction?.editReply({content: ":cry: **Sorry I am clueless... I can't generate a response!**", ephemeral: true}).catch(e => console.log("CHATBOT:".underline.red + " :: " + e.stack.toString().grey));
        }
      })
      .catch(() => {
        interaction?.editReply({content: ":cry: **Sorry I am clueless... I can't connect to the API!**", ephemeral: true}).catch(e => console.log("CHATBOT:".underline.red + " :: " + e.stack.toString().grey));
      });
    }catch (e){
      interaction?.editReply({content: ":cry: **Sorry I am clueless... I can't connect to the API!**", ephemeral: true}).catch(e => console.log("CHATBOT:".underline.red + " :: " + e.stack.toString().grey));
    }
    } catch (e) {
        console.log(String(e.stack).bgRed)
    }
  }
}
/**
  * @INFO
  * Bot Coded by bestgamershk | https://github?.com/BestGamersHK/Discord-Js-Handler-Template
  * @INFO
  * Work for BestGamersHK | discord.gg/rone
  * @INFO
  * Please mention him, when using this Code!
  * @INFO
*/
