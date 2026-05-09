import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/axios";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your payment with Khalti...");

  useEffect(() => {
    const verifyPayment = async () => {
      // 1. Get pidx from URL
      const searchParams = new URLSearchParams(window.location.search);
      const pidx = searchParams.get("pidx");
      const statusParam = searchParams.get("status");

      // 2. Get orderId from sessionStorage
      const orderId = sessionStorage.getItem("currentOrderId");

      if (!pidx || !orderId) {
        setStatus("error");
        setMessage("Invalid payment session or missing information.");
        return;
      }

      if (statusParam && !["Completed", "completed"].includes(statusParam)) {
          setStatus("error");
          setMessage(statusParam === "User canceled" ? "Payment was canceled by the user." : `Payment status: ${statusParam}`);
          sessionStorage.removeItem("currentOrderId");
          return;
      }

      try {
        // 3. Call backend verify API
        const { data } = await api.post("/api/payment/khalti-verify", {
          pidx,
          orderId,
        });

        if (data.success) {
          setStatus("success");
          setMessage("Payment successful! Your account credentials have been sent to your email.");
        } else {
          setStatus("error");
          setMessage(data.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Verification Error:", error.response?.data || error);
        setStatus("error");
        setMessage(error.response?.data?.message || "An error occurred during payment verification.");
      } finally {
        // 4. Cleanup
        sessionStorage.removeItem("currentOrderId");
        // 5. Remove query params from URL
        window.history.replaceState({}, document.title, "/payment-success");
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center space-y-6">
        
        {status === "verifying" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Verifying Payment</h2>
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-in zoom-in duration-500">
            <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Payment Paid!</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {message}
            </p>
            <div className="pt-4 flex flex-col gap-3">
               <button
                onClick={() => navigate("/loading/my-orders")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                View My Orders
              </button>
              <button
                onClick={() => navigate("/marketplace")}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-in zoom-in duration-500">
            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Payment Failed</h2>
            <p className="text-gray-500">{message}</p>
            <div className="pt-4">
              <button
                onClick={() => navigate("/marketplace")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Back to Marketplace
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentSuccess;
