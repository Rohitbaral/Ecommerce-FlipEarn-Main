import axios from "axios";
import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";
import { clerkClient } from "@clerk/express";

/**
 * Initiate Khalti Payment
 * Route: POST /api/payment/khalti-initiate
 */
export const initiateKhaltiPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    // Fetch order (Transaction) from database
    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    // Fetch buyer details (User)
    const buyer = await prisma.user.findUnique({
        where: { id: transaction.userId }
    })

    if (!buyer) {
        return res.status(404).json({ success: false, message: "Buyer not found" });
    }

    const amount_in_paisa = Math.round(transaction.amount * 100);

    const payload = {
      return_url: `${process.env.FRONTEND_URL}/payment-success`,
      website_url: process.env.FRONTEND_URL,
      amount: amount_in_paisa,
      purchase_order_id: transaction.id,
      purchase_order_name: `Order Payment for ${transaction.listing.title}`,
      customer_info: {
        name: buyer.name,
        email: buyer.email,
        phone: "9800000000", // Phone is not in my User model, using placeholder as per Khalti requirement if not available
      },
    };

    console.log("Khalti Initiate Payload:", JSON.stringify(payload, null, 2));

    let response;
    try {
        response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/initiate/",
            payload,
            {
              headers: {
                Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
    } catch (apiError) {
        console.error("Khalti API POST Error:", apiError.response?.data || apiError.message);
        return res.status(apiError.response?.status || 500).json({
            success: false,
            message: "Khalti API error",
            details: apiError.response?.data || apiError.message
        });
    }

    if (response.data && response.data.pidx) {
      return res.json({
        success: true,
        paymentUrl: response.data.payment_url,
        pidx: response.data.pidx
      });
    } else {
      console.error("Khalti response missing pidx:", response.data);
      return res.status(400).json({ success: false, message: "Invalid response from Khalti", data: response.data });
    }
  } catch (error) {
    console.error("Khalti Controller Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * Verify Khalti Payment
 * Route: POST /api/payment/khalti-verify
 */
export const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, orderId } = req.body;

    if (!pidx || !orderId) {
      return res.status(400).json({ success: false, message: "pidx and orderId are required" });
    }

    let response;
    try {
        response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/lookup/",
            { pidx },
            {
              headers: {
                Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );
    } catch (apiError) {
        console.error("Khalti Verify API Error:", apiError.response?.data || apiError.message);
        return res.status(apiError.response?.status || 500).json({
            success: false,
            message: "Khalti verification API failed",
            details: apiError.response?.data || apiError.message
        });
    }

    console.log("Khalti Verify Response:", response.data);

    if (response.data.status?.toLowerCase() === "completed") {
      // Check if transaction is already paid to avoid duplicate updates (Idempotency)
      const existingTransaction = await prisma.transaction.findUnique({
        where: { id: orderId },
      });

      if (!existingTransaction) {
          return res.status(404).json({ success: false, message: "Transaction not found locally" });
      }

      if (existingTransaction.isPaid) {
        return res.json({ success: true, message: "Payment already verified" });
      }

      try {
          // Use Prisma transaction for atomicity
          const updatedTransaction = await prisma.$transaction(async (tx) => {
              // 1. Update order status -> paid
              const t = await tx.transaction.update({
                where: { id: orderId },
                data: { isPaid: true },
                include: { listing: true }
              });

              // 2. Mark the listing as sold
              await tx.listing.update({
                where: { id: t.listingId },
                data: { status: "sold" },
              });

              // 3. Calculate fee based on owner's plan
              const owner = await clerkClient.users.getUser(t.ownerId);
              const ownerPlan = owner.publicMetadata?.plan === 'premium' ? 'premium' : 'free';
              const feePercentage = ownerPlan === 'premium' ? 0.07 : 0.10;
              const feeAmount = t.amount * feePercentage;
              const earnedAmount = t.amount - feeAmount;

              // 4. Add the net amount to the user's (owner's) earned balance
              await tx.user.update({
                where: { id: t.ownerId },
                data: { earned: { increment: earnedAmount } },
              });

              return t;
          });

          // 4. Send New Credentials to the buyer purchase using inngest (Outside transaction)
          try {
              await inngest.send({
                name: "app/purchase",
                data: { transaction: updatedTransaction },
              });
          } catch (inngestError) {
              console.error("Inngest send error (non-fatal):", inngestError);
              // We don't return error here because DB is already updated
          }

          return res.json({ success: true, message: "Payment successful" });
      } catch (dbError) {
          console.error("Database update error after payment:", dbError);
          return res.status(500).json({ 
              success: false, 
              message: "Error updating database after payment", 
              detail: dbError.message,
              stack: dbError.stack 
          });
      }
    } else {
      return res.status(400).json({ success: false, message: "Payment is not in Completed status", status: response.data.status });
    }
  } catch (error) {
    console.error("Khalti Verify Controller Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
