import React from "react";
import Link  from "next/link";
import { Github, Mail, Globe } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-bold text-gray-900">
                Civic<span className="text-primary-600">Report</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Empowering citizens to report and resolve civic issues in their
              communities. Together we build better cities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Quick Links
            </p>
            <ul className="space-y-2">
              {[
                { href: "/",           label: "Home"         },
                { href: "/login",      label: "Sign In"      },
                { href: "/register",   label: "Register"     },
                { href: "/dashboard",  label: "Dashboard"    },
                { href: "/map",        label: "Issue Map"    },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Contact</p>
            <ul className="space-y-2.5">
              <li>
                
                <a  href="mailto:support@civicreport.gov.in"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Mail size={14} />
                  support@civicreport.gov.in
                </a>
              </li>
              <li>
                
              <a    href="#"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Globe size={14} />
                  www.civicreport.gov.in
                </a>
              </li>
              <li>
                
                <a  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Github size={14} />
                  Open Source
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {currentYear} CivicReport. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { href: "#", label: "Privacy Policy"   },
              { href: "#", label: "Terms of Service" },
              { href: "#", label: "Accessibility"    },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}