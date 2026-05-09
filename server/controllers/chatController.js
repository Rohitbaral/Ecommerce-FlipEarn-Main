import prisma from "../configs/prisma.js";
import { clerkClient, getAuth } from "@clerk/express";

// Controller for getting chat (creating if not exist)
export const getChat = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { listingId, chatId } = req.body;

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Find Existing Chat
    let existingChat = null;
    if (chatId) {
      existingChat = await prisma.chat.findFirst({
        where: { id: chatId, OR: [{ chatUserId: userId }, { ownerUserId: userId }] },
        include: { listing: true, ownerUser: true, chatUser: true, messages: true },
      });
    } else {
      existingChat = await prisma.chat.findFirst({
        where: { listingId, chatUserId: userId, ownerUserId: listing.ownerId },
        include: { listing: true, ownerUser: true, chatUser: true, messages: true },
      });
    }

    if (existingChat) {
      res.json({ chat: existingChat });

      // Update individual messages to isRead: true
      await prisma.message.updateMany({
        where: {
          chatId: existingChat.id,
          sender_id: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      if (existingChat.isLastMessageRead === false && existingChat.messages.length > 0) {
        const lastMessage = existingChat.messages[existingChat.messages.length - 1];
        if (lastMessage && lastMessage.sender_id !== userId) {
          await prisma.chat.update({
            where: { id: existingChat.id },
            data: { isLastMessageRead: true },
          });
        }
      }

      return null;
    }

    // ✅ Ensure user exists in DB with all required fields
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      // Fetch user from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);

      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "noemail@example.com",
          name: clerkUser.firstName + (clerkUser.lastName ? ` ${clerkUser.lastName}` : "") || "Unknown",
          image: clerkUser.imageUrl || "https://via.placeholder.com/150",
        },
      });
    }

    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        listingId,
        chatUserId: userId,
        ownerUserId: listing.ownerId,
      },
    });

    const chatWithData = await prisma.chat.findUnique({
      where: { id: newChat.id },
      include: { listing: true, ownerUser: true, chatUser: true },
    });

    return res.json({ chat: chatWithData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Controller for getting all user chats
export const getAllUserChats = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const chats = await prisma.chat.findMany({
      where: { OR: [{ chatUserId: userId }, { ownerUserId: userId }] },
      include: { listing: true, ownerUser: true, chatUser: true },
      orderBy: { updatedAt: "desc" },
    });

    return res.json({ chats: chats || [] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Controller for sending a message
export const sendChatMessage = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { chatId, message } = req.body;

    const chat = await prisma.chat.findFirst({
      where: {
        AND: [{ id: chatId }, { OR: [{ chatUserId: userId }, { ownerUserId: userId }] }],
      },
      include: { listing: true, ownerUser: true, chatUser: true },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    } else if (chat.listing.status !== "active") {
      return res.status(400).json({ message: `Listing is ${chat.listing.status}` });
    }

    const newMessage = {
      message,
      sender_id: userId,
      chatId,
      createdAt: new Date(),
    };

    await prisma.message.create({
      data: {
        ...newMessage,
        isRead: false,
      },
    });

    // Update chat's last message
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: newMessage.message,
        isLastMessageRead: false,
        lastMessageSenderId: userId,
      },
    });

    res.json({ message: "Message Sent", newMessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};