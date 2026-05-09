import prisma from "../configs/prisma.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// Controller for checking if user is admin
export const isAdmin = async (req, res) => {
  try {
    return res.json({ isAdmin: true });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Controller for getting dashboard data
export const getDashboard = async (req, res) => {
  try {
    const totalListings = await prisma.listing.count({});
    const transactions = await prisma.transaction.findMany({
      where: { isPaid: true },
      select: { amount: true },
    });

    const totalRevenue = transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

    const activeListings = await prisma.listing.count({
      where: { status: "active" },
    });

    const totalUser = await prisma.user.count({});

    const recentListings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { owner: true },
    });

    const totalOrders = transactions.length;

    const pendingWithdrawals = await prisma.withdrawal.count({
      where: { isWithdrawn: false },
    });

    const unverifiedListings = await prisma.listing.count({
      where: { isCredentialVerified: false, status: { not: "deleted" } },
    });
    return res.json({
      dashboardData: {
        totalListings,
        totalRevenue,
        totalOrders,
        totalUser,
        activeListings,
        pendingWithdrawals,
        unverifiedListings,
        recentListings,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Controller for getting all listings
export const getAllListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });
    if (!listings || listings.length === 0) {
      return res.json({ listings: [] });
    }
    return res.json({ listings });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Change listing status
export const changeStatus = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { status } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { status },
    });
    return res.json({ message: "Listing status updated" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Controller for getting all unverified listings with credentials submitted
export const getAllUnverifiedListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        isCredentialSubmitted: true,
        isCredentialVerified: false,
        status: { not: "deleted" },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!listings || listings.length === 0) {
      return res.json({ listings: [] });
    }
    return res.json({ listings });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Controller for getting credential
export const getCredential = async (req, res) => {
  try {
    const { listingId } = req.params;
    const credential = await prisma.credential.findFirst({
    where: { listingId }
})

if (!credential || !credential.id) {
    return res.status(404).json({message: "Credential not found" });
}

    return res.json({ credential });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Mark credential as verified
export const markCredentialVerified = async (req, res) => {
  try {
    const { listingId } = req.params;

    await prisma.listing.update({
      where: { id: listingId },
      data: { 
        isCredentialVerified: true,
        status: "active"
      },
    });

    return res.json({ message: "Credential marked as verified" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Get all un-changed listings
export const getAllUnChangedListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        isCredentialSubmitted: true,
        isCredentialVerified: true,
        isCredentialChanged: false,
        status: { not: "deleted" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!listings || listings.length === 0) {
      return res.json({ listings: [] });
    }

    return res.json({ listings });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Change credential for verified listing
export const changeCredential = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { newCredential, credentialId } = req.body;

    if (!listingId || !credentialId) {
      return res
        .status(400)
        .json({ message: "listingId or credentialId missing" });
    }

    const credentialExists = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credentialExists) {
      return res.status(404).json({ message: "Credential not found" });
    }

    await prisma.credential.update({
      where: { id: credentialId },
      data: { updatedCredential: newCredential },
    });

    const listingExists = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listingExists) {
      return res.status(404).json({ message: "Listing not found" });
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { isCredentialChanged: true },
    });

    return res.json({ message: "Credential changed successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ message: error?.meta?.cause || error.code || error.message });
  }
};

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { isPaid: true },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { owner: true } } },
    });

    const customers = await prisma.user.findMany({
      where: { id: { in: transactions.map((t) => t.userId) } },
      select: { id: true, email: true, name: true, image: true },
    });

    transactions.forEach((t) => {
      const customer = customers.find((c) => c.id == t.userId);
      t.listing.customer = { ...customer };
    });

    if (!transactions || transactions.length === 0) {
      return res.json({ transactions: [] });
    }

    return res.json({ transactions });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Controller For Getting All Withdraw Requests
export const getAllWithdrawRequests = async (req, res) => {
  try {
    const requests = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });

    if (!requests || requests.length === 0) {
      return res.json({ requests: [] });
    }

    return res.json({ requests });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Controller for making withdrawal as paid
export const markWithdrawalAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
    });
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.isWithdrawn) {
      return res
        .status(400)
        .json({ message: "Withdrawal already marked as paid" });
    }

    await prisma.withdrawal.update({
      where: { id },
      data: { isWithdrawn: true },
    });

    return res.json({ message: "Withdrawal marked as paid" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.code || error.message });
  }
};

// Advanced Analytics Controllers
export const getAnalytics = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { isPaid: true },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Daily Stats (Last 7 Days)
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyStats[key] = { date: key, revenue: 0, orders: 0 };
    }

    transactions.forEach((t) => {
      const key = t.createdAt.toISOString().split("T")[0];
      if (dailyStats[key]) {
        dailyStats[key].revenue += t.amount;
        dailyStats[key].orders += 1;
      }
    });

    // Monthly Stats (Last 6 Months)
    const monthlyStats = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyStats[key] = { month: key, revenue: 0 };
    }

    transactions.forEach((t) => {
      const key = t.createdAt.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (monthlyStats[key]) {
        monthlyStats[key].revenue += t.amount;
      }
    });

    return res.json({
      daily: Object.values(dailyStats),
      monthly: Object.values(monthlyStats),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { isPaid: true },
      include: { listing: true },
    });

    const platformStats = {};
    transactions.forEach((t) => {
      const p = t.listing.platform;
      if (!platformStats[p])
        platformStats[p] = { name: p, revenue: 0, count: 0 };
      platformStats[p].revenue += t.amount;
      platformStats[p].count += 1;
    });

    const topPlatforms = Object.values(platformStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const stagnantCount = await prisma.listing.count({
      where: {
        status: "active",
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return res.json({
      topPlatforms,
      alerts: {
        stagnantCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Export Sales Report as PDF
export const exportPDF = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { isPaid: true },
      orderBy: { createdAt: "desc" },
      include: { listing: true },
    });

    const customers = await prisma.user.findMany({
      where: { id: { in: transactions.map((t) => t.userId) } },
      select: { id: true, name: true, email: true },
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    // Table Header
    const tableTop = 150;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("#", 50, tableTop);
    doc.text("Date", 80, tableTop);
    doc.text("Customer", 200, tableTop);
    doc.text("Product (Platform)", 350, tableTop);
    doc.text("Amount", 500, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    let totalRevenue = 0;

    doc.font("Helvetica");
    transactions.forEach((t, index) => {
      const customer = customers.find((c) => c.id === t.userId);
      const customerName = customer ? customer.name || customer.email : "Unknown";
      
      doc.text(index + 1, 50, y);
      doc.text(new Date(t.createdAt).toLocaleDateString(), 80, y);
      doc.text(customerName.substring(0, 25), 200, y);
      doc.text(t.listing.platform, 350, y);
      doc.text(`$${t.amount.toFixed(2)}`, 500, y);

      totalRevenue += t.amount;
      y += 20;

      // Add new page if needed
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveDown();
    doc.fontSize(12).font("Helvetica-Bold").text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 400, y + 20);

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Export Sales Report as Excel
export const exportExcel = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { isPaid: true },
      orderBy: { createdAt: "desc" },
      include: { listing: true },
    });

    const customers = await prisma.user.findMany({
      where: { id: { in: transactions.map((t) => t.userId) } },
      select: { id: true, name: true, email: true },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "S.N.", key: "sn", width: 5 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 30 },
      { header: "Product (Platform)", key: "platform", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    transactions.forEach((t, index) => {
      const customer = customers.find((c) => c.id === t.userId);
      worksheet.addRow({
        sn: index + 1,
        date: new Date(t.createdAt).toLocaleDateString(),
        customer: customer ? `${customer.name || ""} (${customer.email})` : "Unknown",
        platform: t.listing.platform,
        amount: t.amount,
      });
    });

    // Styling header
    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Export Listings as PDF
export const exportListingsPDF = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=listings_report.pdf");

    doc.pipe(res);
    doc.fontSize(20).text("Listings Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    const tableTop = 150;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("#", 50, tableTop);
    doc.text("Title", 80, tableTop);
    doc.text("Platform", 250, tableTop);
    doc.text("Price", 350, tableTop);
    doc.text("Status", 450, tableTop);
    doc.text("Owner", 500, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font("Helvetica");
    listings.forEach((l, index) => {
      doc.text(index + 1, 50, y);
      doc.text(l.title.substring(0, 30), 80, y);
      doc.text(l.platform, 250, y);
      doc.text(`$${l.price.toFixed(2)}`, 350, y);
      doc.text(l.status, 450, y);
      doc.text(l.owner.name.substring(0, 15), 500, y);

      y += 20;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Export Listings as Excel
export const exportListingsExcel = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Listings");

    worksheet.columns = [
      { header: "S.N.", key: "sn", width: 5 },
      { header: "Title", key: "title", width: 40 },
      { header: "Platform", key: "platform", width: 15 },
      { header: "Price", key: "price", width: 10 },
      { header: "Status", key: "status", width: 10 },
      { header: "Owner", key: "owner", width: 25 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    listings.forEach((l, index) => {
      worksheet.addRow({
        sn: index + 1,
        title: l.title,
        platform: l.platform,
        price: l.price,
        status: l.status,
        owner: l.owner.name,
        createdAt: new Date(l.createdAt).toLocaleString(),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=listings_report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Export Withdrawals as PDF
export const exportWithdrawalsPDF = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=withdrawals_report.pdf");

    doc.pipe(res);
    doc.fontSize(20).text("Withdrawals Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown();

    const tableTop = 150;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("#", 50, tableTop);
    doc.text("Date", 80, tableTop);
    doc.text("User", 180, tableTop);
    doc.text("Amount", 350, tableTop);
    doc.text("Status", 450, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    let totalWithdrawn = 0;
    doc.font("Helvetica");
    withdrawals.forEach((w, index) => {
      doc.text(index + 1, 50, y);
      doc.text(new Date(w.createdAt).toLocaleDateString(), 80, y);
      doc.text(w.user.name, 180, y);
      doc.text(`$${w.amount.toFixed(2)}`, 350, y);
      doc.text(w.isWithdrawn ? "Paid" : "Pending", 450, y);

      if (w.isWithdrawn) totalWithdrawn += w.amount;
      y += 20;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveDown();
    doc.fontSize(12).font("Helvetica-Bold").text(`Total Paid: $${totalWithdrawn.toFixed(2)}`, 350, y + 20);

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Export Withdrawals as Excel
export const exportWithdrawalsExcel = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Withdrawals");

    worksheet.columns = [
      { header: "S.N.", key: "sn", width: 5 },
      { header: "Date", key: "date", width: 15 },
      { header: "User", key: "user", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Account Info", key: "account", width: 50 },
    ];

    withdrawals.forEach((w, index) => {
      worksheet.addRow({
        sn: index + 1,
        date: new Date(w.createdAt).toLocaleDateString(),
        user: w.user.name,
        amount: w.amount,
        status: w.isWithdrawn ? "Paid" : "Pending",
        account: JSON.stringify(w.account),
      });
    });

    worksheet.getRow(1).font = { bold: true };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=withdrawals_report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};