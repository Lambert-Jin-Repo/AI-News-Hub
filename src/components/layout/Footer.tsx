import Link from "next/link";
import { Terminal } from "lucide-react";

export function Footer() {
    return (
        <footer className="mt-12 bg-[#EBEBDF] dark:bg-[#0c1a19] border-t border-gray-200 dark:border-gray-800 py-10">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <span className="text-[#0d1b1a] dark:text-gray-200 font-bold">
                        AI News Hub
                    </span>
                </div>
                <div className="flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Link href="#" className="hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="hover:text-primary transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="#" className="hover:text-primary transition-colors">
                        Contact
                    </Link>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    © 2023 AI News Hub. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
