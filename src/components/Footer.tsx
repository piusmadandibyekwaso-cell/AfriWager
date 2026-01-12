import Link from "next/link";
import React from "react";

const Footer = () => {
    return (
        <footer className="w-full border-t border-white/5 bg-[#060709] py-8 text-xs text-white/40 md:text-sm">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:px-8">
                <div className="flex flex-col justify-between gap-6 md:flex-row">
                    <div className="flex max-w-md flex-col gap-4">
                        <h3 className="font-semibold text-white/80">AfriWager Regulatory Sandbox</h3>
                        <p>
                            AfriWager is currently optimizing for the CMA Regulatory Sandbox
                            (Uganda). Our platform operates as a peer-to-peer marketplace for
                            event-contingent contracts.
                        </p>
                        <p>
                            AfriWager is not a licensed bookmaker and does not accept wagers
                            against the house. All trades are peer-to-peer.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-white/80">Resources</h4>
                        <Link
                            href="/financial-literacy" // Placeholder for now
                            className="hover:text-emerald-400 hover:underline"
                        >
                            Financial Literacy
                        </Link>
                        <Link
                            href="/terms"
                            className="hover:text-emerald-400 hover:underline"
                        >
                            Terms of Use
                        </Link>
                        <Link
                            href="/risks"
                            className="hover:text-emerald-400 hover:underline"
                        >
                            Risk Disclosure
                        </Link>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 text-center">
                    <p>© {new Date().getFullYear()} AfriWager. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
