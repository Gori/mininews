import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // Remove Geist
import { Public_Sans } from "next/font/google"; // Import Public Sans
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Remove Geist setup
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// 
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// Configure Public Sans
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans", // Define CSS variable
  weight: ["500", "700"], // Include base and heading weights
});

export const metadata: Metadata = {
  title: "MiniNews - Simple Newsletter Tool",
  description: "A minimal newsletter creation tool with Google Drive and Gmail integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
          socialButtonsBlockButton: "hidden",
          socialButtonsIconButton: "",
          footerActionLink: "text-blue-600",
          dividerRow: "hidden",
          dividerText: "hidden",
          formFieldInput: "hidden",
          formFieldLabel: "hidden",
          formButtonReset: "hidden",
          identityPreview: "hidden",
          card: "py-4",
        }
      }}
      localization={{
        signIn: {
          start: {
            title: "Sign in with Gmail",
            subtitle: "Please sign in with your Google account to continue",
            actionText: ""
          }
        }
      }}
    >
      <html lang="en">
        {/* Apply the Public Sans variable and base styles to the body */}
        <body className={`${publicSans.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
