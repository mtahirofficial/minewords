const { DEFAULT_AVATAR } = require("../constants");
const { Service } = require("../core");
const bcrypt = require("bcrypt");
const { NotFoundException, ServerException } = require("../exceptions");
const models = require("../models");
const { randomStr, createHash, generateOTP } = require("../utils");
const { generateAccessToken } = require("./auth.service");

const APP_NAME = process.env.APP_NAME

class UserService extends Service {
  async createUser({ email, password }) {
    try {
      const hashPassword = await createHash(password, 10);

      return await models.user.create({
        email: email,
        password: hashPassword,
        avatarUrl: DEFAULT_AVATAR,
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async getUserById(id) {
    try {
      const user = await models.user.findOne({ id });

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      return user;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async updateUser(id, userUpdate) {
    try {
      return await models.user.findByIdAndUpdate(
        { id },
        {
          ...userUpdate,
        }
      );
    } catch (e) {
      throw new Error(e.message);
    }
  }
  async updateOrCreate(store) {
    try {
      const user = await models.user.findOne({ "where": { "storeId": store.id, "email": store.email } });
      const fullName = store.shop_owner
      const names = fullName.split(" ")
      const password = randomStr(8)
      const otp = generateOTP()
      const userData = {
        "storeId": store.id,
        "email": store.email,
        "userName": store.email.split("@")[0] + `-${randomStr(6)}`,
        "firstName": names[0],
        "lastName": names[1],
        "fullName": fullName,
        "phone": store.phone,
        "active": false,
        "otp": otp
      }
      const envelop = {
        to: store.email,
        html: `<div>
        <h4>Welcome back to ${APP_NAME}!</h4>
        <p>Dear ${fullName}!</p>`
      }
      if (user) {
        envelop.subject = `Welcome Back to ${APP_NAME}`
        envelop.html = `
        <p>We hope this message finds you well! 🌟</p>
        <p>We wanted to express our sincere gratitude for choosing ${APP_NAME} once again for your Shopify store.</p>
        <br>
        <p>To enhance the security of your account, we've sent a one-time password (OTP) for your convenience. Your OTP for account verification is: ${otp}</p>
        <p>Thank you for being a valued member of the ${APP_NAME} family. We look forward to supporting you on your journey to success!</p>
        `
        await user.update({ ...userData })
      } else {
        const hashPassword = await createHash(password);
        envelop.subject = `Account created`
        envelop.html = `
        <p>Your account is created at ${APP_NAME}, Please use this password to login to your account</p>
        <br>
        <span style="background-color: whitesmoke; font-family: calibri; font-size: 18px; padding: 5px; border: 1px solid #ddd; border-radius: 8px; color: skyblue; letter-spacing: 3px;">${password}</span>
        `
        await models.user.create({ ...userData, password: hashPassword });
      }

      envelop.html += `
      <p>Best regards,</p>
      <div>${APP_NAME} - devndesign</div>
      </div>
      `

      // const payload = {
      //   id: user.id,
      //   email: store.email,
      // };
      // const token = await generateAccessToken(payload);

      return { ...user }
    } catch (e) {
      throw new Error(e.message)
    }
  }
}

module.exports = new UserService();
