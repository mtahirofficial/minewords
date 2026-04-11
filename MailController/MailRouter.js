const router = require('express').Router()
const { MailController } = require('./MailController')

router
    .route("/test")
    .get(MailController.sendMailToAll)

router
    .route("/send")
    .get(MailController.sendToActive)

router
    .route("/opened/:shop_id/:token")
    .get(MailController.trackOpen)

router
    .route("/clicked/:shop_id/:token")
    .get(MailController.trackClick)

router
    .route("/non-active-plans")
    .get(MailController.sendToNonActivePlans)

module.exports = router