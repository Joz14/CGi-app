// External Modules
const express = require('express');
require('dotenv').config();
const clashRoyalGet = require('../utils/clashRoyalGet');

const router = express.Router();

// Endpoint to search by player tag
router.get('/search/:tag', async (req, res) => {
    console.log("endpoint hit");
    const tag = req.params.tag; // Use req.params to get the tag from the URL parameters
    console.log('Searching for tag:', tag);

    // Fix string interpolation
    const playerUrl = `https://api.clashroyale.com/v1/VerifyTokenRequest`;
    //const playerUrl = `https://api.clashroyale.com/v1/players/${encodeURIComponent(tag)}`;
    
    try {
        const get_url = await clashRoyalGet(playerUrl, 1);
        const playerData = get_url.data;
        console.log('Player Data:', playerData);
        res.json(playerData); // Send the player data back to the client
    } catch (error) {
        console.error('Error in player URL:', error);
        res.status(500).json({ error: 'Failed to fetch player data.' }); // Send an error response if there is an issue
    }
});

module.exports = router;
