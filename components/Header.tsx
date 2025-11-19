"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { Briefcase } from "lucide-react";

export function Header() {
  const { connected } = useWallet();

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <Briefcase className="w-8 h-8 text-purple-400 group-hover:text-pink-500 transition-colors" />
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              DAYJOB.FUN
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Jobs
            </Link>
            <Link
              href="/talent"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Talent
            </Link>
            {connected && (
              <>
                <Link
                  href="/post/job"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Post Job
                </Link>
                <Link
                  href="/post/talent"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Post Talent
                </Link>
              </>
            )}
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-600 hover:!from-purple-600 hover:!to-pink-700 !rounded-lg !transition-all" />
          </nav>
        </div>
      </div>
    </header>
  );
}

