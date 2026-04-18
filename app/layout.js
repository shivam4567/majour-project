import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import ThemeProvider from "@/components/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
export const metadata = {
  title: "AI Car Marketplace",
  description: "Find your dream car",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${spaceGrotesk.className} ${spaceGrotesk.variable} app-body`}>
          <ThemeProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />

            <footer className="border-t border-border bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>Made by Shivam Rathod</p>
              </div>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>

  );
}
