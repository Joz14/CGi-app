const axios = require('axios');
require('dotenv').config();

const get_url = async (url, limit, maxRetries = 3) => {
    const token = process.env.CLASH_API;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await axios.get(url, {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                params: {
                    "limit": limit
                }
            });
        } catch (error) {
            console.error(`Error in get_url (attempt ${i + 1}):`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // wait 5 seconds
            } else {
                throw error; // Re-throw the error after maxRetries
            }
        }
    }
};

module.exports = get_url;