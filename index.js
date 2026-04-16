// Require the necessary discord.js classes
// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const TOKEN = process.env.TOKEN;

BigInt.prototype["toJSON"] = function () {
  return this.toString();
};

const defaultGatewayIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMembers,
];

let intents = [];

if (process.env.GATEWAY_INTENTS && process.env.GATEWAY_INTENTS.split(',').length > 0) {
  for (let gatewayIntent of process.env.GATEWAY_INTENTS.split(',')) {
    gatewayIntent = gatewayIntent.trim()
    if (Number.isInteger(GatewayIntentBits[gatewayIntent.trim()])) {
      intents.push(GatewayIntentBits[gatewayIntent.trim()]);
    }
  }
} else {
  intents = defaultGatewayIntents;
}
console.log(`Intents for Discord Client: ${intents}`)

// Anime reaction GIFs
const animeReactions = {
  happy: 'https://media.tenor.com/images/happy-anime.gif',
  sad: 'https://media.tenor.com/images/sad-anime.gif',
  angry: 'https://media.tenor.com/images/angry-anime.gif',
  love: 'https://media.tenor.com/images/love-anime.gif',
  dance: 'https://media.tenor.com/images/dance-anime.gif',
  hug: 'https://media.tenor.com/images/hug-anime.gif',
  pat: 'https://media.tenor.com/images/pat-anime.gif',
  slap: 'https://media.tenor.com/images/slap-anime.gif',
};

// Create slash commands
const commands = Object.keys(animeReactions).map(reaction => 
  new SlashCommandBuilder()
    .setName(reaction)
    .setDescription(`Send a ${reaction} anime reaction`)
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to send the reaction to')
        .setRequired(false)
    )
    .toJSON()
);

// Create a new client instance
const client = new Client({ intents: intents });

// Register slash commands when bot is ready
client.once(Events.ClientReady, async readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    
    // Get all guilds the bot is in
    const guilds = await readyClient.guilds.fetch();
    
    // Register commands in each guild (faster for testing)
    for (const [guildId] of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(readyClient.user.id, guildId),
        { body: commands }
      );
    }
    
    console.log('Slash commands registered!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  
  // Check if it's an anime reaction command
  if (animeReactions[commandName]) {
    try {
      const target = interaction.options.getUser('target');
      const user = interaction.user;
      
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setImage(animeReactions[commandName])
        .setDescription(target ? `${user} sent ${commandName} vibes to ${target}!` : `${user} is ${commandName}!`)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  } else {
    // Handle other commands via backend endpoint if needed
    try {
      const response = await fetch(process.env.INTERACTION_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          interaction_id: interaction.id,
          interaction_token: interaction.token,
          interaction_data: { ...interaction.toJSON(), options: interaction.options.data }
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
      console.log(await response.json())
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
});

// No-code / low-code backend message endpoint (ie: BuildShip, Fastgen, etc)
client.on(Events.MessageCreate, async message => {
  try {
    const response = await fetch(process.env.MESSAGE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        message_data: message.toJSON()
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    console.log(await response.json())
  } catch (e) {
    console.error(e);
  }
})

client.on(Events.GuildMemberAdd, async member => {
  console.log('member add event fired', member)
  try {
    const response = await fetch(process.env.UPDATE_ROLE_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        data: member.toJSON()
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
    const data = await response.json()
    console.log(data)
  } catch (e) {
    console.error(e);
  }
})

// Log in to Discord with your client's token
client.login(TOKEN);
