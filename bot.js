const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Initialize Discord bot client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Your bot token (use environment variable for security)
const token = process.env.'MTI4NTYwMDQxMDc2OTQyNDM4NA.GkOfzC.-in5AfPeq4Y8-2dwg0V_11q9HybZZ_kg3rh_98';

// The channel ID where the floor price updates will be reflected in the name
const channelId = '1285605233699061863'; // Replace with your actual channel ID

// Function to get the current timestamp (seconds since Epoch)
const getTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

// Function to fetch Kasper floor price from the API with retries
async function getFloorPrice(retries = 3) {
    const timestamp = getTimestamp();
    const apiUrl = `https://storage.googleapis.com/kspr-api-v1/marketplace/marketplace.json?t=${timestamp}`;
    
    console.log('Fetching floor price from API...'); // Log when fetching starts

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await axios.get(apiUrl);
            const data = response.data;

            // Extract the KASPER floor price from the data
            const kasperData = data.KASPER;
            const floorPrice = kasperData ? kasperData.floor_price : null;

            console.log(`Fetched floor price: ${floorPrice} KAS`); // Log the fetched price
            return floorPrice;
        } catch (error) {
            console.error('Error fetching Kasper floor price:', error.message); // Log specific error message
            if (attempt < retries - 1) {
                console.log(`Retrying... (${attempt + 1})`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
            }
        }
    }

    return null; // Return null if all attempts fail
}

// Function to update the channel name with the KASPER floor price
async function updateChannelName() {
    const floorPrice = await getFloorPrice();

    if (floorPrice !== null) {
        const channel = await client.channels.fetch(channelId);
        const newChannelName = `KASPER Floor: ${floorPrice} KAS`;

        console.log(`Updating channel name to: ${newChannelName}`); // Log the new channel name

        // Set the new channel name
        try {
            await channel.setName(newChannelName);
            console.log(`Channel name updated to: ${newChannelName}`);
        } catch (error) {
            console.error('Error updating channel name:', error.message); // Log specific error message
        }
    } else {
        console.log('No floor price available to update the channel name.'); // Log when price is not available
    }
}

// Set an interval to update the channel name every 15 minutes (900000 ms)
client.once('ready', () => {
    console.log('Bot is ready!');

    // Update the channel name immediately, then every 15 minutes
    updateChannelName();
    setInterval(updateChannelName, 900000); // 15 minutes
});

// Log in to Discord with the bot's token
client.login(token)
    .then(() => console.log('Bot logged in successfully.'))
    .catch(error => console.error('Failed to log in:', error.message)); // Log any login errors
