import type { Metadata } from "next";
import { Toaster }            from "react-hot-toast";
import { AuthProvider }       from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import CookieSyncWrapper      from "@/components/auth/CookieSyncWrapper";
import "@/app/globals.css";

export const metadata: Metadata = {
  title:       "CivicReport — Report & Resolve Civic Issues",
  description: "Crowdsourced civic issue reporting and resolution system",
  keywords:    ["civic", "issues", "reporting", "government", "community"],
  authors:     [{ name: "CivicReport" }],
  openGraph: {
    title:       "CivicReport",
    description: "Report and resolve civic issues in your city",
    type:        "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <NotificationProvider>
            <CookieSyncWrapper />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#fff",
                  color:      "#1f2937",
                  fontSize:   "14px",
                  boxShadow:  "0 4px 12px rgba(0,0,0,0.1)",
                  border:     "1px solid #e5e7eb",
                },
                success: {
                  iconTheme: { primary: "#16a34a", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}