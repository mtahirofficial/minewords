const fs = require("fs");
const nodemailer = require("nodemailer");
const { AppController } = require("./AppController");
const { shop, mail_tracking, payment } = require("../models");
const { DatabaseController } = require("../controllers/DatabaseController");
const { Op } = require("sequelize");

const hostLink = process.env.HOST;
const APP_NAME = process.env.APP_NAME;
const APP_PATH = process.env.APP_PATH;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;

const MailController = {
  sendMail: async (options) => {
    const transporter = nodemailer.createTransport({
      host: "mail.logiceverest.com",
      port: 465,
      secure: true,
      auth: {
        user: "wp@logiceverest.com",
        pass: "X0fZ{80Q+KU2",
      },
    });

    return await transporter
      .sendMail(options)
      .then(async (info) => {
        return { info };
      })
      .catch((error) => {
        return { error };
      });
  },
  sendMailToCustomer: (shop, subject, html) => {
    return new Promise(async (resolve, reject) => {
      try {
        const mailOptions = {
          from: `${APP_NAME} <wp@logiceverest.com>`,
          to: shop.email,
          subject,
          html,
        };
        if (shop.email !== shop.customer_email) {
          mailOptions.to = [shop.email, shop.customer_email];
        }
        const mail = await MailController.sendMail(mailOptions);
        if (mail.info) {
          resolve({ [shop.id]: mail.info });
        } else {
          resolve({ [shop.id]: { error: mail.error } });
        }
      } catch (error) {
        console.log("error", error);
        reject({ error });
      }
    });
  },
  sendToActive: async (req, res) => {
    try {
      const shops = await AppController.checkShopStatus(shop, { active: true });
      const responses = [];
      const subject = "Add feedback to encourage Us";
      const btnText = "Add Review";
      const message = `As one of our preferred customers, your feedback is of the utmost importance to <b>${APP_NAME}</b>. We are constantly striving to provide the ideal experience for our customers, and your input helps us to define that experience. If you could take a minute to post a review on Shopify App Store, we would appreciate it.`;

      for (const shop_id in shops) {
        const token = AppController.generateToken(30);
        var html = fs.readFileSync(__dirname + "/feedback.html", "utf8");
        html = html
          .replace(/{{CUSTOMER_NAME}}/g, shops[shop_id].shop_owner)
          .replace(/{{IMG_SRC}}/g, hostLink + "/client/logo.png")
          .replace(/{{APP_NAME}}/g, APP_NAME)
          .replace(/{{SERVER_LINK}}/g, hostLink)
          .replace(/{{SHOP_ID}}/g, shop_id)
          .replace(/{{TOKEN}}/g, token)
          .replace(/{{MESSAGE}}/g, message)
          .replace(/{{BTN_TEXT}}/g, btnText);

        const response = await MailController.sendMailToCustomer(
          shops[shop_id],
          subject,
          html,
        );
        if (response[shop_id]) {
          const data = {
            shop_id: shop_id,
            sent_to: response[shop_id].envelope.to.toString(),
            subject,
            token,
            sent_at: new Date(),
          };
          const e = await mail_tracking.create(data);
          responses.push({ response, e });
        }
      }
      res.send(responses);
    } catch (error) {
      // res.send('Something went wrong!');
      res.send(error);
    }
  },
  trackOpen: async (req, res) => {
    let opened = false;
    if (!isNaN(req.params.shop_id)) {
      opened = true;
      await mail_tracking.update(
        { opened_at: new Date() },
        { where: { token: req.params.token } },
      );
    }
    res.json({
      opened,
    });
  },
  trackClick: async (req, res) => {
    let clicked = false;
    if (!isNaN(req.params.shop_id)) {
      const shopData = await shop.findOne({
        where: { shop_id: req.params.shop_id },
      });
      clicked = true;
      await mail_tracking.update(
        { clicked_at: new Date() },
        { where: { token: req.params.token } },
      );
      const url = encodeURIComponent(
        `https://apps.shopify.com/${SHOPIFY_API_KEY}?reveal_new_review=true&utm_campaign=installed&st_source=admin&st_campaign=rate-app`,
      );
      res.redirect(
        `https://${shopData.domain}/admin/app_store/redirect?url=${url}`,
      );
    } else
      res.json({
        clicked,
      });
  },
  sendMailToAll: async (req, res) => {
    try {
      const responses = [];
      const subject = "Introduced new features";
      const token = AppController.generateToken(30);
      const btnText = "Learn more";
      const featuresList = [
        "Free Shipping",
        "Free Products",
        "Shipping by 'Not Preferred'",
        "Charge by 'Quantity'",
        "Base Price More Usage",
      ];
      const features = (list) => {
        const items = list.map((item, i) => {
          return `<li>${item}</li>`;
        });
        return `<ul>
                    ${items.join("")}
                </ul>`;
      };
      await shop
        .findAll()
        .then(async (shops) => {
          for (const shopData of shops) {
            let path = `https://apps.shopify.com/${APP_PATH}`;
            if (shopData?.active) {
              path = `${shopData.domain}/admin/apps/${APP_PATH}`;
            }

            var html = fs.readFileSync(
              __dirname + "/free_shipping.html",
              "utf8",
            );
            html = html
              .replace(/{{CUSTOMER_NAME}}/g, shopData?.shop_owner)
              .replace(/{{APP_NAME}}/g, APP_NAME)
              .replace(/{{IMG_SRC}}/g, hostLink + "/client/logo.png")
              .replace(/{{FEATURES}}/g, features(featuresList))
              .replace(/{{SERVER_LINK}}/g, hostLink)
              .replace(/{{TOKEN}}/g, token)
              .replace(/{{SHOP_ID}}/g, shopData?.shop_id)
              .replace(/{{BTN_TEXT}}/g, btnText)
              .replace(/{{BTN_LINK}}/g, path);

            //#region for test email
            // let response = {};
            // if (shopData.shop_id === 61522149575 || shopData.shop_id === "61522149575") {
            //     response = await MailController.sendMailToCustomer(shopData, subject, html);
            // }
            //#endregion

            const response = await MailController.sendMailToCustomer(
              shopData,
              subject,
              html,
            );
            responses.push(response);
          }
          res.send(responses);
        })
        .catch((error) => {
          res.json({ error });
        });
    } catch (error) {
      // res.send('Something went wrong!');
      res.send(error);
    }
  },
  sendToNonActivePlans: async (req, res) => {
    try {
      const plans = await DatabaseController.findAll(payment, {
        status: { [Op.ne]: "ACTIVE" },
      });
      const shopIds = plans.map((plan) => plan.shop_id);
      const shops = await DatabaseController.findAll(shop, {
        shop_id: { [Op.in]: shopIds },
        // shop_id: 61522149575,
        // email: 'hmtahirs1@gmail.com'
      });
      const btnText = "Post Review";
      const appStoreLink = "https://apps.shopify.com/partners/logiceverest";
      const subject = `Get Free Premium Plans - ${APP_NAME}`;

      var html = fs.readFileSync(__dirname + "/reviews_offer.html", "utf8");
      html = html
        .replace(/{{APP_STORE_LINK}}/g, appStoreLink)
        .replace(/{{APP_NAME}}/g, APP_NAME)
        .replace(/{{BTN_TEXT}}/g, btnText)
        .replace(/{{LOGO_SRC}}/g, hostLink + "/client/images/logo_review.png")
        .replace(
          /{{EX_ORDER_IMG_SRC}}/g,
          hostLink + "/client/images/ex_order.png",
        )
        .replace(/{{VENDOR_IMG_SRC}}/g, hostLink + "/client/images/vendor.png")
        .replace(
          /{{YALIDINE_IMG_SRC}}/g,
          hostLink + "/client/images/yalidine.png",
        );

      let responses = [];
      for (const s of shops) {
        let path = `https://apps.shopify.com/${APP_PATH}`;
        let reviewLink = `https://apps.shopify.com/advance-ship-rate-city-zipcode#modal-show=ReviewListingModal`;
        if (s?.active) {
          path = `https://${s.domain}/admin/apps/${APP_PATH}`;
          reviewLink = `https://${s?.domain}/admin/app_store/redirect?url=https://apps.shopify.com/${SHOPIFY_API_KEY}?reveal_new_review=true&utm_campaign=installed&st_source=admin&st_campaign=rate-app`;
        }
        html = html
          .replace(/{{APP_LINK}}/g, path)
          .replace(/{{REVIEW_LINK}}/g, reviewLink)
          .replace(/{{CUSTOMER_NAME}}/g, s?.shop_owner);

        // const envelop = {
        //     from: `Advanced Shipping Rates <hmtahirs1@gmail.com>`,
        //     to: s.email,
        //     subject,
        //     html
        // };
        // console.log(envelop.to)
        // responses.push(await sendGridMail(envelop))

        const response = await MailController.sendMailToCustomer(
          s,
          subject,
          html,
        );
        responses.push(response);
      }

      res.status(200).json(responses);
    } catch (e) {
      res.json(e.message);
    }
  },
};

module.exports = { MailController };
