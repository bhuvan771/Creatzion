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
     <ClerkProvider
     publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  frontendApi={process.env.CLERK_FRONTEND_API}
     >
    <html lang="en">
      <body className={`${inter.className} `}>
        {/*header*/}
        <Header/> 
       <main className="min-h-screen">{children}</main>
       <Toaster richColors/>
        {/*footer*/}
        <footer className="bg-blue-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600"> 
          <p>Made by YRB Coders</p>
        </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
