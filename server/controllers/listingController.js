import imagekit from "../configs/imageKit.js";
import prisma from "../configs/prisma.js";
import fs from "fs";
import { inngest } from "../inngest/index.js";
import { getAuth } from "@clerk/express";

// Controller For Adding Listing to Database

export const addListing = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (req.plan !== "premium") {
      const listingCount = await prisma.listing.count({
        where: { ownerId: userId },
      });
      if (listingCount >= 5) {
        return res
          .status(400)
          .json({ message: "you have reached the free listing limit" });
      }
    }
    const { credentials, ...accountDetails } = JSON.parse(req.body.accountDetails);

    accountDetails.followers_count = parseFloat(accountDetails.followers_count);
    accountDetails.engagement_rate = parseFloat(accountDetails.engagement_rate || 0);
    accountDetails.monthly_views = parseFloat(accountDetails.monthly_views || 0);
    accountDetails.price = parseFloat(accountDetails.price);
    accountDetails.platform = accountDetails.platform.toLowerCase();
    accountDetails.niche = accountDetails.niche.toLowerCase();

    accountDetails.username.startsWith("@")
      ? (accountDetails.username = accountDetails.username.slice(1))
      : null;

    const uploadImages = req.files.map(async (file) => {
      const response = await imagekit.files.upload({
        file: fs.createReadStream(file.path),
        fileName: `${Date.now()}.png`,
        folder: "flip-Earn",
        transformation: { pre: "w-1280, h-auto" },
      });
      return response.url;
    });

    const images = await Promise.all(uploadImages);

    const listing = await prisma.$transaction(async (tx) => {
      const newListing = await tx.listing.create({
        data: {
          ownerId: userId,
          images,
          ...accountDetails,
          isCredentialSubmitted: true,
          status: "inactive",
        },
      });

      if (credentials && credentials.length > 0) {
        await tx.credential.create({
          data: {
            listingId: newListing.id,
            originalCredential: credentials,
          },
        });
      }

      return newListing;
    });

    return res
      .status(201)
      .json({ message: "Account Listed successfully", listing });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Controller For Getting All Public Listing
export const getAllPublicListing = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const listings = await prisma.listing.findMany({
      where: { 
        status: "active",
        isCredentialVerified: true,
        ...(userId ? { ownerId: { not: userId } } : {})
       },
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });
    if (!listings || listings.length === 0) {
      return res.json({ listings: [] });
    }
    return res.json({ listings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Controller For Getting All User Listing

export const getAllUserListing = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const listings = await prisma.listing.findMany({
      where: { ownerId: userId, status: { not: "deleted" } },
      orderBy: { createdAt: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // ✅ FIX: prevent null crash
    const balance = {
      earned: user?.earned || 0,
      withdrawn: user?.withdrawn || 0,
      available: (user?.earned || 0) - (user?.withdrawn || 0),
    };

    if (!listings || listings.length === 0) {
      return res.json({ listings: [], balance });
    }
    return res.json({ listings, balance });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

// Controller For Updating Listing in Database

export const updateListing = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const accountDetails = JSON.parse(req.body.accountDetails);

    if (req.files.length + accountDetails.images.length > 5) {
      return res
        .status(400)
        .json({ message: "You can only upload up to 5 images" });
    }

    const { id, credentials, images: oldImages, owner, chats, transactions, Credential, ...dataToUpdate } = accountDetails;

    // Ensure numeric types
    dataToUpdate.followers_count = parseFloat(dataToUpdate.followers_count);
    dataToUpdate.engagement_rate = parseFloat(dataToUpdate.engagement_rate || 0);
    dataToUpdate.monthly_views = parseFloat(dataToUpdate.monthly_views || 0);
    dataToUpdate.price = parseFloat(dataToUpdate.price);

    if (dataToUpdate.platform) dataToUpdate.platform = dataToUpdate.platform.toLowerCase();
    if (dataToUpdate.niche) dataToUpdate.niche = dataToUpdate.niche.toLowerCase();

    if (dataToUpdate.username?.startsWith("@")) {
      dataToUpdate.username = dataToUpdate.username.slice(1);
    }

    const listing = await prisma.listing.findUnique({
        where: { id: id, ownerId: userId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.status === "sold") {
      return res.status(400).json({ message: "you can't update sold listing" });
    }

    if (req.files.length > 0) {
      const uploadImages = req.files.map(async (file) => {
        const response = await imagekit.files.upload({
          file: fs.createReadStream(file.path),
          fileName: `${Date.now()}.png`,
          folder: "flip-Earn",
          transformation: { pre: "w-1280, h-auto" },
        });
        return response.url;
      });

      const images = await Promise.all(uploadImages);

      const updatedListing = await prisma.listing.update({
        where: { id: id, ownerId: userId },
        data: {
          ...dataToUpdate,
          images: [...(oldImages || []), ...images],
        },
      });
      return res.json({ message: "Account Updated successfully", listing: updatedListing });
    }

      const updatedListing = await prisma.listing.update({
        where: { id: id, ownerId: userId },
        data: {
          ...dataToUpdate,
          images: oldImages // ensure we keep the filtered old images
        },
      });

      return res.json({ message: "Account Updated successfully", listing: updatedListing });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req);

    const listing = await prisma.listing.findUnique({
      where: { id, ownerId: userId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    let updatedListing = listing;
    if (listing.status === "active" || listing.status === "inactive") {
       updatedListing = await prisma.listing.update({
        where: { id, ownerId: userId },
        data: { status: listing.status === "active" ? "inactive" : "active" },
      });
    } else if (listing.status === "ban") {
      return res.status(400).json({ message: "Your listing is banned" });
    } else if (listing.status === "sold") {
      return res.status(400).json({ message: "Your listing is sold" });
    }

    return res.json({
      message: "Listing status updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const deleteUserListing = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { listingId } = req.params;

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: userId },
      include: { owner: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.status === "sold") {
      return res.status(400).json({ message: "sold listing can't be deleted" });
    }

    //IF password has been changed, send the new password to the owner
    if (listing.isCredentialChanged) {
      await inngest.send({
        name: "app/listing-deleted",
        data: {listing,listingId}
      })
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "deleted" },
    });

    return res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const addCredential = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { listingId, credential } = req.body;

    if (credential.length === 0 || !listingId) {
      return res.status(400).json({ message: "Missing Feilds" });
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: userId },
    });

    if (!listing) {
      return res
        .status(404)
        .json({ message: "Listing not found or you are not the owner" });
    }

    await prisma.credential.create({
      data: {
        listingId,
        originalCredential: credential,
      },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: { isCredentialSubmitted: true },
    });

    return res.json({ message: "Credential added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const markFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req);

    if (req.plan !== "premium") {
      return res.status(400).json({ message: "Premium plan required" });
    }

    await prisma.listing.updateMany({
      where: { ownerId: userId },
      data: { featured: false },
    });

    await prisma.listing.update({
      where: { id },
      data: { featured: true },
    });

    return res.json({ message: "Listing marked as featured" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const getAllUserOrders = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    let orders = await prisma.transaction.findMany({
      where: { userId, isPaid: true },
      include: { listing: true },
    });

    if (!orders || orders.length === 0) {
      return res.json({ orders: [] });
    }

    // ✅ FIX: correct mapping
    const credentials = await prisma.credential.findMany({
      where: { listingId: { in: orders.map((o) => o.listingId) } },
    });

    const ordersWithCredentials = orders.map((order) => {
      const credential = credentials.find(
        (cred) => cred.listingId === order.listingId,
      );
      return { ...order, credential };
    });

    return res.json({ orders: ordersWithCredentials });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const withdrawAmount = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { amount, account } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const balance = (user?.earned || 0) - (user?.withdrawn || 0);

    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        account,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { withdrawn: { increment: amount } },
    });

    return res.json({ message: "Applied for withdrawn", withdrawal });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const purchaseAccount = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { listingId } = req.params;

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: "active" },
    });

    if (!listing) {
      return res
        .status(404)
        .json({ message: "Listing not found or not active" });
    }

    if (listing.ownerId === userId) {
      return res
        .status(400)
        .json({ message: "You can't purchase your own listing" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        listingId,
        ownerId: listing.ownerId,
        userId,
        amount: listing.price,
      },
    });

    return res.json({ orderId: transaction.id });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message});
  }
};

export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req);

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Update user's last viewed category if logged in
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastViewedCategory: listing.platform },
      }).catch(err => console.log("Failed to update user preference:", err));
    }

    return res.json({ listing });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
