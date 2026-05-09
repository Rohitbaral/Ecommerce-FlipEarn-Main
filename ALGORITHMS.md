# FlipEarn Core Algorithms Documentation

This document provides a detailed technical explanation of the core algorithms and logic used within the FlipEarn platform.

---

## 1. Personalized Recommendation Algorithm
The recommendation engine provides users with tailored listings based on their historical behavior and stated preferences.

### Logic Flow
- **Data Input**: The algorithm retrieves the user's profile, including `lastViewedCategory`, `preferredMinFollowers`, `preferredMaxFollowers`, `preferredMinPrice`, and `preferredMaxPrice`.
- **Filtering**: It automatically filters out listings that:
    1. Have already been purchased by the user.
    2. Are owned by the user.
    3. Are not in "active" status.
- **Scoring System**: Each potential listing starts with a score of 0 and is awarded "points" based on how well it matches the user's profile:
    - **Platform Match (+5 points)**: Awarded if the listing's platform (e.g., YouTube) matches the user's most recently viewed category.
    - **Followers Range Match (+3 points)**: Awarded if the follower count is within the user's preferred range.
    - **Price Range Match (+2 points)**: Awarded if the listing price is within the user's preferred range.
- **Output**: Listings are sorted by their final score in descending order, and the top 10 are returned.

**Location**: `server/controllers/recommendationController.js` -> `getRecommendations`

---

## 2. Similar Listings Algorithm
Used on product detail pages to suggest alternative accounts that the buyer might be interested in.

### Logic Flow
- **Attribute Matching**: The algorithm looks for other active listings that share either the same **Platform** or the same **Niche** (Category) as the base listing.
- **Selection**: It excludes the current listing itself and prioritizes newer listings (`createdAt: 'desc'`).
- **Limit**: Returns a maximum of 6 similar listings.

**Location**: `server/controllers/recommendationController.js` -> `getSimilarListings`

---

## 3. Dynamic Search & Filtering Algorithm
FlipEarn uses a multi-layered filtering system to help users find specific social media assets.

### Logic Flow
- **Keyword Search**: Performs a case-insensitive search across three fields: `title`, `description`, and `tags`.
- **Strict Filters**: Combines the keyword search with specific criteria:
    - **Category**: Hard match on platform type.
    - **Price Range**: Using Prisma's `gte` (greater than or equal) and `lte` (less than or equal) operators.
    - **Follower Range**: Numeric range filtering on account size.
- **Security Filter**: Ensures only verified and active listings (not owned by the searcher) are displayed.

**Location**: `server/controllers/searchController.js` -> `searchListings`

---

## 4. Admin Analytics & Revenue Forecasting
The admin dashboard performs real-time aggregation of transaction data to visualize platform performance.

### Logic Flow
- **Daily Revenue Aggregation**:
    1. Retrieves all paid transactions from the last 7 days.
    2. Initializes a map of the last 7 dates.
    3. Iterates through transactions and increments the revenue and order count for the matching date key (ISO format).
- **Monthly Revenue Aggregation**:
    1. Retrieves transactions from the last 6 months.
    2. Groups them by a formatted string key (e.g., "May 2026").
- **Top Platforms Algorithm**:
    1. Aggregates total revenue and volume per platform.
    2. Sorts the platforms by revenue to identify the most profitable account types.

**Location**: `server/controllers/adminController.js` -> `getAnalytics`

---

## 5. Marketplace Sorting Logic
Used to re-order the marketplace view based on user selection.

### Logic Flow
- **Input**: An array of listing objects and a sort criteria (`price-low`, `price-high`, `newest`).
- **Mechanism**:
    - **Price Low to High**: `(a, b) => a.price - b.price`
    - **Price High to Low**: `(a, b) => b.price - a.price`
    - **Newest**: `(a, b) => new Date(b.createdAt) - new Date(a.createdAt)`

**Location**: `client/src/pages/Marketplace.jsx`
