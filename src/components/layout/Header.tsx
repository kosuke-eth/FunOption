import { Link } from "react-router-dom";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useGetSigner } from "utils/useGetSigner";
import { switchNetwork } from "appkit";
import { GLOBAL_CONFIG } from "core/configs";
import { getUSDC } from "core/token";
import { useState } from "react";

export default function Header() {
  const { address } = useAppKitAccount();
  const { open } = useAppKit();
  const getSigner = useGetSigner();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showQRPopover, setShowQRPopover] = useState(false);

  const reqUSDC = async () => {
    await switchNetwork(GLOBAL_CONFIG.chainId);
    setIsRequesting(true);
    const signer = await getSigner();
    await getUSDC(GLOBAL_CONFIG.chainId, signer);
    setIsRequesting(false);
    window.location.reload();
  };

  return (
    <header className="bg-dark shadow-sm">
      <nav className="max-w-7xl px-6 mx-auto">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl flex items-center gap-1.5 font-bold text-white"
            >
              <img src="/Favicon.png" alt="logo" className="w-6 h-6" />
              FunOption
            </Link>
          </div>
          <div className="flex gap-5 items-center">
            <Link to="/profile" className="text-white">
              History
            </Link>

            <div className="relative">

              {/* QR 코드 팝오버 */}
              {showQRPopover && (
                <div className="fixed right-8 top-8 bg-dark rounded-2xl overflow-hidden shadow-lg z-50 w-[280px]">
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQRPopover(false);
                      }}
                      className="text-gray-500 hover:text-gray-700 bg-dark rounded-full p-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    onClick={() =>
                      window.open(
                        "https://discord.com/invite/sWgxD22FdQ",
                        "_blank"
                      )
                    }
                    className="cursor-pointer"
                  >
                    <img
                      src="/images/qrs.png"
                      alt="qrcodes"
                      className="w-full h-full object-contain -mr-4"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* <a href="https://citrea.xyz/faucet" className="text-gray-800">
              Faucet
            </a> */}

            {address ? (
              <appkit-account-button />
            ) : (
              <button
                onClick={() => open()}
                className="btn-primary"
              >
                Connect Wallet
              </button>
            )}

            <button
              disabled={isRequesting}
              className="btn-ghost"
              onClick={reqUSDC}
            >
              {isRequesting ? "Getting USDC..." : "Request USDC"}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
