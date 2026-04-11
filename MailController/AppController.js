const axios = require('axios');

const AppController = {
    checkShopStatus: async (model, where) => {
        return model
            .findAll({ where })
            .then(async data => {
                let storeData = {}
                for (const item of data) {
                    const options = {
                        method: 'GET',
                        url: `https://${item.domain}/admin/api/2021-04/shop.json`,
                        headers: {
                            'X-Shopify-Access-Token': item.access_token
                        }
                    }
                    await axios(options)
                        .then(async response => {
                            storeData[item.shop_id] = response.data.shop
                        })
                        .catch(async error => {
                            if (error.response.data.errors === '[API] Invalid API key or access token (unrecognized login or wrong password)') {
                                // storeData[item.shop_id] = error.response.data.errors
                                await item
                                    .update({ active: false })
                                    .then(r => r)
                                    .catch(e => e)
                            } else if (error.response.data.errors === "Unavailable Shop" || error.response.data.errors === "Not Found") {
                                // storeData[item.shop_id] = error.response.data.errors
                                await item
                                    .update({ closed: true })
                                    .then(r => r)
                                    .catch(e => e)
                            }
                        })
                }
                return storeData
            })
            .catch(error => { error })
    },
    rand: () => Math.random(0).toString(36).substr(2),
    generateToken: length => (AppController.rand() + AppController.rand() + AppController.rand() + AppController.rand()).substr(0, length)
}

module.exports = { AppController }