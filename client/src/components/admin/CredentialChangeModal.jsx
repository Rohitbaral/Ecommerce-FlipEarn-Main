import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  ArrowUpRightFromSquareIcon,
  CopyIcon,
  Loader2Icon,
  XIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getProfileLink } from "../../assets/assets";
import { useAuth } from "@clerk/clerk-react";
import api from "../../configs/axios";

const CredentialChangeModal = ({ listing, onClose }) => {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState(null);
  const [newCredential, setNewCredential] = useState(null);
  const [isChanged, setIsChanged] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [showNewPasswords, setShowNewPasswords] = useState({});

  const copyToClipboard = ({ name, value }) => {
    navigator.clipboard.writeText(value);
    toast.success(`${name} copied to clipboard`);
  };

  const fetchCredential = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/admin/credential/${listing.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCredential(data.credential);
      setNewCredential(
        (data.credential.originalCredential || []).map((cred) => ({
          ...cred,
          value: "",
        })),
      );
      setLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
      setLoading(false);
    }
  };

  const changeCredential = async () => {
    if (!listing?.id || !credential?.id) {
      toast.error("Listing ID or Credential ID is missing");
      return;
    }

    if (newCredential.some((cred) => !cred.value)) {
      toast.error("Please fill in all new credential fields");
      return;
    }

    // Email validation
    for (const cred of newCredential) {
      if (cred.name.toLowerCase().includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cred.value)) {
          return toast.error(`Please enter a valid email address for ${cred.name}`);
        }
      }
    }
    try {
      const token = await getToken();
      const { data } = await api.put(
        `/api/admin/change-credential/${listing.id}`,
        {
          newCredential,
          credentialId: credential.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success(data.message);
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "An error occurred while changing credential",
      );
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCredential();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-100 flex items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-2xl w-full max-w-xl h-screen sm:h-[450px] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 text-white p-4 sm:rounded-t-lg flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{listing?.title}</h3>
            <p className="text-sm text-indigo-100 truncate">
              changing credentials for{" "}
              <span className="font-medium text-white">
                {listing?.username}
              </span>{" "}
              on {listing?.platform}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 hover:bg-white/20 hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2Icon className="animate-spin text-indigo-500 size-6" />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 p-4 overflow-y-scroll text-gray-700">
            {credential?.originalCredential.map((cred, index) => (
              <div key={index} className="w-full flex items-center gap-2 group">
                <span className="font-medium">{cred.name}</span> :{" "}
                {cred.name.toLowerCase() === "password" && !showPasswords[index]
                  ? "********"
                  : cred?.value}
                {cred.name.toLowerCase() === "password" && (
                  <button
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }))
                    }
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={
                      showPasswords[index] ? "Hide password" : "Show password"
                    }
                  >
                    {showPasswords[index] ? (
                      <EyeOff size={14} className="text-gray-500" />
                    ) : (
                      <Eye size={14} className="text-gray-500" />
                    )}
                  </button>
                )}
                <CopyIcon
                  onClick={() => copyToClipboard(cred)}
                  size={14}
                  className="group-hover:visible invisible"
                />
              </div>
            ))}

            <div className="text-sm flex gap-1 items-center">
              <p>Open Platform : </p>
              <Link
                to={getProfileLink(listing.platform, listing.username)}
                target="_blank"
                className="flex gap-1 items-center text-indigo-500"
              >
                click here
                <ArrowUpRightFromSquareIcon size={13} />
              </Link>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <h3 className="text-lg">Add New Credentials</h3>
              {newCredential?.map((cred, index) => (
                <div
                  key={index}
                  className="w-full flex items-center gap-2 group max-w-sm"
                >
                  <span className="font-medium">{cred.name}</span> :{" "}
                  <div className="relative w-full">
                    <input
                      type={
                        cred.name.toLowerCase() === "password" ||
                        cred.type === "password"
                          ? showNewPasswords[index]
                            ? "text"
                            : "password"
                          : "text"
                      }
                      value={cred.value}
                      onChange={(e) =>
                        setNewCredential((prev) =>
                          prev.map((c, i) =>
                            i === index ? { ...c, value: e.target.value } : c,
                          ),
                        )
                      }
                      className="w-full bg-gray-50 outline-indigo-400 rounded-md p-2 text-sm pr-10"
                    />
                    {(cred.name.toLowerCase() === "password" ||
                      cred.type === "password") && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPasswords((prev) => ({
                            ...prev,
                            [index]: !prev[index],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPasswords[index] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-start mt-2">
              <input
                type="checkbox"
                onChange={() => setIsChanged((prev) => !prev)}
                className="size-4 mt-0.5 text-indigo-500 bg-gray-100"
              />
              <p className="text-gray-500 text-sm">
                I have changed the credentials above and provided the new
                credential <br /> If credential are not correct, please contact
                the owner of the listing.
              </p>
            </div>

            <button
              onClick={changeCredential}
              disabled={!isChanged || !credential?.id}
              className="mt-2 text-sm bg-indigo-500 not-disabled:hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-md"
            >
              Change Credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialChangeModal;
