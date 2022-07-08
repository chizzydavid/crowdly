import { UsernamePasswordInput, UserResponse } from "./custom-types";

export const validateRegister = (options: UsernamePasswordInput): UserResponse | undefined => {
  const { email, username, password } = options;
  if (email.length <= 2) 
    return errorRes("email", "length must be greater than 2");
  
  if (!email.includes('@')) 
    return errorRes("email", "invalid email address");
  
  if (username.length <= 2) 
    return errorRes("username", "length must be greater than 2");
  
  if (password.length <= 2) 
    return errorRes("password", "length must be greater than 2");
   
  return undefined;
}

export const errorRes = (field: string, message: string): UserResponse => ({ errors: [{ field, message }] });
