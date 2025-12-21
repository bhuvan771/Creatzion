import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";


const inter = Inter({subsets:["latin"]});
export const metadata = {
  title: "Creatzion",
  description: "One Stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {/*header*/}
          <Header/> 
          <main className="min-h-screen">{children}</main>
          <Toaster richColors/>
          
         <footer className="border-t border-gray-100 bg-white">
  <div className="mx-auto max-w-7xl px-6 py-4">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

      <p className="text-sm font-medium text-gray-900">
        Creatzion
      </p>

      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} · Intelligent finance platform
      </p>

    </div>
  </div>
</footer>


        </body>
      </html>
    </ClerkProvider>
  );
}
