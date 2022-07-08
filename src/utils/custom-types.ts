import { InputType, Field, ObjectType } from "type-graphql";
import { User } from "../entities/User";

@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
  @Field()
  email: string;
}

@ObjectType()
export class FieldError {
  @Field(() => String, { nullable: true })
  field?: string
  @Field(() => String, { nullable: true })
  message?: string
}

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: [FieldError]
  @Field(() => User, { nullable: true })
  user?: User
}
