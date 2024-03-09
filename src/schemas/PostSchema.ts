import { Document, isValidObjectId, model, Schema } from "mongoose";
import { IUser } from "./UserSchema";

export enum EPrivacy {
  private = "private",
  public = "public",
  follower = "follower",
}

export interface IPost extends Document {
  _author_id: IUser["_id"];
  privacy: EPrivacy;
  description: string;
  isEdited: boolean;
  createdAt: string | number;
  updatedAt: string | number;

  author: IUser;

}

const PostSchema = new Schema(
  {
    _author_id: {
      // author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    privacy: {
      type: String,
      default: "public",
      enum: ["private", "public", "follower"],
    },
    description: {
      type: String,
      default: "",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

PostSchema.virtual("author", {
  ref: "User",
  localField: "_author_id",
  foreignField: "_id",
  justOne: true,
});
export default model<IPost>("Post", PostSchema);
