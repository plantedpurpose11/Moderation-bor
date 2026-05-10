const fetch = require('node-fetch');
const config = require(`${process.cwd()}/botconfig/config.json`);

module.exports = {
  name: 'ask',
  category: '💬 Chat',
  aliases: [],
  usage: 'ask <question>',
  description: 'Ask a question to the AI.',
  type: 'bot',

  run: async (client, message, args, cmduser, text, prefix) => {
    try {
      const question = args.join(' ');
      if (!question) return message.reply('Please provide a question.');

      const geminiKey = process.env.GEMINI_API_KEY || config.gemini_api_key;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 500 }
        })
      });

      const data = await response.json();
      const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse) {
        await message.channel.send(aiResponse.substring(0, 2000));
      } else {
        await message.reply("❌ Couldn't generate a response.");
      }
    } catch (error) {
      console.error(error);
      return message.reply('An error occurred while processing your question.');
    }
  },
};
