"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingControls() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show "Top" button when page is scrolled down 300px
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
            {/* Scroll to Top Button */}
            <button
                type="button"
                onClick={scrollToTop}
                className={cn(
                    "p-3 rounded-full bg-primary text-white shadow-lg transition-all duration-300 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
                )}
                aria-label="Scroll to top"
                title="Scroll to Top"
            >
                <ArrowUp className="w-5 h-5" />
            </button>
        </div>
    );
}
