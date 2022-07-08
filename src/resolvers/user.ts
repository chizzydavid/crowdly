import { Resolver, Ctx, Arg, Mutation, Query, Root, FieldResolver } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput, UserResponse } from "../utils/custom-types";
import { validateRegister, errorRes } from "../utils/validate";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) return true;
 
    const token = v4();
    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60);
    const mail = `<a href="http://localhost:3000/change-password/${token}"> Reset Password </a>`;
    await sendEmail(user.email, mail);
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('newPassword') newPassword: string,
    @Arg('token') token: string, 
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) 
      return errorRes("newPassword", "length must be greater than 2");
    
    const key = FORGET_PASSWORD_PREFIX + token;
    const savedUserId = await redis.get(key);
    if (!savedUserId) 
      return errorRes("token", "token expired");
    
    const userId = parseInt(savedUserId);
    const user = await User.findOne(userId);
    if (!user) 
      return errorRes("token", "user no longer exists");

    redis.del(key);
    await User.update({id: userId}, {
      password: await argon2.hash(newPassword)
    });
    req.session.userId = user.id;
    return { user };
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    if (req.session.userId === null) {
      return undefined
    }
    return await User.findOne({ id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    try {
      const { username, password, email } = options;
      const validateRes = validateRegister(options);
      if (validateRes != undefined) {
        return validateRes;
      }
      const hashedPass = await argon2.hash(password);
      const user = await User.create({ username, password: hashedPass, email }).save();
    
      req.session.userId = user?.id;
      return { user };
    } catch (error) {
      if (error.code == "23505") {
        return errorRes("username", "username already exists");
      }
      return errorRes("username", error);
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) 
      return errorRes("usernameOrEmail", "that username does not exist");
  
    const valid = await argon2.verify(user.password, password);
    if (!valid) 
      return errorRes("password", "incorrect password");
    
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy((err) => {
        if (err) {
          resolve(false);
          return;
        }
        resolve(true);
      });
    })
  }
}


