import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Clean, readable modern sans-serif
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CSC Review Platform",
    description: "Interactive Civil Service Exam Mock Tests",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Inline script to prevent FOUC — reads theme before React hydrates */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem('theme');var d=t!=='light';var r=document.documentElement;if(d){r.classList.add('dark')}else{r.classList.remove('dark')}r.style.colorScheme=d?'dark':'light'}catch(e){document.documentElement.classList.add('dark')}})()`,
                    }}
                />
            </head>
            <body className={`${inter.className} antialiased`}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
