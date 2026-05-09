import prisma from "../configs/prisma.js";

// GET /api/recommendations/:userId
export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Fetch user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          select: { listingId: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const purchasedIds = user.transactions.map(t => t.listingId);

    // 2. Fetch potential listings (excluding purchased and own listings)
    // Optimization: Filter at DB level for basic criteria
    const potentialListings = await prisma.listing.findMany({
      where: {
        AND: [
          { id: { notIn: purchasedIds } },
          { ownerId: { not: userId } },
          { status: "active" }
        ]
      },
      include: { owner: true }
    });

    // 3. Scoring Algorithm
    const scoredListings = potentialListings.map(listing => {
      let score = 0;

      // Category / Platform Match (+5)
      if (user.lastViewedCategory && listing.platform === user.lastViewedCategory) {
        score += 5;
      }

      // Followers in range (+3)
      if (listing.followers_count >= (user.preferredMinFollowers || 0) && 
          listing.followers_count <= (user.preferredMaxFollowers || 1000000000)) {
        score += 3;
      }

      // Price in range (+2)
      if (listing.price >= (user.preferredMinPrice || 0) && 
          listing.price <= (user.preferredMaxPrice || 1000000000)) {
        score += 2;
      }

      return { ...listing, score };
    });

    // 4. Sort and limit
    const recommendations = scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.json({
      recommendations,
      preferencesUsed: {
        category: user.lastViewedCategory,
        followers: [user.preferredMinFollowers, user.preferredMaxFollowers],
        price: [user.preferredMinPrice, user.preferredMaxPrice]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/recommendations/similar/:listingId
export const getSimilarListings = async (req, res) => {
  try {
    const { listingId } = req.params;

    const baseListing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!baseListing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Find similar listings based on platform and niche
    const similarListings = await prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: "active",
        OR: [
          { platform: baseListing.platform },
          { niche: baseListing.niche }
        ]
      },
      take: 6,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return res.json({
      baseListingTitle: baseListing.title,
      similarListings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
