const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { Service } = require("../core");
const { resolve } = require("path");
const dotenv = require("dotenv");

// Load environment variables immediately when this module is loaded
dotenv.config();

const APP_NAME = process.env.APP_NAME
const MAILER_USER = process.env.MAILER_USER

class MailerService extends Service {
  _transporter;
  _isConfigured = false;
  
  constructor() {
    super();
    // Don't configure immediately - wait until first use
    // This ensures dotenv has been loaded
  }
  
  // Lazy initialization - only configure when actually needed
  ensureConfigured() {
    if (!this._isConfigured) {
      this.configTransporter();
      this.configUseTemplate();
      this._isConfigured = true;
    }
  }

  configTransporter() {
    // Re-read env vars in case they were loaded after module initialization
    const mailerUser = process.env.MAILER_USER;
    const mailerPass = process.env.MAILER_PASS;
    
    // Validate that credentials exist
    if (!mailerUser || !mailerPass) {
      console.error("⚠️  MAILER_USER or MAILER_PASS environment variables are not set!");
      console.error("Current values:", { 
        MAILER_USER: mailerUser ? "***set***" : "undefined",
        MAILER_PASS: mailerPass ? "***set***" : "undefined"
      });
      console.error("Please set these in your .env file:");
      console.error("MAILER_USER=your-email@example.com");
      console.error("MAILER_PASS=your-password");
      console.error("Make sure .env file is in the postbook_server directory");
      throw new Error("Email service configuration error: Missing MAILER_USER or MAILER_PASS");
    }

    const mailerConfig = {
      host: process.env.MAILER_HOST || "mail.logicsarcade.com",
      port: parseInt(process.env.MAILER_PORT) || 465,
      secure: process.env.MAILER_SECURE !== "false", // default to true
      auth: {
        user: mailerUser,
        pass: mailerPass,
      },
    };

    // For Gmail or other services, you might need different settings
    if (process.env.MAILER_HOST && process.env.MAILER_HOST.includes("gmail")) {
      mailerConfig.service = "gmail";
      delete mailerConfig.host;
      delete mailerConfig.port;
    }

    this._transporter = nodemailer.createTransport(mailerConfig);

    // Verify connection configuration
    this._transporter.verify(function (error, success) {
      if (error) {
        console.error("❌ SMTP connection error:", error);
      } else {
        console.log("✅ SMTP server is ready to send emails");
      }
    });
  }

  configUseTemplate() {
    this._transporter.use(
      "compile",
      hbs({
        viewEngine: {
          extname: ".hbs",
          layoutsDir: resolve(__dirname, "../views/layouts"),
          partialsDir: resolve(__dirname, "../views/partials"),
        },
        viewPath: resolve(__dirname, "../views"),
        extName: ".hbs",
      })
    );
  }

  async sendEmail({ to, subject, template, context, attachments }) {
    // Ensure transporter is configured before sending
    this.ensureConfigured();
    
    // Validate required fields
    if (!to || !subject || !template) {
      throw new Error("Missing required email parameters: to, subject, or template");
    }

    // Validate that transporter is configured
    if (!this._transporter) {
      throw new Error("Email transporter is not configured. Please check your MAILER_USER and MAILER_PASS environment variables.");
    }

    try {
      // Use current env vars (in case they changed)
      const currentMailerUser = process.env.MAILER_USER || MAILER_USER;
      const currentAppName = process.env.APP_NAME || APP_NAME || 'Ziora';
      
      return await this._transporter.sendMail({
        from: `"${currentAppName}" <${currentMailerUser}>`, // sender address
        to,
        subject,
        template,
        context,
        attachments,
      });
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  }


}

module.exports = new MailerService();
