"use server";

import { handleError } from "@/lib/utils";
import { CreateUserParams, UpdateUserParams } from "@/types";
import { connectToDatabase } from "..";
import { revalidatePath } from "next/cache";
import User from "@/lib/database/models/user.model";
import Event from "@/lib/database/models/event.model";
import Order from "@/lib/database/models/order.model";

export const createUser = async (user: CreateUserParams) => {
  try {
    await connectToDatabase();
    const newUser = await User.create(user);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    handleError(error);
  }
};

export const getUserById = async (userId: String) => {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
};

export const updateUser = async (clerkId: string, user: UpdateUserParams) => {
  try {
    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate({ clerkId }, user, {
      new: true,
    });
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
};

export const deleteUser = async (clerkId: string) => {
  try {
    await connectToDatabase();
    const userToDelete = await User.findOne({ clerkId });
    if (!userToDelete) {
      throw new Error("User not found");
    }
    await Promise.all([
      Event.updateMany(
        { _id: { $in: userToDelete.event } },
        { $pull: { organizer: userToDelete._id } }
      ),
      Order.updateMany(
        { _id: { $in: userToDelete.orders } },
        { $unset: { buyer: 1 } }
      ),
    ]);
    const deleteUser = await User.findByIdAndDelete(userToDelete._id);
    revalidatePath("/");
    return deleteUser ? JSON.parse(JSON.stringify(deleteUser)) : null;
  } catch (error) {
    handleError(error);
  }
};
