// // const jwt = require("jsonwebtoken");
// // require("dotenv").config();
// // const { UserRepository } = require("../schema");
// const models = require('../models')
// const {
//   UnauthorizedException,
//   NotFoundException,
//   ForbiddenException,
// } = require("../exceptions");

// async function ProfileMiddleware(req, res, next) {
//   try {
//     const tokenClient = req.headers["x-access-token"];
//     if (!tokenClient) {
//       return next(new UnauthorizedException());
//     } 
//     const validToken = jwt.verify(tokenClient, process.env.SECRET_KEY, {
//       algorithms: ["HS256"],
//     });

//     if (!validToken) {
//       return next(new UnauthorizedException());
//     }

//     // const checkingUser = await UserRepository.findOne({ id: validToken.id });
//     const checkingUser = await models.user.findOne({where : { id : validToken.id}})
//     if (!checkingUser) {
//       return next(new NotFoundException("User not found!"));
//     }

//     if (!checkingUser.active) {
//       return next(new ForbiddenException("User is temporarily locked!"));
//     }

//     req.user = {
//       id: checkingUser.id,
//       email: checkingUser.email,
//       username: checkingUser.username,
//       active: checkingUser.active,
//       avatarUrl: checkingUser.avatarUrl,
//       createdAt: checkingUser.createdAt,
//       updatedAt: checkingUser.updatedAt,
//     };
//     next();
//   } catch (error) {
//     next(new UnauthorizedException());
//   }
// }

// module.exports = ProfileMiddleware;
