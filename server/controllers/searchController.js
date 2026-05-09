import prisma from "../configs/prisma.js";
import { getAuth } from "@clerk/express";

// GET /api/search?q=keyword&category=&minPrice=&maxPrice=&minFollowers=&maxFollowers=
export const searchListings = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { 
      q, 
      category, 
      minPrice, 
      maxPrice, 
      minFollowers, 
      maxFollowers 
    } = req.query;

    // Building dynamic filter object
    const filters = {
      status: "active",
      isCredentialVerified: true,
      ...(userId ? { ownerId: { not: userId } } : {})
    };

    // Keyword Search (Matches title, description, or tags)
    if (q) {
      filters.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } } // Exact tag match or I could use a more complex array filter
      ];
    }

    // Platform/Category Filter
    if (category) {
      filters.platform = category.toLowerCase();
    }

    // Price Range Filter
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = parseFloat(minPrice);
      if (maxPrice) filters.price.lte = parseFloat(maxPrice);
    }

    // Followers Range Filter
    if (minFollowers || maxFollowers) {
      filters.followers_count = {};
      if (minFollowers) filters.followers_count.gte = parseFloat(minFollowers);
      if (maxFollowers) filters.followers_count.lte = parseFloat(maxFollowers);
    }

    const results = await prisma.listing.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        owner: {
            select: { name: true, image: true }
        }
      }
    });

    // Background: Update user preferences based on search behavior
    if (userId && (category || minPrice || maxPrice || minFollowers || maxFollowers)) {
      prisma.user.update({
        where: { id: userId },
        data: {
          ...(category ? { lastViewedCategory: category.toLowerCase() } : {}),
          ...(minPrice ? { preferredMinPrice: parseFloat(minPrice) } : {}),
          ...(maxPrice ? { preferredMaxPrice: parseFloat(maxPrice) } : {}),
          ...(minFollowers ? { preferredMinFollowers: parseFloat(minFollowers) } : {}),
          ...(maxFollowers ? { preferredMaxFollowers: parseFloat(maxFollowers) } : {}),
        }
      }).catch(err => console.error("Failed to update user search preferences:", err));
    }


    return res.json({
        count: results.length,
        results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/search/suggestions?q=keyword
export const getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const { userId } = getAuth(req);

    // Fetch titles and platforms that match the prefix
    const suggestions = await prisma.listing.findMany({
      where: {
        status: "active",
        isCredentialVerified: true,
        ...(userId ? { ownerId: { not: userId } } : {}),
        OR: [
          { title: { startsWith: q, mode: 'insensitive' } },
          { username: { startsWith: q, mode: 'insensitive' } }
        ]
      },
      select: {
        title: true,
        platform: true,
        username: true
      },
      take: 5
    });

    // Extract unique suggestions (could include categories as well)
    const formattedSuggestions = suggestions.map(s => ({
        text: s.title,
        type: 'title',
        platform: s.platform
    }));

    return res.json({ suggestions: formattedSuggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
