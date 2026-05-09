import express from "express";
import { protectAdmin } from "../middlewares/authMiddleware.js";
import { changeCredential, changeStatus, exportExcel, exportListingsExcel, exportListingsPDF, exportPDF, exportWithdrawalsExcel, exportWithdrawalsPDF, getAllListings, getAllTransactions, getAllUnChangedListings, getAllUnverifiedListings, getAllWithdrawRequests, getAnalytics, getCredential, getDashboard, getTopProducts, isAdmin, markCredentialVerified, markWithdrawalAsPaid } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get('/isAdmin', protectAdmin, isAdmin);
adminRouter.get('/dashboard', protectAdmin, getDashboard);
adminRouter.get('/analytics', protectAdmin, getAnalytics);
adminRouter.get('/top-products', protectAdmin, getTopProducts);
adminRouter.get('/all-listings', protectAdmin, getAllListings);
adminRouter.put('/change-status/:listingId', protectAdmin, changeStatus);
adminRouter.get('/unverified-listings', protectAdmin, getAllUnverifiedListings);
adminRouter.get('/credential/:listingId', protectAdmin, getCredential);
adminRouter.put('/verify-credential/:listingId', protectAdmin, markCredentialVerified);
adminRouter.get('/unchanged-listings', protectAdmin, getAllUnChangedListings);
adminRouter.put('/change-credential/:listingId', protectAdmin, changeCredential);
adminRouter.get('/transactions', protectAdmin, getAllTransactions);
adminRouter.get('/withdraw-requests', protectAdmin, getAllWithdrawRequests);
adminRouter.put('/withdrawal-mark/:id', protectAdmin, markWithdrawalAsPaid);

// Export routes
adminRouter.get('/export/transactions/pdf', protectAdmin, exportPDF);
adminRouter.get('/export/transactions/excel', protectAdmin, exportExcel);
adminRouter.get('/export/listings/pdf', protectAdmin, exportListingsPDF);
adminRouter.get('/export/listings/excel', protectAdmin, exportListingsExcel);
adminRouter.get('/export/withdrawals/pdf', protectAdmin, exportWithdrawalsPDF);
adminRouter.get('/export/withdrawals/excel', protectAdmin, exportWithdrawalsExcel);
export default adminRouter;