import { Link } from "react-router-dom";
import '@solana/wallet-adapter-react-ui/styles.css';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect, useRef } from "react";
import { useDevnetAirdrop } from "hooks/useDevnetAirdrop";
import { useUsdcDevFaucet } from "solana/faucet";

export default function Header() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showQRPopover, setShowQRPopover] = useState(false);
  const requestSol = useDevnetAirdrop();
  const requestUsdc = useUsdcDevFaucet();
  const [isRequestingUsdc, setIsRequestingUsdc] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // モバイルメニュー外側をクリックした時に閉じる処理
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!mobileMenuOpen) return; // メニューが開いていない場合は無視
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="w-full bg-funoption-bg shadow-sm">
      <nav className="px-4 md:px-8 w-full">
        <div className="flex justify-between h-16 items-center w-full">
          <div className="flex items-center min-w-0">
            <Link
              to="/"
              className="text-xl flex items-center gap-1.5 font-bold text-white"
            >
              <img src="/Favicon.png" alt="logo" className="w-6 h-6 flex-shrink-0" />
              <span className="block whitespace-nowrap">
                FunOption
              </span>
            </Link>
          </div>

          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center gap-5 ml-auto">
            <Link to="/ai-chat" className="text-white hover:text-gray-300 transition-colors">
              AI Chat
            </Link>
            <Link to="/profile" className="text-white hover:text-gray-300 transition-colors">
              History
            </Link>
            <WalletMultiButton className="btn-primary" />
            <button
              disabled={!publicKey || isRequestingUsdc}
              className="btn-ghost"
              onClick={async () => {
                setIsRequestingUsdc(true);
                if (publicKey) {
                  const balance = await connection.getBalance(publicKey);
                  if (balance < 0.1 * LAMPORTS_PER_SOL) {
                    await requestSol();
                  }
                }
                await requestUsdc();
                setIsRequestingUsdc(false);
              }}
            >
              {isRequestingUsdc ? "Minting USDC..." : "Request USDC"}
            </button>
          </div>

          {/* モバイルメニュー表示ボタン＋ウォレット */}
          <div className="flex md:hidden justify-end items-center gap-4">
            <div>
              <WalletMultiButton className="btn-primary" />
            </div>
            <div
              ref={toggleButtonRef}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="focus:outline-none"
              aria-label="Menu"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* モバイルメニュー */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden fixed top-16 left-0 w-full bg-funoption-bg border-t border-gray-700 py-4 px-6 space-y-4 z-40"
          >
            <Link
              to="/ai-chat"
              className="block text-white py-2 hover:text-gray-300 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI Chat
            </Link>
            <Link
              to="/profile"
              className="block text-white py-2 hover:text-gray-300 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              History
            </Link>
            <button
              disabled={!publicKey || isRequestingUsdc}
              className="w-full text-left py-2 text-white hover:text-gray-300 transition-colors"
              onClick={async () => {
                setMobileMenuOpen(false);
                setIsRequestingUsdc(true);
                if (publicKey) {
                  const balance = await connection.getBalance(publicKey);
                  if (balance < 0.1 * LAMPORTS_PER_SOL) {
                    await requestSol();
                  }
                }
                await requestUsdc();
                setIsRequestingUsdc(false);
              }}
            >
              {isRequestingUsdc ? "Minting USDC..." : "Request USDC"}
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
